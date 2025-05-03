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

import limiter from '@adonisjs/limiter/services/main'

const createLimiter = (key: string, requests: number, time: string, requestName: string) => {

  return limiter.define(key, (ctx) => {
    const cloudflareIp = ctx.request.header("CF-Connecting-IP") ?? ctx.request.ip();

    return limiter
      .allowRequests(requests)
      .every(time)
      .usingKey(`${requestName}_${cloudflareIp}`)
      .limitExceeded((error) => {
        error
          .setStatus(429)
          .setMessage(`Too many ${requestName} requests. Try again later`)
      })
  })

}

// requêtes légères
export const throttleLight = (requestName: string, amount: number) => createLimiter('light', amount, '1 minute', requestName)
