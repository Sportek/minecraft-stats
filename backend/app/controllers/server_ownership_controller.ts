import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import ServerOwnershipService, {
  verificationValue,
  type VerifyOutcome,
} from '#services/server_ownership_service'
import { CreateManualClaimValidator, ReviewClaimValidator } from '#validators/server_ownership'

/**
 * Réclamation de propriété d'un serveur.
 *
 * Un serveur peut avoir été ajouté par un simple fan (`user_id` = "ajouteur", non
 * confirmé). Ces endpoints permettent au vrai propriétaire de récupérer l'accès :
 *  - MOTD (self-service) : insérer un jeton dans la MOTD → lu via ping. Couverture max.
 *  - DNS (self-service)  : publier un TXT contenant un jeton → vérification auto.
 *  - Manuel (filet)      : soumettre une preuve → revue par un admin.
 */
export default class ServerOwnershipController {
  /** Sérialisation publique d'un dossier (jamais le jeton brut). */
  private serializeClaim(claim: ServerOwnershipClaim) {
    return {
      method: claim.method,
      status: claim.status,
      evidence: claim.evidence,
      evidenceUrl: claim.evidenceUrl,
      expiresAt: claim.expiresAt,
      verifiedAt: claim.verifiedAt,
      reviewNote: claim.reviewNote,
      createdAt: claim.createdAt,
    }
  }

  /** Instructions DNS : quel enregistrement TXT publier, et où. */
  private dnsInstructions(server: Server, token: string) {
    return {
      recordType: 'TXT',
      recordName: server.hostDomain,
      recordValue: verificationValue(token),
      acceptedHosts: ServerOwnershipService.dnsHostCandidates(server),
    }
  }

  /** Instructions MOTD : la chaîne à insérer quelque part dans la MOTD du serveur. */
  private motdInstructions(token: string) {
    return { value: verificationValue(token) }
  }

  private async findServer(id: number, ctx: HttpContext): Promise<Server | null> {
    const server = await Server.find(id)
    if (!server) {
      ctx.response.notFound({ message: ctx.i18n.t('messages.servers.notFound') })
      return null
    }
    return server
  }

  /** Clé i18n du message pour chaque motif de blocage. */
  private static readonly BLOCK_MESSAGE_KEYS = {
    already_owner: 'alreadyOwner',
    already_verified: 'alreadyVerified',
    dns_unavailable: 'dnsUnavailable',
  } as const

  /** Réponse HTTP commune aux cas de blocage d'ouverture de demande. */
  private blocked(
    ctx: HttpContext,
    status: keyof typeof ServerOwnershipController.BLOCK_MESSAGE_KEYS
  ) {
    const key = ServerOwnershipController.BLOCK_MESSAGE_KEYS[status]
    return ctx.response.conflict({
      message: ctx.i18n.t(`messages.serverOwnership.${key}`),
      reason: status,
    })
  }

  /** Mappe un `VerifyOutcome` (MOTD ou DNS) sur une réponse HTTP. */
  private respondVerify(ctx: HttpContext, result: VerifyOutcome) {
    const { response, i18n } = ctx
    switch (result.status) {
      case 'verified':
        return { verified: true, server: result.server }
      case 'not_found_record':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.recordNotFound'),
          reason: result.status,
        })
      case 'unreachable':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.unreachable'),
          reason: result.status,
        })
      case 'expired':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.tokenExpired'),
          reason: result.status,
        })
      case 'no_claim':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.noClaim'),
          reason: result.status,
        })
      case 'already_verified':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.alreadyVerified'),
          reason: result.status,
        })
    }
  }

  /**
   * @claimStatus
   * @operationId serverClaimStatus
   * @tag SERVER OWNERSHIP
   * @summary Ownership status of a server for the current user
   * @description Returns whether the server is already verified, which verification methods are available, and the authenticated user's current claim (if any). Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"verified": false, "isOwner": false, "methods": {"motd": true, "dns": true, "manual": true}, "claim": null}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async status(ctx: HttpContext) {
    const { params, auth, response } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: ctx.i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    const claim = await ServerOwnershipService.getUserClaim(server.id, user.id)
    return {
      verified: server.ownerVerifiedAt !== null,
      isOwner: server.userId === user.id && server.ownerVerifiedAt !== null,
      methods: {
        motd: true,
        dns: ServerOwnershipService.dnsAvailable(server),
        manual: true,
      },
      claim: claim ? this.serializeClaim(claim) : null,
    }
  }

  /**
   * @startMotd
   * @operationId startServerMotdClaim
   * @tag SERVER OWNERSHIP
   * @summary Start a MOTD ownership verification
   * @description Issues (or re-uses) a verification token and returns the string to place in the server's MOTD. Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"claim": {"method": "motd", "status": "pending"}, "motd": {"value": "minecraft-stats-verify=abc123"}}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 409 - {"message": "This server is already verified.", "reason": "already_verified"}
   */
  async startMotd(ctx: HttpContext) {
    const { params, auth, response, i18n } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    const result = await ServerOwnershipService.startMotdClaim(server, user)
    if (result.status !== 'ok') return this.blocked(ctx, result.status)
    return {
      claim: this.serializeClaim(result.claim),
      motd: this.motdInstructions(result.claim.token!),
    }
  }

  /**
   * @verifyMotd
   * @operationId verifyServerMotdClaim
   * @tag SERVER OWNERSHIP
   * @summary Verify a MOTD ownership claim
   * @description Pings the server, reads its MOTD, and transfers ownership to the authenticated user if the verification token is present. Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"verified": true, "server": "<Server>"}
   * @responseBody 400 - {"message": "Token not found in the MOTD yet.", "reason": "not_found_record"}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async verifyMotd(ctx: HttpContext) {
    const { params, auth, response, i18n } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    return this.respondVerify(ctx, await ServerOwnershipService.verifyMotdClaim(server, user))
  }

  /**
   * @startDns
   * @operationId startServerDnsClaim
   * @tag SERVER OWNERSHIP
   * @summary Start a DNS ownership verification
   * @description Issues (or re-uses) a DNS verification token and returns the TXT record to publish. Rejected if the server has no resolvable domain (409 dns_unavailable) or is already verified. Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"claim": {"method": "dns", "status": "pending"}, "dns": {"recordType": "TXT", "recordName": "example.com", "recordValue": "minecraft-stats-verify=abc123"}}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 409 - {"message": "This server is already verified.", "reason": "already_verified"}
   */
  async startDns(ctx: HttpContext) {
    const { params, auth, response, i18n } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    const result = await ServerOwnershipService.startDnsClaim(server, user)
    if (result.status !== 'ok') return this.blocked(ctx, result.status)
    return {
      claim: this.serializeClaim(result.claim),
      dns: this.dnsInstructions(server, result.claim.token!),
    }
  }

  /**
   * @verifyDns
   * @operationId verifyServerDnsClaim
   * @tag SERVER OWNERSHIP
   * @summary Verify a DNS ownership claim
   * @description Resolves the server's TXT records and transfers ownership to the authenticated user if the verification token is found. Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"verified": true, "server": "<Server>"}
   * @responseBody 400 - {"message": "TXT record not found yet.", "reason": "not_found_record"}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async verifyDns(ctx: HttpContext) {
    const { params, auth, response, i18n } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    return this.respondVerify(ctx, await ServerOwnershipService.verifyDnsClaim(server, user))
  }

  /**
   * @submitManual
   * @operationId submitServerManualClaim
   * @tag SERVER OWNERSHIP
   * @summary Submit a manual ownership claim
   * @description Files a manual ownership request (evidence text + optional proof URL) for admin review. Used when neither MOTD nor DNS verification is possible. Rejected if the server is already verified. Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @requestBody <CreateManualClaimValidator>
   * @responseBody 200 - {"claim": {"method": "manual", "status": "pending"}, "message": "Your request was submitted for review."}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 409 - {"message": "This server is already verified.", "reason": "already_verified"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "evidence"}]}
   */
  async submitManual(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const user = auth.user
    if (!user)
      return response.unauthorized({ message: i18n.t('messages.serverOwnership.unauthorized') })

    const server = await this.findServer(params.id, ctx)
    if (!server) return

    const data = await CreateManualClaimValidator.validate(
      request.only(['evidence', 'evidenceUrl'])
    )
    const result = await ServerOwnershipService.submitManualClaim(server, user, data)
    if (result.status !== 'ok') return this.blocked(ctx, result.status)
    return {
      claim: this.serializeClaim(result.claim),
      message: i18n.t('messages.serverOwnership.manualSubmitted'),
    }
  }

  /**
   * @adminIndex
   * @operationId adminListOwnershipClaims
   * @tag SERVER OWNERSHIP
   * @summary List pending manual ownership claims (admin)
   * @description Returns every manual ownership claim awaiting review, oldest first, with the server and requester preloaded. Admin only.
   * @responseBody 200 - [{"id": 1, "method": "manual", "status": "pending", "evidence": "Discord: owner#1234", "server": "<Server>", "user": "<User>"}]
   * @responseBody 403 - {"error": "Access denied. Admin privileges required."}
   */
  async adminIndex() {
    return ServerOwnershipService.listPendingManualClaims()
  }

  /**
   * @approve
   * @operationId adminApproveOwnershipClaim
   * @tag SERVER OWNERSHIP
   * @summary Approve a manual ownership claim (admin)
   * @description Approves a pending manual claim and transfers server ownership to the requester. Returns 409 if the server was verified by someone else in the meantime. Admin only.
   * @paramPath id - The claim id - @type(number) @required
   * @requestBody <ReviewClaimValidator>
   * @responseBody 200 - {"message": "Claim approved.", "server": "<Server>"}
   * @responseBody 404 - {"message": "Claim not found"}
   * @responseBody 409 - {"message": "This server is already verified.", "reason": "already_verified"}
   */
  async approve(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const admin = auth.user!
    const claim = await ServerOwnershipClaim.find(params.id)
    if (!claim)
      return response.notFound({ message: i18n.t('messages.serverOwnership.claimNotFound') })

    const { note } = await ReviewClaimValidator.validate(request.only(['note']))
    const result = await ServerOwnershipService.approveManualClaim(claim, admin, note)
    if (result.status === 'already_verified') {
      return response.conflict({
        message: i18n.t('messages.serverOwnership.alreadyVerified'),
        reason: result.status,
      })
    }
    return { message: i18n.t('messages.serverOwnership.approved'), server: result.server }
  }

  /**
   * @reject
   * @operationId adminRejectOwnershipClaim
   * @tag SERVER OWNERSHIP
   * @summary Reject a manual ownership claim (admin)
   * @description Rejects a pending manual claim with an optional note. Admin only.
   * @paramPath id - The claim id - @type(number) @required
   * @requestBody <ReviewClaimValidator>
   * @responseBody 200 - {"message": "Claim rejected."}
   * @responseBody 404 - {"message": "Claim not found"}
   */
  async reject(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const admin = auth.user!
    const claim = await ServerOwnershipClaim.find(params.id)
    if (!claim)
      return response.notFound({ message: i18n.t('messages.serverOwnership.claimNotFound') })

    const { note } = await ReviewClaimValidator.validate(request.only(['note']))
    await ServerOwnershipService.rejectManualClaim(claim, admin, note)
    return { message: i18n.t('messages.serverOwnership.rejected') }
  }
}
