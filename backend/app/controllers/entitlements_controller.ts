import EntitlementsService from '#services/entitlements_service'
import type { HttpContext } from '@adonisjs/core/http'
import { TIERS } from '../constants/tiers.js'

export default class EntitlementsController {
  /**
   * @index
   * @operationId getEntitlements
   * @tag ENTITLEMENTS
   * @summary Get the caller's tier and its limits
   * @description Returns what the caller is allowed to ask of the stats endpoints. Answers anonymous callers too, with the `guest` tier. Clients should read their limits here rather than hard-coding them: the values move without an API version bump. `maxHistoryDays` is `null` when the history depth is unlimited. `upgrade` carries the limits the caller would get by signing in, and is `null` when there is nothing left to unlock.
   * @responseBody 200 - {"tier": "guest", "maxStatBuckets": 1500, "maxExportRows": 0, "maxHistoryDays": 365, "maxRhythmDays": 90, "canExportStats": false, "upgrade": {"tier": "member", "maxStatBuckets": 6000, "maxExportRows": 50000, "maxHistoryDays": null, "maxRhythmDays": 730, "canExportStats": true}}
   */
  async index(ctx: HttpContext) {
    const entitlements = EntitlementsService.resolve(ctx)

    return ctx.response.json({
      ...entitlements,
      // Ce qu'un compte débloquerait. C'est cette différence que le client met en
      // avant sur ses verrous, plutôt que de recopier nos paliers de son côté.
      upgrade: entitlements.tier === 'guest' ? TIERS.member : null,
    })
  }
}
