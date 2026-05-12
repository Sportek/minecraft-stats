import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'
import { Counter, register } from 'prom-client'

const metricPrefix = `${process.env.APP_NAME ?? 'app'}_`

function getOrCreateCounter(name: string, help: string): Counter<string> {
  const existing = register.getSingleMetric(name)
  if (existing) return existing as Counter<string>
  return new Counter({ name, help, labelNames: ['key_prefix'] })
}

const cacheHits = getOrCreateCounter(
  `${metricPrefix}cache_hits_total`,
  'Cache hits par préfixe de clé'
)
const cacheMisses = getOrCreateCounter(
  `${metricPrefix}cache_misses_total`,
  'Cache misses par préfixe de clé'
)

function keyPrefix(key: string): string {
  return key.split(':', 1)[0] ?? 'unknown'
}

export default class CacheService {
  /**
   * Renvoie la valeur Redis pour `key` si présente, sinon exécute `fetcher`,
   * stocke le résultat avec TTL (en secondes) et le retourne.
   *
   * Sérialisation JSON. En cas d'erreur Redis (down, timeout), tombe gracieusement
   * sur le `fetcher` direct pour ne pas casser la requête.
   */
  static async cacheOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    options: { bypass?: boolean } = {}
  ): Promise<T> {
    if (options.bypass) return fetcher()

    const prefix = keyPrefix(key)

    try {
      const cached = await redis.get(key)
      if (cached !== null) {
        cacheHits.inc({ key_prefix: prefix })
        return JSON.parse(cached) as T
      }
    } catch (error) {
      logger.warn({ key, err: error.message }, 'CACHE: read failed, fallback to fetcher')
    }

    cacheMisses.inc({ key_prefix: prefix })
    const value = await fetcher()

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      logger.warn({ key, err: error.message }, 'CACHE: write failed (non-fatal)')
    }

    return value
  }

  /**
   * Supprime une clé exacte.
   */
  static async invalidate(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      logger.warn({ key, err: error.message }, 'CACHE: invalidate failed')
    }
  }

  /**
   * Supprime toutes les clés matchant un pattern (ex: `stats:42:*`).
   * Utilise SCAN pour ne pas bloquer Redis sur des bases volumineuses.
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    const client = redis.connection()
    let cursor = '0'
    let removed = 0
    try {
      do {
        const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = next
        if (keys.length > 0) {
          await client.del(...keys)
          removed += keys.length
        }
      } while (cursor !== '0')
      if (removed > 0) {
        logger.info(`CACHE: invalidated ${removed} keys matching ${pattern}`)
      }
    } catch (error) {
      logger.warn({ pattern, err: error.message }, 'CACHE: invalidatePattern failed')
    }
  }

  /**
   * Génère une clé stable depuis un objet de params (ordre indépendant).
   */
  static hashParams(prefix: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        if (params[k] !== undefined && params[k] !== null) acc[k] = params[k]
        return acc
      }, {})
    return `${prefix}:${JSON.stringify(sorted)}`
  }
}
