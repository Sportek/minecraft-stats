import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ModeratorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user?.isModerator) {
      return ctx.response.forbidden({
        error: 'Access denied. Moderator privileges required.',
      })
    }

    return next()
  }
}
