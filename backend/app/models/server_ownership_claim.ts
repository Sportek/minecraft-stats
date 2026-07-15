import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import User from './user.js'
import type { OwnershipClaimStatus, OwnershipMethod } from '../constants/server_ownership.js'

/**
 * Dossier de réclamation de propriété d'un serveur. Une ligne par (serveur, utilisateur) :
 * la même ligne est réutilisée/rejouée plutôt que d'empiler les demandes.
 *
 * Deux méthodes cohabitent (colonne `method`) :
 *  - 'dns'    : `token` + `expiresAt` renseignés ; vérifié automatiquement.
 *  - 'manual' : `evidence` (+ `evidenceUrl`) renseignés ; revu par un admin
 *               (`reviewedBy`, `reviewNote`).
 */
export default class ServerOwnershipClaim extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'server_id' })
  declare serverId: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @column()
  declare method: OwnershipMethod

  @column()
  declare status: OwnershipClaimStatus

  // Jeton DNS à publier (méthode 'dns'). NULL en manuel.
  @column({ serializeAs: null })
  declare token: string | null

  // Preuve libre fournie par le demandeur (méthode 'manual').
  @column()
  declare evidence: string | null

  @column({ columnName: 'evidence_url' })
  declare evidenceUrl: string | null

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @column.dateTime({ columnName: 'verified_at' })
  declare verifiedAt: DateTime | null

  // Admin ayant tranché une demande manuelle.
  @column({ columnName: 'reviewed_by' })
  declare reviewedBy: number | null

  @belongsTo(() => User, { foreignKey: 'reviewedBy' })
  declare reviewer: relations.BelongsTo<typeof User>

  @column({ columnName: 'review_note' })
  declare reviewNote: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** Un jeton est-il encore valable (non expiré) ? */
  get isTokenActive(): boolean {
    if (!this.token || !this.expiresAt) return false
    return this.expiresAt > DateTime.now()
  }

  /**
   * Ce dossier peut-il être rejoué tel quel pour `method` ? Vrai quand c'est une
   * demande auto de la même méthode, en attente, avec un jeton encore actif — on
   * réutilise alors le jeton au lieu d'en émettre un nouveau.
   */
  isReusableFor(method: OwnershipMethod): boolean {
    return this.method === method && this.status === 'pending' && this.isTokenActive
  }
}
