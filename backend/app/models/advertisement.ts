import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import AdvertisementEvent from '#models/advertisement_event'

export default class Advertisement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: 'custom' | 'network'

  @column()
  declare htmlContent: string

  @column()
  declare enabled: boolean

  @column()
  declare weight: number

  @column()
  declare showOnHome: boolean

  @column()
  declare showOnServer: boolean

  @column.dateTime()
  declare startsAt: DateTime | null

  @column.dateTime()
  declare endsAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Catégories de serveur ciblées. Vide = la pub s'affiche pour toutes les catégories.
   */
  @manyToMany(() => Category, {
    pivotTable: 'advertisement_categories',
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>

  @hasMany(() => AdvertisementEvent)
  declare events: HasMany<typeof AdvertisementEvent>

  /**
   * Vrai si la pub est diffusable maintenant (activée et dans sa fenêtre de planification).
   */
  isLiveAt(now: DateTime): boolean {
    if (!this.enabled) return false
    if (this.startsAt && this.startsAt > now) return false
    if (this.endsAt && this.endsAt < now) return false
    return true
  }
}
