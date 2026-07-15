import type { HttpContext } from '@adonisjs/core/http'
import type User from '#models/user'

/**
 * Garde d'autorisation mutualisée (réponse de forme `{ error }`).
 *
 * Remplace le triptyque répété « lire l'utilisateur → 401 si absent → 403 si la
 * policy refuse ». Écrit la réponse d'erreur appropriée et renvoie `null` en cas
 * d'échec ; sinon renvoie l'utilisateur authentifié. À utiliser uniquement quand
 * la vérification a lieu *avant* le chargement d'une ressource (sinon l'ordre
 * 401-avant-404 changerait) et que la réponse attendue est `{ error }`.
 *
 * Usage :
 * ```ts
 * const user = await requireAbility(ctx, () => ctx.bouncer.with(PostPolicy).denies('manage'), {
 *   unauthorized: 'messages.posts.unauthorized',
 *   forbidden: 'messages.posts.writerRequired',
 * })
 * if (!user) return
 * ```
 */
export async function requireAbility(
  ctx: HttpContext,
  denies: () => Promise<boolean>,
  keys: { unauthorized: string; forbidden: string }
): Promise<User | null> {
  const user = ctx.auth.user
  if (!user) {
    ctx.response.unauthorized({ error: ctx.i18n.t(keys.unauthorized) })
    return null
  }
  if (await denies()) {
    ctx.response.forbidden({ error: ctx.i18n.t(keys.forbidden) })
    return null
  }
  return user
}
