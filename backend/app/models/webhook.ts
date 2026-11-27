import { BaseModel, column, computed } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { WebhookEvent } from '../constants/webhook.js'

export default class Webhook extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ serializeAs: null })
  declare url: string

  // Sans `prepare`, pg encode le tableau en littéral Postgres (`{...}`), que jsonb rejette.
  @column({ prepare: (value: WebhookEvent[]) => JSON.stringify(value) })
  declare events: WebhookEvent[]

  @column()
  declare enabled: boolean

  @column({ columnName: 'last_status' })
  declare lastStatus: number | null

  @column({ columnName: 'last_error' })
  declare lastError: string | null

  @column.dateTime({ columnName: 'last_sent_at' })
  declare lastSentAt: DateTime | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed()
  get maskedUrl(): string {
    return this.url.replace(/\/[\w-]+$/, (token) => `/${'•'.repeat(8)}${token.slice(-4)}`)
  }
}
