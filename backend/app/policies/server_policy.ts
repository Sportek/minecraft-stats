import type Server from '#models/server'
import type User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerPolicy extends BasePolicy {
  // `server.userId` peut être NULL (serveur orphelin dont le propriétaire a supprimé
  // son compte) : dans ce cas seul un admin passe.
  async destroy(user: User, server: Server): Promise<AuthorizerResponse> {
    return user.role === 'admin' || server.userId === user.id
  }

  async update(user: User, server: Server): Promise<AuthorizerResponse> {
    return user.role === 'admin' || server.userId === user.id
  }
}
