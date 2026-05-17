import type User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class AdvertisementPolicy extends BasePolicy {
  /**
   * Seuls les administrateurs peuvent gérer les publicités.
   */
  manage(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }
}
