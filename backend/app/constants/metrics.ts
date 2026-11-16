/**
 * Le scheduler tourne dans son propre conteneur, sans serveur HTTP : Prometheus
 * ne peut pas l'interroger. Il dépose le bilan de chaque passage de ping sous
 * cette clé Redis, que l'API relit au moment du scrape de /metrics.
 */
export const PING_RUN_REDIS_KEY = 'metrics:ping:last_run'

export type PingRunSummary = {
  finishedAt: number
  durationMs: number
  due: number
  pinged: number
}
