import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import User from './user.js'
import type { BoostStatus } from '../constants/server_boost.js'
import type { BoostSignal } from './server_boost_score.js'

export default class ServerBoostReview extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'server_id' })
  declare serverId: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column()
  declare verdict: BoostStatus

  // Score et signaux figés au moment de la décision : c'est ce couple
  // (étiquette, vecteur) qui permettra de recalibrer les poids.
  @column({ columnName: 'score_at_review' })
  declare scoreAtReview: number

  // Sérialisation explicite : cf. `ServerBoostScore.signals`.
  @column({
    columnName: 'signals_at_review',
    prepare: (value: BoostSignal[]) => JSON.stringify(value),
  })
  declare signalsAtReview: BoostSignal[]

  @column({ columnName: 'reviewed_by' })
  declare reviewedBy: number | null

  @belongsTo(() => User, { foreignKey: 'reviewedBy' })
  declare reviewer: relations.BelongsTo<typeof User>

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
