import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = performance.now()
    
    try {
      const output = await next()
      
      const duration = Math.round(performance.now() - startTime)
      ctx.logger.info('Request processed', {
        timestamp: new Date().toISOString(),
        method: ctx.request.method(),
        url: ctx.request.url(),
        statusCode: ctx.response.getStatus(),
        duration: `${duration}ms`,
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
        contentLength: ctx.response.getHeader('content-length'),
        route: ctx.route?.name || 'unknown',
        auth: ctx.auth?.user?.id ? 'authenticated' : 'anonymous'
      })

      return output
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      ctx.logger.error('Request error', {
        timestamp: new Date().toISOString(),
        method: ctx.request.method(),
        url: ctx.request.url(),
        duration: `${duration}ms`,
        statusCode: error.status || 500,
        errorName: error.name,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'production' 
          ? error.stack?.split('\n').slice(0, 2).join('\n')
          : error.stack
      })
      
      throw error
    }
  }
}