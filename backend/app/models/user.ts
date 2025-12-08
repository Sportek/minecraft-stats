import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import Post from '#models/post'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column({ serializeAs: null })
  declare email: string

  @column()
  declare verified: boolean

  @column()
  declare provider: 'discord' | 'google' | null

  @column()
  declare role: 'admin' | 'user'

  @column()
  declare avatarUrl: string | null

  @column({ serializeAs: null })
  declare verificationToken: string | null

  @column()
  declare verificationTokenExpires: DateTime | null

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>

  static readonly accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  @beforeCreate()
  static async createVerificationToken(user: User) {
    user.verificationToken = randomBytes(4).toString('hex')
    user.verificationTokenExpires = DateTime.now().plus({ days: 7 })
  }
}
