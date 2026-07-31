import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Authentification facultative : renseigne `ctx.auth.user` quand la requête porte
 * un jeton valide, et laisse passer tout le monde sinon. C'est ce qui permet à un
 * endpoint public de servir davantage à un membre sans se fermer aux anonymes.
 *
 * Le court-circuit sur l'en-tête `Authorization` n'est pas une micro-optimisation :
 * ces routes sont massivement cachées et majoritairement anonymes, on ne veut pas
 * y ajouter une lecture de la table des jetons pour rien.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.request.header('authorization')) {
      await ctx.auth.check()
    }
    return next()
  }
}
