import Advertisement from '#models/advertisement'
import AdvertisementEvent from '#models/advertisement_event'
import AdvertisementPolicy from '#policies/advertisement_policy'
import {
  CreateAdvertisementValidator,
  UpdateAdvertisementValidator,
} from '#validators/advertisement'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type Placement = 'home' | 'server'

/**
 * Convertit une chaîne ISO en DateTime, ou null si vide/invalide.
 */
function parseDate(value: string | null | undefined): DateTime | null {
  if (!value) return null
  const parsed = DateTime.fromISO(value)
  return parsed.isValid ? parsed : null
}

/**
 * Décode les entités HTML les plus courantes (le navigateur les décode côté client,
 * il faut donc comparer sur la même base).
 */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x26;/gi, '&')
}

/**
 * Retire les caractères de contrôle (saut de ligne, tabulation, etc.) d'une URL.
 * Les navigateurs les retirent des URLs ; ils sont surtout interdits dans un
 * en-tête HTTP et provoqueraient un crash s'ils étaient renvoyés tels quels.
 */
function sanitizeUrl(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim()
}

/**
 * Extrait les URLs des attributs href présents dans le HTML d'une publicité.
 * Sert de liste blanche pour la redirection de clic (anti open-redirect).
 */
function extractHrefs(html: string): Set<string> {
  const urls = new Set<string>()
  const regex = /href\s*=\s*["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const href = sanitizeUrl(match[1])
    urls.add(href)
    urls.add(sanitizeUrl(decodeHtmlEntities(href)))
  }
  return urls
}

/**
 * Normalise un placement reçu en requête.
 */
function normalizePlacement(value: unknown): Placement | null {
  return value === 'home' || value === 'server' ? value : null
}

/**
 * Recherche une publicité à partir d'un id de route potentiellement non numérique
 * (évite une erreur SQL si l'id est invalide).
 */
function findAdById(id: string): Promise<Advertisement | null> {
  const numericId = Number.parseInt(id, 10)
  return Number.isFinite(numericId) ? Advertisement.find(numericId) : Promise.resolve(null)
}

export default class AdvertisementsController {
  /**
   * Liste publique des publicités diffusables pour un emplacement donné.
   * Le frontend effectue la rotation pondérée parmi le résultat.
   */
  async index({ request, response }: HttpContext) {
    const placement = normalizePlacement(request.input('placement'))
    if (!placement) {
      return response.badRequest({ error: 'Invalid or missing placement' })
    }

    const now = new Date()
    const placementColumn = placement === 'home' ? 'show_on_home' : 'show_on_server'

    const ads = await Advertisement.query()
      .where('enabled', true)
      .where(placementColumn, true)
      .where((q) => q.whereNull('starts_at').orWhere('starts_at', '<=', now))
      .where((q) => q.whereNull('ends_at').orWhere('ends_at', '>=', now))
      .preload('categories')

    let visible = ads
    if (placement === 'server') {
      const categoryIds = String(request.input('categoryIds', ''))
        .split(',')
        .map((v) => Number.parseInt(v, 10))
        .filter((v) => Number.isFinite(v))

      // Une pub sans catégorie cible toutes les catégories ; sinon il faut un recoupement.
      visible = ads.filter(
        (ad) =>
          ad.categories.length === 0 ||
          ad.categories.some((category) => categoryIds.includes(category.id))
      )
    }

    return response.ok(
      visible.map((ad) => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        htmlContent: ad.htmlContent,
        weight: ad.weight,
      }))
    )
  }

  /**
   * Enregistre une impression (la pub a été affichée). Public, idempotence gérée côté client.
   */
  async recordImpression({ params, request, response }: HttpContext) {
    const ad = await findAdById(params.id)
    // On ne révèle pas l'existence de la pub : réponse identique dans tous les cas.
    if (ad) {
      const serverId = Number.parseInt(request.input('serverId'), 10)
      try {
        await AdvertisementEvent.create({
          advertisementId: ad.id,
          type: 'impression',
          placement: normalizePlacement(request.input('placement')),
          serverId: Number.isFinite(serverId) ? serverId : null,
        })
      } catch (error) {
        // Le tracking est best-effort : un échec ne doit pas faire échouer la requête.
        console.error('Failed to record ad impression event', error)
      }
    }
    return response.noContent()
  }

  /**
   * Enregistre un clic puis redirige vers l'URL cible.
   * L'URL doit être un lien http(s) valide ET faire partie des liens du HTML de
   * la pub (anti open-redirect, et protection contre l'injection d'en-tête).
   */
  async click({ params, request, response }: HttpContext) {
    const ad = await findAdById(params.id)
    if (!ad) {
      return response.redirect('/')
    }

    const to = sanitizeUrl(String(request.input('to', '')))

    let target: string | null = null
    if (to && extractHrefs(ad.htmlContent).has(to)) {
      try {
        const parsed = new URL(to)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          // parsed.href est normalisé : garanti sûr pour un en-tête HTTP Location.
          target = parsed.href
        }
      } catch {
        target = null
      }
    }

    if (!target) {
      return response.redirect('/')
    }

    const serverId = Number.parseInt(request.input('serverId'), 10)
    try {
      await AdvertisementEvent.create({
        advertisementId: ad.id,
        type: 'click',
        placement: normalizePlacement(request.input('placement')),
        serverId: Number.isFinite(serverId) ? serverId : null,
        targetUrl: target.slice(0, 2048),
      })
    } catch (error) {
      // Le tracking est best-effort : un échec ne doit jamais empêcher la redirection.
      console.error('Failed to record ad click event', error)
    }

    response.header('Location', target)
    return response.status(302).send('')
  }

  /**
   * Liste complète des publicités avec compteurs d'impressions/clics (admin).
   */
  async adminIndex({ response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ads = await Advertisement.query()
      .preload('categories')
      .withCount('events', (q) => q.where('type', 'impression').as('impressionsCount'))
      .withCount('events', (q) => q.where('type', 'click').as('clicksCount'))
      .orderBy('created_at', 'desc')

    return response.ok(
      ads.map((ad) => ({
        ...ad.serialize(),
        impressionsCount: Number(ad.$extras.impressionsCount ?? 0),
        clicksCount: Number(ad.$extras.clicksCount ?? 0),
      }))
    )
  }

  /**
   * Détail d'une publicité (admin).
   */
  async show({ params, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ad = await Advertisement.query()
      .where('id', params.id)
      .preload('categories')
      .firstOrFail()

    return response.ok(ad)
  }

  /**
   * Crée une publicité (admin).
   */
  async store({ request, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const { categoryIds, startsAt, endsAt, ...data } = await request.validateUsing(
      CreateAdvertisementValidator
    )

    const ad = await Advertisement.create({
      ...data,
      startsAt: parseDate(startsAt),
      endsAt: parseDate(endsAt),
    })

    if (categoryIds && categoryIds.length > 0) {
      await ad.related('categories').sync(categoryIds)
    }
    await ad.load('categories')

    return response.created(ad)
  }

  /**
   * Met à jour une publicité (admin).
   */
  async update({ params, request, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ad = await Advertisement.findOrFail(params.id)
    const { categoryIds, startsAt, endsAt, ...data } = await request.validateUsing(
      UpdateAdvertisementValidator
    )

    ad.merge(data)
    if (startsAt !== undefined) ad.startsAt = parseDate(startsAt)
    if (endsAt !== undefined) ad.endsAt = parseDate(endsAt)
    await ad.save()

    if (categoryIds !== undefined) {
      await ad.related('categories').sync(categoryIds)
    }
    await ad.load('categories')

    return response.ok(ad)
  }

  /**
   * Supprime une publicité et ses évènements associés (admin).
   */
  async destroy({ params, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ad = await Advertisement.findOrFail(params.id)
    await ad.delete()

    return response.noContent()
  }

  /**
   * Statistiques temporelles d'impressions et de clics pour une publicité (admin).
   * Paramètres : interval ('hour' | 'day'), fromDate et toDate (epoch ms).
   */
  async stats({ params, request, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ad = await Advertisement.findOrFail(params.id)
    const interval = request.input('interval') === 'hour' ? 'hour' : 'day'
    const fromDate = Number.parseInt(request.input('fromDate'), 10)
    const toDate = Number.parseInt(request.input('toDate'), 10)

    let query = db.from('advertisement_events').where('advertisement_id', ad.id)
    if (Number.isFinite(fromDate)) query = query.where('created_at', '>=', new Date(fromDate))
    if (Number.isFinite(toDate)) query = query.where('created_at', '<=', new Date(toDate))

    const rows = await query
      .select(db.raw('date_trunc(?, created_at) as bucket', [interval]))
      .select(db.raw(`count(*) filter (where type = 'impression') as impressions`))
      .select(db.raw(`count(*) filter (where type = 'click') as clicks`))
      .groupByRaw('bucket')
      .orderByRaw('bucket asc')

    const series = rows.map((row) => ({
      time: row.bucket,
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
    }))

    const totals = series.reduce(
      (acc, row) => ({
        impressions: acc.impressions + row.impressions,
        clicks: acc.clicks + row.clicks,
      }),
      { impressions: 0, clicks: 0 }
    )

    return response.ok({ totals, series, interval })
  }
}
