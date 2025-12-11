import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import string from '@adonisjs/core/helpers/string'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare content: string

  @column()
  declare excerpt: string | null

  @column()
  declare coverImage: string | null

  @column()
  declare published: boolean

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static async generateSlug(post: Post) {
    if (!post.slug && post.title) {
      let slug = string.slug(post.title, { lower: true })

      // Vérifier si le slug existe déjà et ajouter un suffixe si nécessaire
      const existingPost = await Post.query().where('slug', slug).first()
      if (existingPost) {
        slug = `${slug}-${Date.now()}`
      }

      post.slug = slug
    }
  }
}
