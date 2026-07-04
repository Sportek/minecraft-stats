import ServerVote from '#models/server_vote'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

interface VoterIdentity {
  visitorPk: number | null
  ipHash: string | null
  // `null` côté `status` (le pseudo n'est pas encore connu) ; toujours renseigné au vote.
  username: string | null
}

interface CooldownResult {
  allowed: boolean
  nextVoteAt: DateTime | null
}

interface RecordInput extends VoterIdentity {
  // Au vote, le pseudo est toujours renseigné (resserre le `string | null` hérité).
  username: string
  serverId: number
  userId: number | null
  mojangUuid: string | null
  country: string | null
}

type RecordResult =
  | { recorded: true; voteCount: number }
  | { recorded: false; nextVoteAt: DateTime | null }

/**
 * Logique métier du vote de serveur : anti-triche par fenêtre glissante (visiteur
 * tracké OU empreinte IP OU pseudo) et enregistrement transactionnel avec
 * incrément du compteur dénormalisé.
 */
export default class VoteService {
  // Un même votant ne peut voter qu'une fois par serveur toutes les 90 minutes.
  static readonly COOLDOWN_MINUTES = 90

  /**
   * Vérifie qu'aucun vote ne bloque le votant pour ce serveur dans les 90 dernières
   * minutes. Un vote bloque s'il partage le visiteur, l'IP hashée ou le pseudo —
   * chacun étant contournable seul, mais pas les trois ensemble.
   */
  static async checkCooldown(
    serverId: number,
    { visitorPk, ipHash, username }: VoterIdentity,
    client?: TransactionClientContract
  ): Promise<CooldownResult> {
    // Sans aucun identifiant, il n'y a rien à bloquer (ne peut pas arriver au vote,
    // possible sur `status` avant tout tracking).
    if (visitorPk === null && ipHash === null && username === null) {
      return { allowed: true, nextVoteAt: null }
    }

    const threshold = DateTime.now().minus({ minutes: this.COOLDOWN_MINUTES })

    const lastVote = await ServerVote.query({ client })
      .where('server_id', serverId)
      .where('created_at', '>=', threshold.toSQL())
      .where((sub) => {
        // Les pseudos Minecraft sont uniques sans tenir compte de la casse :
        // comparer en LOWER() empêche de contourner ce volet via Notch/notch.
        if (username !== null) sub.orWhereRaw('LOWER(username) = ?', [username.toLowerCase()])
        if (visitorPk !== null) sub.orWhere('visitor_id', visitorPk)
        if (ipHash !== null) sub.orWhere('ip_hash', ipHash)
      })
      .orderBy('created_at', 'desc')
      .first()

    if (!lastVote) return { allowed: true, nextVoteAt: null }

    return {
      allowed: false,
      nextVoteAt: lastVote.createdAt.plus({ minutes: this.COOLDOWN_MINUTES }),
    }
  }

  /**
   * Nombre de votes reçus par un serveur depuis le début du mois courant (base du
   * classement mensuel). Renvoyé à l'UI pour afficher « X votes ce mois-ci ».
   */
  static async monthlyCount(serverId: number): Promise<number> {
    const startOfMonth = DateTime.now().startOf('month')
    const result = await ServerVote.query()
      .where('server_id', serverId)
      .where('created_at', '>=', startOfMonth.toSQL())
      .count('* as total')

    return Number(result[0].$extras.total)
  }

  /**
   * Enregistre le vote et incrémente `servers.vote_count` de façon atomique.
   * Le cooldown est re-vérifié dans la transaction, après un verrou sur la ligne
   * serveur : le check du contrôleur seul est un check-then-insert non atomique,
   * des requêtes parallèles pourraient toutes le passer avant le premier insert.
   */
  static async record(input: RecordInput): Promise<RecordResult> {
    return db.transaction(async (trx) => {
      // Sérialise les votes concurrents d'un même serveur : le second attend le
      // commit du premier et son re-check voit alors le vote fraîchement inséré.
      await trx.from('servers').where('id', input.serverId).forUpdate().select('id')

      const cooldown = await this.checkCooldown(input.serverId, input, trx)
      if (!cooldown.allowed) {
        return { recorded: false as const, nextVoteAt: cooldown.nextVoteAt }
      }

      await ServerVote.create(
        {
          serverId: input.serverId,
          visitorId: input.visitorPk,
          userId: input.userId,
          username: input.username,
          mojangUuid: input.mojangUuid,
          ipHash: input.ipHash,
          country: input.country,
        },
        { client: trx }
      )

      const [row] = await trx
        .from('servers')
        .where('id', input.serverId)
        .increment('vote_count', 1)
        .returning('vote_count')

      return { recorded: true as const, voteCount: Number(row.vote_count) }
    })
  }
}
