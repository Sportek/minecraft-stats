import Server from '#models/server'
import Visitor from '#models/visitor'
import AnalyticsService from '#services/analytics_service'
import MinecraftSkinService from '#services/minecraft_skin_service'
import TurnstileService from '#services/turnstile_service'
import VoteService from '#services/vote_service'
import { CreateServerVoteValidator, ServerVoteStatusValidator } from '#validators/server_vote'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ServerVotesController {
  /**
   * @store
   * @operationId voteForServer
   * @tag SERVERS
   * @summary Vote for a server
   * @description Registers an anonymous vote for a server. The voter only supplies a Minecraft username; no account is required. Accepting the terms (`acceptedTerms: true`) is mandatory and also grants tracking consent. A voter may vote once per server every 90 minutes (enforced across the tracked visitor, the hashed IP and the username). When enabled, a Cloudflare Turnstile token is verified. The vote is linked to the tracked visitor, and to the logged-in account when authenticated. The Minecraft username is enriched best-effort via Mojang (UUID + self-hosted head). Publicly accessible.
   * @paramPath serverId - Server id - @type(number) @example(42) @required
   * @requestBody <CreateServerVoteValidator>
   * @responseBody 200 - {"voteCount": 128, "monthlyVoteCount": 12, "nextVoteAt": "2026-07-04T13:30:00.000Z", "player": {"username": "Notch", "uuid": "069a79f444e94726a5befca90e38aaf5", "headPath": "/images/heads/069a79f444e94726a5befca90e38aaf5"}}
   * @responseBody 400 - {"message": "You must accept the terms of use to vote."}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 429 - {"message": "You have already voted for this server. Come back later.", "nextVoteAt": "2026-07-04T13:30:00.000Z"}
   * @responseBody 422 - {"errors": [{"message": "The username field format is invalid", "field": "username", "rule": "regex"}]}
   */
  async store({ params, request, response, auth, i18n }: HttpContext) {
    const server = await Server.find(params.serverId)
    if (!server) {
      return response.notFound({ message: i18n.t('messages.servers.notFound') })
    }

    const { username, visitorId, acceptedTerms, turnstileToken } =
      await request.validateUsing(CreateServerVoteValidator)

    if (!acceptedTerms) {
      return response.badRequest({ message: i18n.t('messages.servers.termsRequired') })
    }

    const ip = AnalyticsService.realIp(request)

    if (!(await TurnstileService.verify(turnstileToken, ip ?? undefined))) {
      return response.badRequest({ message: i18n.t('messages.servers.captchaFailed') })
    }

    // Endpoint public : on lit l'utilisateur s'il est connecté, sans l'imposer.
    await auth.check()

    const ipHash = AnalyticsService.hashIp(ip)
    const country = AnalyticsService.normalizeCountry(request.header('CF-IPCountry'))
    const userAgent = request.header('user-agent') ?? null

    // Lie le vote au visiteur tracké (upsert de la ligne `visitors`).
    const visitorPk = await AnalyticsService.ensureVisitor(visitorId, { ip, userAgent, country })

    // Pré-check hors transaction : évite l'appel Mojang (jusqu'à 5 s) quand le
    // votant est déjà en cooldown. Le check faisant foi est celui de `record()`.
    const cooldown = await VoteService.checkCooldown(server.id, { visitorPk, ipHash, username })
    if (!cooldown.allowed) {
      return response.tooManyRequests({
        message: i18n.t('messages.servers.alreadyVoted'),
        nextVoteAt: cooldown.nextVoteAt?.toISO() ?? null,
      })
    }

    const player = await MinecraftSkinService.resolveAndCache(username)

    const result = await VoteService.record({
      serverId: server.id,
      visitorPk,
      userId: auth.user?.id ?? null,
      // Pseudo canonique Mojang quand il est résolu (casse officielle), sinon la saisie.
      username: player.username,
      mojangUuid: player.uuid,
      ipHash,
      country,
    })

    if (!result.recorded) {
      return response.tooManyRequests({
        message: i18n.t('messages.servers.alreadyVoted'),
        nextVoteAt: result.nextVoteAt?.toISO() ?? null,
      })
    }

    const monthlyVoteCount = await VoteService.monthlyCount(server.id)

    return response.ok({
      voteCount: result.voteCount,
      monthlyVoteCount,
      nextVoteAt: DateTime.now().plus({ minutes: VoteService.COOLDOWN_MINUTES }).toISO(),
      player,
    })
  }

  /**
   * @status
   * @operationId serverVoteStatus
   * @tag SERVERS
   * @summary Whether the current visitor can vote for a server
   * @description Returns whether the visitor (identified by the anonymous `visitorId` and the request IP) is currently allowed to vote for this server, when the next vote will be possible, and the server's total vote count. Used to drive the vote button's cooldown state. Publicly accessible.
   * @paramPath serverId - Server id - @type(number) @example(42) @required
   * @paramQuery visitorId - Anonymous visitor UUID - @type(string) @example(f47ac10b-58cc-4372-a567-0e02b2c3d479)
   * @responseBody 200 - {"canVote": false, "nextVoteAt": "2026-07-04T13:30:00.000Z", "voteCount": 128, "monthlyVoteCount": 12}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 422 - {"errors": [{"message": "The visitorId field must be a valid UUID", "field": "visitorId", "rule": "uuid"}]}
   */
  async status({ params, request, response, i18n }: HttpContext) {
    const server = await Server.query()
      .where('id', params.serverId)
      .select('id', 'voteCount')
      .first()
    if (!server) {
      return response.notFound({ message: i18n.t('messages.servers.notFound') })
    }

    const { visitorId } = await request.validateUsing(ServerVoteStatusValidator, {
      data: request.qs(),
    })
    const ipHash = AnalyticsService.hashIp(AnalyticsService.realIp(request))

    const visitor = visitorId ? await Visitor.findBy('uuid', visitorId) : null
    const [cooldown, monthlyVoteCount] = await Promise.all([
      VoteService.checkCooldown(server.id, {
        visitorPk: visitor?.id ?? null,
        ipHash,
        username: null,
      }),
      VoteService.monthlyCount(server.id),
    ])

    return response.ok({
      canVote: cooldown.allowed,
      nextVoteAt: cooldown.nextVoteAt?.toISO() ?? null,
      voteCount: server.voteCount,
      monthlyVoteCount,
    })
  }
}
