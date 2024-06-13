/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', (ctx: HttpContext) => {
  if (ctx.auth.user) {
    return limiter.allowRequests(100).every('1 minute').usingKey(`user_${ctx.auth.user.id}`)
  }

  return limiter.allowRequests(30).every('1 minute').usingKey(`ip_${ctx.request.ip()}`)
})
