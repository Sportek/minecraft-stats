import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verifies Cloudflare Turnstile captcha tokens against the official siteverify
 * endpoint. Used to gate email/password login and registration against bots.
 *
 * When `TURNSTILE_SECRET_KEY` is not configured (local dev, tests), verification
 * is skipped so those flows keep working without a captcha.
 */
class TurnstileService {
  /** Whether captcha verification is active (a secret key is configured). */
  get isEnabled(): boolean {
    return Boolean(env.get('TURNSTILE_SECRET_KEY'))
  }

  /**
   * Returns true when the token is valid, or when verification is disabled.
   * Fails closed (false) on a missing token or a verification error.
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    const secret = env.get('TURNSTILE_SECRET_KEY')
    if (!secret) return true
    if (!token) return false

    try {
      const body = new URLSearchParams({ secret, response: token })
      if (remoteIp) body.append('remoteip', remoteIp)

      const res = await fetch(VERIFY_URL, { method: 'POST', body })
      if (!res.ok) return false

      const data = (await res.json()) as { success: boolean }
      return data.success === true
    } catch (error) {
      logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'TURNSTILE: verification request failed'
      )
      return false
    }
  }
}

export default new TurnstileService()
