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
  declare role: 'admin' | 'writer' | 'user'

  @column()
  declare avatarUrl: string | null

  @column({ serializeAs: null })
  declare verificationToken: string | null

  @column()
  declare verificationTokenExpires: DateTime | null

  @column({ serializeAs: null })
  declare passwordResetToken: string | null

  @column({ serializeAs: null })
  declare passwordResetTokenExpires: DateTime | null

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

  /**
   * Indique si un username est déjà pris (comparaison insensible à la casse, via
   * le même `lower(username)` que l'index unique). `exceptUserId` exclut un compte
   * (utile pour autoriser un utilisateur à re-soumettre son propre nom).
   */
  static async isUsernameTaken(username: string, exceptUserId?: number): Promise<boolean> {
    const query = User.query().whereRaw('lower(username) = ?', [username.trim().toLowerCase()])
    if (exceptUserId !== undefined) query.whereNot('id', exceptUserId)
    return (await query.first()) !== null
  }

  /**
   * Dérive un username libre à partir d'un nom souhaité (ex: pseudo OAuth qui peut
   * entrer en collision). Ajoute un court suffixe aléatoire si nécessaire pour ne
   * jamais violer l'index unique lors d'une création automatique.
   */
  static async generateUniqueUsername(base: string): Promise<string> {
    const cleaned = base.trim().slice(0, 254) || 'user'
    if (!(await this.isUsernameTaken(cleaned))) return cleaned

    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomBytes(3).toString('hex')
      const candidate = `${cleaned.slice(0, 254 - suffix.length - 1)}_${suffix}`
      if (!(await this.isUsernameTaken(candidate))) return candidate
    }

    return `${cleaned.slice(0, 240)}_${randomBytes(6).toString('hex')}`
  }
}
