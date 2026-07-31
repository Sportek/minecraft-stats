import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export type CacheHeaderConfig = {
  /** Durée max d'utilisation par un cache (secondes). */
  maxAge?: number
  /** stale-while-revalidate (secondes) — RFC 5861. */
  sWR?: number
  /** Scope du cache (public par défaut). */
  scope?: 'public' | 'private'
  /** Si true, force `no-store` et ignore les autres options. */
  noStore?: boolean
}

function buildDirective(config: CacheHeaderConfig): string {
  if (config.noStore) return 'no-store'
  const parts: string[] = [config.scope ?? 'public']
  if (config.maxAge !== undefined) parts.push(`max-age=${config.maxAge}`)
  if (config.sWR !== undefined) parts.push(`stale-while-revalidate=${config.sWR}`)
  return parts.join(', ')
}

/**
 * Middleware fonctionnel — applique Cache-Control au response uniquement si le
 * controller n'en a pas déjà fixé un. Usage :
 *
 *   .use(cacheHeaders({ maxAge: 300, sWR: 600 }))
 *   .use(cacheHeaders({ noStore: true }))
 */
export const cacheHeaders = (config: CacheHeaderConfig) => {
  const shared = buildDirective(config)
  const perUser = buildDirective({ ...config, scope: 'private' })

  return async (ctx: HttpContext, next: NextFn) => {
    await next()
    if (ctx.response.getHeader('cache-control')) return

    // Une requête authentifiée peut recevoir une réponse différente de celle d'un
    // anonyme sur la même URL (cf. paliers d'`EntitlementsService`). `Vary:
    // Authorization` serait la réponse canonique, mais Cloudflare — par où passe
    // tout le trafic — ignore `Vary` hors `Accept-Encoding` : le CDN servirait la
    // réponse d'un palier à l'autre. On sort donc ces réponses du cache partagé.
    const authenticated = ctx.request.header('authorization') !== undefined
    ctx.response.header('cache-control', authenticated ? perUser : shared)
  }
}
