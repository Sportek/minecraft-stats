import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import type { BoostLevel, BoostSignalKey } from '../constants/server_boost.js'

/** Contribution d'un signal au score, telle qu'affichée à l'admin. */
export interface BoostSignal {
  key: BoostSignalKey
  points: number
  /** Phrase prête à lire, avec la mesure qui l'a déclenchée. */
  detail: string
}

export default class ServerBoostScore extends BaseModel {
  @column({ isPrimary: true, columnName: 'server_id' })
  declare serverId: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column()
  declare score: number

  @column()
  declare level: BoostLevel

  // Sans `prepare`, Lucid passe le tableau tel quel à pg, qui l'encode en littéral
  // de tableau Postgres (`{...}`) et non en JSON — la colonne jsonb le rejette.
  @column({ prepare: (value: BoostSignal[]) => JSON.stringify(value) })
  declare signals: BoostSignal[]

  // `decimal` revient en string depuis pg (précision arbitraire) : on le ramène en
  // number à la lecture, sinon le front reçoit "4.00" au lieu de 4.
  @column({
    columnName: 'detected_factor',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare detectedFactor: number | null

  @column({ columnName: 'estimated_real_players' })
  declare estimatedRealPlayers: number | null

  @column.dateTime({ columnName: 'window_from' })
  declare windowFrom: DateTime

  @column.dateTime({ columnName: 'window_to' })
  declare windowTo: DateTime

  @column({ columnName: 'samples_count' })
  declare samplesCount: number

  @column.dateTime({ columnName: 'computed_at' })
  declare computedAt: DateTime
}
