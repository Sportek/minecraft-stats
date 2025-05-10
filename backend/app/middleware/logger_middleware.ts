import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = performance.now()

    try {
      const output = await next()

      const duration = Math.round(performance.now() - startTime)

      const realIp = ctx.request.header('CF-Connecting-IP') || ctx.request.ip()
      ctx.logger.info(
        `[${realIp}] ${ctx.request.method()} ${ctx.request.url()} ${ctx.response.getStatus()} ${duration}ms`
      )

      return output
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      const realIp = ctx.request.header('CF-Connecting-IP') || ctx.request.ip()
      ctx.logger.error(
        `[${realIp}] ${ctx.request.method()} ${ctx.request.url()} ${error.status || 500} ${duration}ms ${error.name} ${error.message}`
      )

      throw error
    }
  }
}
