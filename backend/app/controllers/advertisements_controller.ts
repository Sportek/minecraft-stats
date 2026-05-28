import Advertisement from '#models/advertisement'
import AdvertisementEvent from '#models/advertisement_event'
import AdvertisementPolicy from '#policies/advertisement_policy'
import {
  CreateAdvertisementValidator,
  UpdateAdvertisementValidator,
} from '#validators/advertisement'
import { parseEpochMs } from '#validators/helpers'
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
  // Décodage en une seule passe : la sortie n'est jamais re-traitée, donc
  // aucun risque de double-décodage (ex. "&amp;#38;" reste "&#38;").
  return value.replace(/&(?:amp|#38|#x26);/gi, '&')
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
   * @listAdvertisements
   * @operationId listAdvertisements
   * @tag ADVERTISEMENTS
   * @summary List advertisements eligible for a given placement
   * @description Returns the lightweight list of advertisements currently eligible for the requested placement (`home` or `server`). Only enabled ads inside their scheduling window are returned. For the `server` placement the result is additionally filtered by the supplied `categoryIds` (an ad without any category targets every category). The frontend handles the weighted rotation among the returned items. Publicly accessible.
   * @paramQuery placement - Placement target. Either `home` or `server`. - @type(string) @example(home) @required
   * @paramQuery categoryIds - Comma-separated list of category ids used to filter ads when `placement=server` (ignored otherwise). - @type(string) @example(1,3,5)
   * @responseBody 200 - [{"id": 1, "name": "Summer promo", "type": "custom", "htmlContent": "<a href=\"https://example.com\">Click</a>", "weight": 10}]
   * @responseBody 400 - {"error": "Invalid or missing placement"}
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
   * @recordAdImpression
   * @operationId recordAdImpression
   * @tag ADVERTISEMENTS
   * @summary Record an advertisement impression
   * @description Records an `impression` event for the advertisement identified by `:id`. The endpoint is intentionally best-effort: it always responds with 204 No Content, even when the advertisement does not exist or the underlying insert fails (the existence of the ad is never revealed). The optional `placement` and `serverId` fields are persisted on the event for analytics. Publicly accessible.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @requestBody {"placement": "home", "serverId": 42}
   * @responseBody 204 - No content
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
   * @adClickRedirect
   * @operationId adClickRedirect
   * @tag ADVERTISEMENTS
   * @summary Record an ad click and redirect to its target URL
   * @description Records a `click` event for the advertisement identified by `:id` and then issues an HTTP 302 redirect to the requested `to` URL. To prevent open-redirect and header-injection attacks, the target URL must (a) be a valid `http(s)` URL and (b) appear as an `href` inside the ad's stored HTML content. When the advertisement does not exist, or when the supplied target URL is missing/invalid/not allow-listed, the user is silently redirected to `/`. The optional `placement` and `serverId` query parameters are persisted on the click event for analytics. Publicly accessible.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @paramQuery to - Target URL to redirect to. Must be an `http(s)` link present in the ad's HTML `href` attributes. - @type(string) @example(https://example.com) @required
   * @paramQuery placement - Placement where the click originated (`home` or `server`). - @type(string) @example(home)
   * @paramQuery serverId - Identifier of the server the ad was displayed next to, when applicable. - @type(number) @example(134)
   * @responseBody 302 - HTML 302 redirect to the advertisement target URL (or to `/` when the ad or target is invalid). The destination is provided in the `Location` response header.
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
   * @adminListAdvertisements
   * @operationId adminListAdvertisements
   * @tag ADVERTISEMENTS_ADMIN
   * @summary List every advertisement with impression and click counters (admin)
   * @description Returns the complete list of advertisements (ordered by `created_at` desc) together with their preloaded categories and aggregated `impressionsCount` / `clicksCount`. Requires authentication and the administrator policy.
   * @responseBody 200 - [{"id": 1, "name": "Summer promo", "type": "custom", "htmlContent": "<a href=\"https://example.com\">Click</a>", "enabled": true, "weight": 10, "showOnHome": true, "showOnServer": false, "startsAt": "", "endsAt": "", "createdAt": "2026-05-01T00:00:00.000Z", "updatedAt": "2026-05-01T00:00:00.000Z", "categories": [], "impressionsCount": 1234, "clicksCount": 56}]
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
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
   * @getAdvertisement
   * @operationId getAdvertisement
   * @tag ADVERTISEMENTS_ADMIN
   * @summary Get a single advertisement (admin)
   * @description Returns the advertisement identified by `:id` with its preloaded categories. Requires authentication and the administrator policy.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @responseBody 200 - <Advertisement>
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
   * @responseBody 404 - {"message": "Row not found"}
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
   * @createAdvertisement
   * @operationId createAdvertisement
   * @tag ADVERTISEMENTS_ADMIN
   * @summary Create an advertisement (admin)
   * @description Creates a new advertisement. `startsAt` and `endsAt` accept ISO date strings (or `null`). When `categoryIds` is provided the targeted categories are synchronized on the new advertisement. Requires authentication and the administrator policy.
   * @requestBody <CreateAdvertisementValidator>
   * @responseBody 201 - <Advertisement>
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "name"}]}
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
   * @updateAdvertisement
   * @operationId updateAdvertisement
   * @tag ADVERTISEMENTS_ADMIN
   * @summary Update an advertisement (admin)
   * @description Updates an existing advertisement. All fields are optional; `startsAt` and `endsAt` are only modified when explicitly provided in the body and accept ISO date strings or `null`. When `categoryIds` is provided the associated categories are fully synchronized. Requires authentication and the administrator policy.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @requestBody <UpdateAdvertisementValidator>
   * @responseBody 200 - <Advertisement>
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
   * @responseBody 404 - {"message": "Row not found"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "name"}]}
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
   * @deleteAdvertisement
   * @operationId deleteAdvertisement
   * @tag ADVERTISEMENTS_ADMIN
   * @summary Delete an advertisement (admin)
   * @description Permanently deletes the advertisement identified by `:id` together with its associated events. Requires authentication and the administrator policy.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @responseBody 204 - No content
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
   * @responseBody 404 - {"message": "Row not found"}
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
   * @getAdStats
   * @operationId getAdStats
   * @tag ADVERTISEMENTS_ADMIN
   * @summary Time-series impression and click statistics for an ad (admin)
   * @description Returns aggregated impression and click counts grouped into buckets of `hour` or `day` (default: `day`) for the advertisement identified by `:id`. The window can be narrowed with the optional `fromDate` and `toDate` query parameters (epoch milliseconds). The response provides both the per-bucket `series` and the cumulative `totals` over the requested window. Requires authentication and the administrator policy.
   * @paramPath id - Identifier of the advertisement. - @type(number) @example(42) @required
   * @paramQuery interval - Bucket size for the series. `hour` or `day` (defaults to `day`). - @type(string) @example(day)
   * @paramQuery fromDate - Lower bound of the window, in epoch milliseconds (or the literal string `now`). - @type(number) @example(1716854400000)
   * @paramQuery toDate - Upper bound of the window, in epoch milliseconds (or the literal string `now`). - @type(number) @example(1717459200000)
   * @responseBody 200 - {"totals": {"impressions": 1234, "clicks": 56}, "series": [{"time": "2026-05-01T00:00:00.000Z", "impressions": 100, "clicks": 5}], "interval": "day"}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Administrator privileges required."}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async stats({ params, request, response, auth, bouncer }: HttpContext) {
    if (!auth.user || (await bouncer.with(AdvertisementPolicy).denies('manage'))) {
      return response.forbidden({ error: 'Access denied. Administrator privileges required.' })
    }

    const ad = await Advertisement.findOrFail(params.id)
    const interval = request.input('interval') === 'hour' ? 'hour' : 'day'
    const fromDate = parseEpochMs(request.input('fromDate'))
    const toDate = parseEpochMs(request.input('toDate'))

    let query = db.from('advertisement_events').where('advertisement_id', ad.id)
    if (fromDate !== null) query = query.where('created_at', '>=', new Date(fromDate))
    if (toDate !== null) query = query.where('created_at', '<=', new Date(toDate))

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
