import type Server from '#models/server'
import type User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerCategoryPolicy extends BasePolicy {
  // `server.userId` peut être NULL (serveur orphelin) : seul un admin passe alors.
  destroy(user: User, server: Server): AuthorizerResponse {
    return user.role === 'admin' || server.userId === user.id
  }

  update(user: User, server: Server): AuthorizerResponse {
    return user.role === 'admin' || server.userId === user.id
  }
}
