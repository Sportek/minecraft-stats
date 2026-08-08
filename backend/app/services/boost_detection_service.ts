import Server from '#models/server'
import ServerBoostReview from '#models/server_boost_review'
import ServerBoostScore, { type BoostSignal } from '#models/server_boost_score'
import type User from '#models/user'
import logger from '@adonisjs/core/services/logger'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import {
  BOOST_LIKELY_THRESHOLD,
  BOOST_MIN_DISTINCT_VALUES,
  BOOST_MIN_MEAN_PLAYERS,
  BOOST_MIN_SAMPLES,
  BOOST_WATCH_THRESHOLD,
  BOOST_WEIGHTS,
  BOOST_WINDOW_DAYS,
  SHAPE_FAMILY_CAP,
  type BoostLevel,
  type BoostStatus,
} from '../constants/server_boost.js'

/** Un relevé brut de `server_stats`, dans la fenêtre analysée. */
export interface Sample {
  playerCount: number
  maxCount: number | null
  createdAt: Date
}

/** Verdict chiffré produit par {@link BoostDetectionService.evaluate}. */
export interface Evaluation {
  score: number
  signals: BoostSignal[]
  detectedFactor: number | null
  estimatedRealPlayers: number | null
  samplesCount: number
}

/** Mesures intermédiaires, conservées pour pouvoir les afficher à l'admin. */
interface Metrics {
  samples: number
  mean: number
  /** Coefficient de variation — écart-type rapporté à la moyenne. */
  cv: number
  /** Autocorrélation au décalage 1 (soit 10 min). */
  lag1: number
  /** Rapport pic/creux de la journée type. `null` si la fenêtre est trop trouée. */
  diurnal: number | null
  /** Valeurs distinctes rapportées à la largeur de la plage occupée. */
  bandFill: number
  /** Plus grand k ≥ 2 divisant quasi tous les relevés, s'il existe. */
  lattice: { factor: number; rate: number } | null
  /** Facteur fractionnaire expliquant les écarts, quand `lattice` est absent. */
  stepLattice: { factor: number; rate: number } | null
  /** Le serveur tourne-t-il à ras de ses slots ? (file d'attente, capacité pleine) */
  capped: boolean
  /** Les slots annoncés collent-ils au nombre de joueurs ? (astuce « SlotsPlusOne ») */
  slotsGlued: boolean
}

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

const quantile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(p * (sorted.length - 1))] ?? 0
}

/**
 * Rampe linéaire : 0 au niveau `clean`, 1 au niveau `dirty`, interpolée entre les
 * deux. Marche dans les deux sens (`clean` peut être supérieur à `dirty`), ce qui
 * permet d'écrire chaque seuil dans le sens naturel de sa mesure.
 */
const ramp = (value: number | null, clean: number, dirty: number): number => {
  if (value === null || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, (value - clean) / (dirty - clean)))
}

/**
 * Détection des serveurs qui gonflent artificiellement leur nombre de connectés.
 *
 * Le principe est le même que {@link DuplicateDetectionService} : plusieurs signaux
 * individuellement bruités, des poids explicites, un seuil. Avec une différence de
 * nature — deux des signaux (`valueLattice`, `stepLattice`) ne sont pas statistiques
 * mais arithmétiques : un compteur multiplié par k ne *peut pas* produire autre chose
 * que des multiples de k. Ceux-là seuls peuvent franchir le seuil sans corroboration.
 *
 * Les quatre autres décrivent la forme de la courbe et sont plafonnés ensemble
 * ({@link SHAPE_FAMILY_CAP}) : ils repèrent le décalage additif et les séries
 * synthétiques, mais ils confondent aussi un serveur saturé avec un tricheur, donc
 * ils ne suffisent jamais à eux seuls.
 */
export default class BoostDetectionService {
  /** Écart maximal entre deux relevés pour que leur différence ait un sens. */
  private static readonly MAX_GAP_MINUTES = 20

  /** Part des relevés devant être divisible par k pour retenir le réseau entier. */
  private static readonly LATTICE_RATE = 0.98

  /** Part des écarts devant tomber sur le réseau fractionnaire pour le retenir. */
  private static readonly STEP_LATTICE_RATE = 0.85

  /**
   * Facteurs qui trahissent un arrondi d'affichage plutôt qu'une inflation. Un
   * serveur qui n'affiche que des dizaines ment sur la précision, pas sur l'ordre
   * de grandeur : le signal compte, mais moins lourd.
   */
  private static readonly ROUNDING_FACTORS = [10, 20, 50, 100]

  /**
   * Recalcule le score de tous les serveurs éligibles. Appelé par le scheduler une
   * fois par jour — le score n'a pas besoin d'être temps réel, et le balayage lit
   * ~1 000 lignes par serveur.
   */
  static async scanAll(): Promise<{ scored: number; skipped: number }> {
    const servers = await Server.query().select('id')
    let scored = 0
    let skipped = 0

    for (const server of servers) {
      const stored = await this.scoreServer(server.id)
      if (stored) scored++
      else skipped++
    }

    return { scored, skipped }
  }

  /**
   * Calcule et persiste le score d'un serveur. Retourne le score écrit, ou `null`
   * quand la fenêtre ne porte pas assez de données pour qu'un test ait du sens —
   * on préfère l'absence de score à un score bas trompeur.
   */
  static async scoreServer(serverId: number): Promise<ServerBoostScore | null> {
    const windowTo = DateTime.now()
    const windowFrom = windowTo.minus({ days: BOOST_WINDOW_DAYS })

    const samples = await this.loadSamples(serverId, windowFrom, windowTo)
    const evaluation = this.evaluate(samples)
    if (!evaluation) {
      await ServerBoostScore.query().where('server_id', serverId).delete()
      return null
    }

    return ServerBoostScore.updateOrCreate(
      { serverId },
      {
        ...evaluation,
        level: this.levelFor(evaluation.score),
        windowFrom,
        windowTo,
        computedAt: windowTo,
      }
    )
  }

  /**
   * Toute la détection, sans accès base : une série de relevés entre, un verdict
   * chiffré sort. `null` quand la fenêtre est trop pauvre pour qu'un test ait du sens.
   *
   * Séparé de {@link scoreServer} pour que le calcul soit vérifiable sur des séries
   * réelles figées — la calibration des poids ne vaut que si on peut la rejouer.
   */
  static evaluate(samples: Sample[]): Evaluation | null {
    const metrics = this.measure(samples)
    if (!metrics) return null

    const signals = this.buildSignals(metrics)
    const score = Math.min(
      100,
      signals.reduce((total, signal) => total + signal.points, 0)
    )
    const factor = metrics.lattice?.factor ?? metrics.stepLattice?.factor ?? null

    return {
      score,
      signals,
      detectedFactor: factor,
      estimatedRealPlayers: factor ? Math.round(metrics.mean / factor) : null,
      samplesCount: metrics.samples,
    }
  }

  static levelFor(score: number): BoostLevel {
    if (score >= BOOST_LIKELY_THRESHOLD) return 'likely'
    if (score >= BOOST_WATCH_THRESHOLD) return 'watch'
    return 'clean'
  }

  private static async loadSamples(
    serverId: number,
    from: DateTime,
    to: DateTime
  ): Promise<Sample[]> {
    const rows = await Database.from('server_stats')
      .select('player_count', 'max_count', 'created_at')
      .where('server_id', serverId)
      .whereNotNull('player_count')
      .where('created_at', '>=', from.toSQL()!)
      .where('created_at', '<', to.toSQL()!)
      .orderBy('created_at', 'asc')

    return rows.map((row) => ({
      playerCount: Number(row.player_count),
      maxCount: row.max_count === null ? null : Number(row.max_count),
      createdAt: new Date(row.created_at),
    }))
  }

  /**
   * Réduit la série brute à ses mesures. Retourne `null` sous les planchers de
   * suffisance : sans volume, sans niveau et sans diversité de valeurs, chaque test
   * ci-dessous répondrait n'importe quoi (un serveur qui oscille entre 0 et 2 est
   * « divisible par 2 » une fois sur deux par pur hasard).
   */
  private static measure(samples: Sample[]): Metrics | null {
    const values = samples.map((s) => s.playerCount)
    const distinct = new Set(values).size
    const average = mean(values)

    if (
      values.length < BOOST_MIN_SAMPLES ||
      average < BOOST_MIN_MEAN_PLAYERS ||
      distinct < BOOST_MIN_DISTINCT_VALUES
    ) {
      return null
    }

    const deltas = this.consecutiveDeltas(samples)
    const lattice = this.findValueLattice(values)

    const p95 = quantile(values, 0.95)
    const p05 = quantile(values, 0.05)
    const band = Math.max(1, p95 - p05 + 1)

    const slotted = samples.filter((s) => s.maxCount !== null && s.maxCount > 0)
    const fillRate = mean(slotted.map((s) => s.playerCount / s.maxCount!))
    const ceilingRate = mean(values.map((v) => (v >= 0.97 * p95 ? 1 : 0)))

    return {
      samples: values.length,
      mean: average,
      cv: this.standardDeviation(values) / average,
      lag1: this.autocorrelation(values),
      diurnal: this.diurnalRatio(samples),
      bandFill: distinct / Math.min(values.length, band),
      lattice,
      stepLattice: lattice ? null : this.findStepLattice(deltas),
      // Un serveur qui tourne au plafond de ses slots est plat pour une raison
      // légitime (file d'attente). On exige aussi que la série touche vraiment ce
      // plafond, sinon un `max_count` mal renseigné neutraliserait la famille forme.
      capped: fillRate >= 0.9 && fillRate <= 1.02 && ceilingRate >= 0.4,
      slotsGlued:
        mean(
          samples.map((s) =>
            s.maxCount !== null &&
            s.maxCount - s.playerCount >= 0 &&
            s.maxCount - s.playerCount <= 3
              ? 1
              : 0
          )
        ) > 0.9 && new Set(samples.map((s) => s.maxCount)).size > 5,
    }
  }

  /**
   * Écarts absolus entre relevés consécutifs. Les paires séparées par un trou
   * (serveur down, ping raté) sont écartées : leur différence mélange plusieurs
   * cycles et brouillerait autant l'autocorrélation que la recherche de réseau.
   */
  private static consecutiveDeltas(samples: Sample[]): number[] {
    const deltas: number[] = []
    for (let i = 1; i < samples.length; i++) {
      const minutes = (samples[i].createdAt.getTime() - samples[i - 1].createdAt.getTime()) / 60_000
      if (minutes <= this.MAX_GAP_MINUTES) {
        deltas.push(Math.abs(samples[i].playerCount - samples[i - 1].playerCount))
      }
    }
    return deltas
  }

  /**
   * Cherche le plus grand k ≥ 2 divisant au moins {@link LATTICE_RATE} des relevés.
   * C'est la signature d'un `affiché = réel × k` : un compteur honnête produit des
   * entiers quelconques, dont la divisibilité par k plafonne naturellement à 1/k.
   *
   * On garde le plus grand k qui passe — les valeurs divisibles par 16 le sont aussi
   * par 8, 4 et 2, et c'est bien 16 le multiplicateur réel.
   */
  private static findValueLattice(values: number[]): { factor: number; rate: number } | null {
    let found: { factor: number; rate: number } | null = null
    for (let k = 2; k <= 64; k++) {
      const rate = values.filter((v) => v % k === 0).length / values.length
      if (rate >= this.LATTICE_RATE) found = { factor: k, rate }
    }
    return found
  }

  /**
   * Variante fractionnaire, pour les multiplicateurs non entiers (×3,7 observé en
   * production). Les valeurs ne sont alors plus divisibles, mais les écarts restent
   * des multiples *arrondis* du facteur : 3-4, 7-8, 11, 15, 18-19 pour ×3,7.
   *
   * On balaie les facteurs candidats et on retient celui qui explique le plus
   * d'écarts. Seuls les petits écarts comptent : au-delà de quelques pas, l'arrondi
   * accumulé rend l'appartenance au réseau indécidable.
   */
  private static findStepLattice(deltas: number[]): { factor: number; rate: number } | null {
    const moving = deltas.filter((d) => d > 0)
    if (moving.length < 150) return null

    const cutoff = Math.max(12, 4 * quantile(moving, 0.5))
    const small = moving.filter((d) => d <= cutoff)
    if (small.length < 100) return null

    let best: { factor: number; rate: number } | null = null
    for (let factor = 1.5; factor <= 25; factor += 0.05) {
      const onLattice = small.filter((d) => {
        const steps = Math.round(d / factor)
        return steps >= 1 && Math.abs(d / factor - steps) <= 0.22
      }).length
      const rate = onLattice / small.length
      if (rate >= this.STEP_LATTICE_RATE && (!best || rate > best.rate)) {
        best = { factor: Math.round(factor * 100) / 100, rate }
      }
    }
    return best
  }

  private static standardDeviation(values: number[]): number {
    const average = mean(values)
    return Math.sqrt(mean(values.map((v) => (v - average) ** 2)))
  }

  /**
   * Autocorrélation au décalage 1. Une population réelle a une inertie énorme d'un
   * relevé à l'autre (~0,99 sur tous les serveurs sains observés) ; un compteur tiré
   * au sort à chaque ping la détruit.
   */
  private static autocorrelation(values: number[]): number {
    const average = mean(values)
    let numerator = 0
    let denominator = 0
    for (const value of values) denominator += (value - average) ** 2
    for (let i = 1; i < values.length; i++) {
      numerator += (values[i] - average) * (values[i - 1] - average)
    }
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Rapport pic/creux de la journée type : on replie la fenêtre sur 24 h en créneaux
   * de 30 min, puis on compare la moyenne des créneaux les plus hauts à celle des plus
   * bas. Des quantiles plutôt qu'un min/max — un seul relevé aberrant ne doit pas
   * décider. Le repli se fait en UTC : décaler le fuseau ne fait que faire tourner la
   * courbe, ce qui laisse le rapport inchangé.
   */
  private static diurnalRatio(samples: Sample[]): number | null {
    const slots = new Map<number, number[]>()
    for (const sample of samples) {
      const slot =
        sample.createdAt.getUTCHours() * 2 + Math.floor(sample.createdAt.getUTCMinutes() / 30)
      const bucket = slots.get(slot)
      if (bucket) bucket.push(sample.playerCount)
      else slots.set(slot, [sample.playerCount])
    }
    if (slots.size < 40) return null

    const averages = [...slots.values()].map(mean).sort((a, b) => a - b)
    const edge = Math.max(1, Math.round(averages.length * 0.15))
    const trough = mean(averages.slice(0, edge))
    if (trough <= 0) return null

    return mean(averages.slice(-edge)) / trough
  }

  /**
   * Compose les mesures en contributions chiffrées. Chaque entrée porte sa propre
   * justification lisible : l'admin décide sur la preuve, pas sur le score nu.
   */
  private static buildSignals(metrics: Metrics): BoostSignal[] {
    const signals: BoostSignal[] = []
    const add = (key: BoostSignal['key'], points: number, detail: string) => {
      if (points > 0) signals.push({ key, points: Math.round(points), detail })
    }

    if (metrics.lattice) {
      const { factor, rate } = metrics.lattice
      const rounding = this.ROUNDING_FACTORS.includes(factor)
      add(
        'valueLattice',
        rounding ? BOOST_WEIGHTS.valueLatticeRounded : BOOST_WEIGHTS.valueLattice,
        `${(rate * 100).toFixed(1)} % des relevés sont divisibles par ${factor}` +
          (rounding ? ' (arrondi d’affichage possible)' : ` — multiplicateur ×${factor}`)
      )
    } else if (metrics.stepLattice) {
      const { factor, rate } = metrics.stepLattice
      add(
        'stepLattice',
        BOOST_WEIGHTS.stepLattice,
        `${(rate * 100).toFixed(1)} % des écarts sont des multiples de ${factor} — multiplicateur ×${factor}`
      )
    }

    // Famille « forme » : quatre angles sur le même phénomène, donc plafonnés
    // ensemble. `rhythm` et `flatness` sont neutralisés quand la platitude est déjà
    // expliquée par un serveur qui tourne au plafond de ses slots.
    const shape: Array<{ key: BoostSignal['key']; points: number; detail: string }> = []
    if (!metrics.capped) {
      shape.push(
        {
          key: 'rhythm',
          points: BOOST_WEIGHTS.rhythm * ramp(metrics.diurnal, 1.7, 1.05),
          detail: `rapport pic/creux de la journée type : ${metrics.diurnal?.toFixed(2) ?? '—'}`,
        },
        {
          key: 'flatness',
          points: BOOST_WEIGHTS.flatness * ramp(metrics.cv, 0.14, 0.03),
          detail: `variation de ${(metrics.cv * 100).toFixed(1)} % autour de la moyenne`,
        }
      )
    }
    shape.push({
      key: 'inertia',
      points: BOOST_WEIGHTS.inertia * ramp(metrics.lag1, 0.85, 0.35),
      detail: `inertie du compteur d’un relevé à l’autre : ${metrics.lag1.toFixed(3)}`,
    })
    // Un réseau de valeurs raréfie mécaniquement les valeurs distinctes : mesurer la
    // granularité en plus reviendrait à compter deux fois la même cause.
    if (!metrics.lattice && !metrics.stepLattice) {
      shape.push({
        key: 'granularity',
        points: BOOST_WEIGHTS.granularity * ramp(metrics.bandFill, 0.55, 0.2),
        detail: `${(metrics.bandFill * 100).toFixed(0)} % des valeurs possibles de la plage sont visitées`,
      })
    }

    const shapeTotal = shape.reduce((total, s) => total + s.points, 0)
    const scale = shapeTotal > SHAPE_FAMILY_CAP ? SHAPE_FAMILY_CAP / shapeTotal : 1
    for (const s of shape) add(s.key, s.points * scale, s.detail)

    if (metrics.slotsGlued) {
      add(
        'slotsGlued',
        BOOST_WEIGHTS.slotsGlued,
        'les slots annoncés sont recalculés sur le nombre de joueurs (serveur affiché comme plein)'
      )
    }

    return signals
  }

  /**
   * File de revue admin : les serveurs dont le score dépasse le seuil de surveillance,
   * les plus suspects d'abord. Les serveurs déjà tranchés restent listés — un verdict
   * peut être révisé, et le badge public en dépend.
   */
  static async listQueue(): Promise<ServerBoostScore[]> {
    return ServerBoostScore.query()
      .where('score', '>=', BOOST_WATCH_THRESHOLD)
      .preload('server', (query) =>
        query.select(
          'id',
          'name',
          'address',
          'type',
          'boostStatus',
          'boostReviewedAt',
          'lastPlayerCount',
          'createdAt'
        )
      )
      .orderBy('score', 'desc')
  }

  /**
   * Enregistre un verdict admin. Le score et le vecteur de signaux sont **copiés**
   * dans la revue : le score du serveur est recalculé chaque jour, et une étiquette
   * rattachée à des mesures qui ont changé depuis ne vaudrait rien pour recalibrer.
   */
  static async review(
    server: Server,
    admin: User,
    verdict: BoostStatus,
    note?: string
  ): Promise<ServerBoostReview> {
    const current = await ServerBoostScore.find(server.id)

    const review = await ServerBoostReview.create({
      serverId: server.id,
      verdict,
      scoreAtReview: current?.score ?? 0,
      signalsAtReview: current?.signals ?? [],
      reviewedBy: admin.id,
      note: note ?? null,
    })

    server.boostStatus = verdict
    server.boostReviewedAt = DateTime.now()
    await server.save()

    logger.info(
      { serverId: server.id, verdict, adminId: admin.id, score: review.scoreAtReview },
      'BOOST: verdict enregistré'
    )

    return review
  }
}
