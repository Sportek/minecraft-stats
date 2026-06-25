import { DateTime } from 'luxon'

interface Bucket {
  requests: number
  errors: number
}

/**
 * Buffer en mémoire des compteurs de trafic, agrégés par heure. Le middleware
 * incrémente ici (aucune écriture DB par requête), et le scheduler vide
 * périodiquement le buffer vers `traffic_stats`. Best-effort : les compteurs
 * non encore flushés sont perdus au redémarrage, ce qui est acceptable pour
 * une métrique de volume.
 */
const buffer = new Map<string, Bucket>()

export function recordRequest(status: number): void {
  const hour = DateTime.now().startOf('hour').toSQL({ includeOffset: false })!
  const bucket = buffer.get(hour) ?? { requests: 0, errors: 0 }
  bucket.requests += 1
  if (status >= 400) bucket.errors += 1
  buffer.set(hour, bucket)
}

export function drainBuffer(): Array<{ bucket: string; requests: number; errors: number }> {
  const entries = [...buffer.entries()].map(([bucket, counts]) => ({ bucket, ...counts }))
  buffer.clear()
  return entries
}
