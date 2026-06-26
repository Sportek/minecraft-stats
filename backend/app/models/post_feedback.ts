import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Post from '#models/post'
import User from '#models/user'

export default class PostFeedback extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare postId: number

  @column()
  declare userId: number | null

  @column()
  declare visitorId: string

  @column()
  declare helpful: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Post)
  declare post: BelongsTo<typeof Post>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
