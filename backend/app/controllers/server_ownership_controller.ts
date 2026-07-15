import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import ServerOwnershipService, { dnsTxtValue } from '#services/server_ownership_service'
import { CreateManualClaimValidator, ReviewClaimValidator } from '#validators/server_ownership'

/**
 * Réclamation de propriété d'un serveur.
 *
 * Un serveur peut avoir été ajouté par un simple fan (`user_id` = "ajouteur", non
 * confirmé). Ces endpoints permettent au vrai propriétaire de récupérer l'accès :
 *  - DNS (self-service) : publier un TXT contenant un jeton → vérification auto.
 *  - Manuel (filet)     : soumettre une preuve → revue par un admin.
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

  /** Instructions DNS à afficher à l'utilisateur : quel enregistrement publier, où. */
  private dnsInstructions(server: Server, token: string) {
    return {
      recordType: 'TXT',
      recordName: server.hostDomain,
      recordValue: dnsTxtValue(token),
      acceptedHosts: ServerOwnershipService.dnsHostCandidates(server),
    }
  }

  private async findServer(id: number, ctx: HttpContext): Promise<Server | null> {
    const server = await Server.find(id)
    if (!server) {
      ctx.response.notFound({ message: ctx.i18n.t('messages.servers.notFound') })
      return null
    }
    return server
  }

  /**
   * @claimStatus
   * @operationId serverClaimStatus
   * @tag SERVER OWNERSHIP
   * @summary Ownership status of a server for the current user
   * @description Returns whether the server is already verified, whether DNS verification is available for it, and the authenticated user's current claim (if any). Requires authentication.
   * @paramPath id - The server id - @type(number) @required
   * @responseBody 200 - {"verified": false, "isOwner": false, "dnsAvailable": true, "claim": null}
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
      dnsAvailable: ServerOwnershipService.dnsAvailable(server),
      claim: claim ? this.serializeClaim(claim) : null,
    }
  }

  /**
   * @startDns
   * @operationId startServerDnsClaim
   * @tag SERVER OWNERSHIP
   * @summary Start a DNS ownership verification
   * @description Issues (or re-uses) a DNS verification token for the server and returns the TXT record the user must publish. Rejected if the server has no resolvable domain (409 dns_unavailable), is already owned by the current user (409 already_owner) or already verified by someone else (409 already_verified). Requires authentication.
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
    switch (result.status) {
      case 'already_owner':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.alreadyOwner'),
          reason: result.status,
        })
      case 'already_verified':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.alreadyVerified'),
          reason: result.status,
        })
      case 'dns_unavailable':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.dnsUnavailable'),
          reason: result.status,
        })
      case 'ok':
        return {
          claim: this.serializeClaim(result.claim),
          dns: this.dnsInstructions(server, result.claim.token!),
        }
    }
  }

  /**
   * @verifyDns
   * @operationId verifyServerDnsClaim
   * @tag SERVER OWNERSHIP
   * @summary Verify a DNS ownership claim
   * @description Resolves the server's TXT records and transfers ownership to the authenticated user if the verification token is found. Returns 400 when the record is not present yet, the token expired, or no DNS claim exists. Requires authentication.
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

    const result = await ServerOwnershipService.verifyDnsClaim(server, user)
    switch (result.status) {
      case 'verified':
        return { verified: true, server: result.server }
      case 'not_found_record':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.dnsRecordNotFound'),
          reason: result.status,
        })
      case 'expired':
        return response.badRequest({
          message: i18n.t('messages.serverOwnership.dnsExpired'),
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
   * @submitManual
   * @operationId submitServerManualClaim
   * @tag SERVER OWNERSHIP
   * @summary Submit a manual ownership claim
   * @description Files a manual ownership request (evidence text + optional proof URL) for admin review. Used when DNS verification is not possible. Rejected if the server is already verified. Requires authentication.
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
    switch (result.status) {
      case 'already_owner':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.alreadyOwner'),
          reason: result.status,
        })
      case 'already_verified':
        return response.conflict({
          message: i18n.t('messages.serverOwnership.alreadyVerified'),
          reason: result.status,
        })
      case 'dns_unavailable':
        // Non atteignable pour le manuel, mais TS veut l'exhaustivité.
        return response.conflict({
          message: i18n.t('messages.serverOwnership.dnsUnavailable'),
          reason: result.status,
        })
      case 'ok':
        return {
          claim: this.serializeClaim(result.claim),
          message: i18n.t('messages.serverOwnership.manualSubmitted'),
        }
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
