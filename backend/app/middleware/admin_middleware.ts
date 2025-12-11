import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware is used to verify that the authenticated user
 * has admin privileges.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user || user.role !== 'admin') {
      return ctx.response.forbidden({
        error: 'Access denied. Admin privileges required.',
      })
    }

    return next()
  }
}
