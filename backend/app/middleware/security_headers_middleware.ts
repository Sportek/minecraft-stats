import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Ajoute un sous-ensemble sûr d'en-têtes de sécurité sur toutes les réponses.
 *
 * On se limite volontairement aux en-têtes qui ne risquent pas de casser une API
 * JSON à auth par token (Bearer en localStorage, pas de cookie) ni le rendu des
 * surfaces HTML servies (UI Scalar `/docs`, favicons statiques) :
 *   - X-Content-Type-Options: nosniff  → empêche le MIME-sniffing
 *   - X-Frame-Options: DENY            → anti-clickjacking / framing
 *   - Referrer-Policy                  → limite la fuite d'URL via le Referer
 *
 * Volontairement ABSENTS ici (nécessitent un arbitrage/tuning) : Content-Security-Policy
 * (doit être calibrée contre le front Next.js et l'UI Scalar) et HSTS (souvent
 * injecté par Cloudflare en amont).
 */
export default class SecurityHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('X-Frame-Options', 'DENY')
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    return next()
  }
}
