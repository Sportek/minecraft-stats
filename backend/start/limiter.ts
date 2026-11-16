/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| Équivalent de `limiter.define`, à une différence près : une panne du store
| (Redis injoignable) laisse passer la requête au lieu de répondre 500. Le
| limiter est une protection, pas une dépendance — une panne Redis ne doit pas
| couper l'API, comme c'est déjà le cas pour le cache (`CacheService`).
|
*/

import { errors } from '@adonisjs/limiter'
import limiter from '@adonisjs/limiter/services/main'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const createLimiter = (key: string, requests: number, time: string, requestName: string) => {
  const middleware = async (ctx: HttpContext, next: NextFn) => {
    const cloudflareIp = ctx.request.header('CF-Connecting-IP') ?? ctx.request.ip()
    const httpLimiter = limiter
      .allowRequests(requests)
      .every(time)
      .usingKey(`${requestName}_${cloudflareIp}`)
      .limitExceeded((error) => {
        error.setStatus(429).setMessage(`Too many ${requestName} requests. Try again later`)
      })

    let limiterResponse
    try {
      limiterResponse = await httpLimiter.throttle(key, ctx)
    } catch (error) {
      if (error instanceof errors.E_TOO_MANY_REQUESTS) throw error
      logger.warn(
        { err: error.message, requestName },
        'LIMITER: store unavailable, request let through'
      )
      return next()
    }

    const output = await next()
    ctx.response.header('X-RateLimit-Limit', limiterResponse.limit)
    ctx.response.header('X-RateLimit-Remaining', limiterResponse.remaining)
    return output
  }
  Object.defineProperty(middleware, 'name', { value: `${key}Throttle` })
  return middleware
}

// requêtes légères
export const throttleLight = (requestName: string, amount: number) =>
  createLimiter('light', amount, '1 minute', requestName)
