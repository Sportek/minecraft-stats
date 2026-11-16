/*
|--------------------------------------------------------------------------
| Métriques applicatives exposées sur /metrics
|--------------------------------------------------------------------------
|
| Complète les collecteurs de @julr/adonisjs-prometheus (config/prometheus.ts)
| avec ce qu'ils ne voient pas : la santé du ping, qui tourne dans le conteneur
| du scheduler, et quelques chiffres produit lus en base.
|
*/

import env from '#start/env'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import { Gauge, Histogram } from 'prom-client'
import { PING_RUN_REDIS_KEY, type PingRunSummary } from '../app/constants/metrics.js'

const prefix = `${env.get('APP_NAME')}_`

/**
 * Remplace le lucidCollector du paquet, qui ne lit que la partie nanosecondes
 * de `duration` : une requête de 1,2 s y était comptée 0,2 s.
 */
const queryDuration = new Histogram({
  name: `${prefix}lucid_query_duration_seconds`,
  help: 'Durée des requêtes SQL',
  labelNames: ['connection', 'model', 'method'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

emitter.on('db:query', (query) => {
  if (!query.duration) return
  const [seconds, nanoseconds] = query.duration
  queryDuration.observe(
    { connection: query.connection, model: query.model ?? 'raw', method: query.method },
    seconds + nanoseconds / 1e9
  )
})

type Snapshot = {
  serversTracked: number
  serversRegistered: number
  serversOnline: number
  serversOverdue: number
  serversBoosting: number
  playersOnline: number
  lastSuccessAgeSeconds: number | null
}

/** Un serveur est « en ligne » si son dernier ping réussi date de moins que ça. */
const ONLINE_WINDOW = '30 minutes'

/**
 * Au-delà, un serveur dont `next_ping_at` est passé a raté au moins deux tours
 * du job (toutes les 5 min) : le scheduler est arrêté ou ne suit plus.
 */
const OVERDUE_GRACE = '10 minutes'

/**
 * Argus scrape toutes les 15 s, prod et staging : inutile de requêter la base à
 * chaque fois. Le bilan du ping, lui, est un simple GET Redis lu à chaque scrape.
 */
const SNAPSHOT_TTL_MS = 30_000

async function readPingRun(): Promise<PingRunSummary | null> {
  try {
    const raw = await redis.get(PING_RUN_REDIS_KEY)
    return raw ? (JSON.parse(raw) as PingRunSummary) : null
  } catch (error) {
    logger.warn({ err: error }, 'METRICS: impossible de lire le bilan du ping dans Redis')
    return null
  }
}

async function loadSnapshot(): Promise<Snapshot> {
  // SQL brut : les hooks du modèle Server ne s'appliquent pas, d'où le filtre hidden_at.
  const { rows } = await db.rawQuery(`
    select
      count(*) filter (where hidden_at is null) as tracked,
      count(*) as registered,
      count(*) filter (where hidden_at is null and last_stats_at > now() - interval '${ONLINE_WINDOW}') as online,
      count(*) filter (where hidden_at is null and next_ping_at < now() - interval '${OVERDUE_GRACE}') as overdue,
      count(*) filter (where hidden_at is null and boost_status = 'boosting') as boosting,
      coalesce(sum(last_player_count) filter (
        where hidden_at is null and last_stats_at > now() - interval '${ONLINE_WINDOW}'
      ), 0) as players,
      extract(epoch from now() - max(last_stats_at) filter (where hidden_at is null)) as last_success_age
    from servers
  `)
  const row = rows[0]

  return {
    serversTracked: Number(row.tracked),
    serversRegistered: Number(row.registered),
    serversOnline: Number(row.online),
    serversOverdue: Number(row.overdue),
    serversBoosting: Number(row.boosting),
    playersOnline: Number(row.players),
    lastSuccessAgeSeconds: row.last_success_age === null ? null : Number(row.last_success_age),
  }
}

let cached: { at: number; snapshot: Promise<Snapshot> } | null = null

function getSnapshot(): Promise<Snapshot> {
  if (!cached || Date.now() - cached.at > SNAPSHOT_TTL_MS) {
    const snapshot = loadSnapshot()
    cached = { at: Date.now(), snapshot }
    // Un échec ne doit pas rester en cache 30 s : le prochain scrape réessaie.
    snapshot.catch(() => {
      cached = null
    })
  }
  return cached.snapshot
}

/**
 * Jauge calculée au moment du scrape. Une valeur `null` (donnée absente) n'est
 * pas exportée : prom-client publierait sinon 0, qui serait trompeur (« 0 serveur
 * à pinguer » au lieu de « le scheduler n'a jamais rien déposé »).
 */
function scrapeGauge(name: string, help: string, read: () => Promise<number | null>) {
  return new Gauge({
    name: `${prefix}${name}`,
    help,
    async collect() {
      const value = await read()
      if (value === null) this.remove()
      else this.set(value)
    },
  })
}

function snapshotGauge(name: string, help: string, read: (snapshot: Snapshot) => number | null) {
  return scrapeGauge(name, help, async () => read(await getSnapshot()))
}

function pingRunGauge(name: string, help: string, read: (run: PingRunSummary) => number) {
  return scrapeGauge(name, help, async () => {
    const run = await readPingRun()
    return run ? read(run) : null
  })
}

snapshotGauge('servers_tracked', 'Serveurs suivis (non masqués)', (s) => s.serversTracked)
snapshotGauge(
  'servers_registered',
  'Serveurs enregistrés, masqués compris',
  (s) => s.serversRegistered
)
snapshotGauge(
  'servers_online',
  `Serveurs ayant répondu au ping dans les ${ONLINE_WINDOW}`,
  (s) => s.serversOnline
)
snapshotGauge(
  'servers_ping_overdue',
  `Serveurs dont le ping est en retard de plus de ${OVERDUE_GRACE}`,
  (s) => s.serversOverdue
)
snapshotGauge(
  'servers_boosting',
  'Serveurs au statut de boost « boosting »',
  (s) => s.serversBoosting
)
snapshotGauge(
  'players_online',
  'Joueurs connectés, tous serveurs en ligne confondus',
  (s) => s.playersOnline
)
snapshotGauge(
  'ping_last_success_age_seconds',
  'Ancienneté du dernier ping réussi, tous serveurs confondus',
  (s) => s.lastSuccessAgeSeconds
)

pingRunGauge(
  'ping_run_age_seconds',
  'Temps écoulé depuis la fin du dernier passage du job de ping',
  (run) => (Date.now() - run.finishedAt) / 1000
)
pingRunGauge(
  'ping_run_duration_seconds',
  'Durée du dernier passage du job de ping',
  (run) => run.durationMs / 1000
)
pingRunGauge('ping_run_due', 'Serveurs à pinguer lors du dernier passage', (run) => run.due)
pingRunGauge(
  'ping_run_succeeded',
  'Serveurs pingués avec succès lors du dernier passage',
  (run) => run.pinged
)
