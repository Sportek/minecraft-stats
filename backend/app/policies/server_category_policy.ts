import type Server from '#models/server'
import type User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerCategoryPolicy extends BasePolicy {
  destroy(user: User, server: Server): AuthorizerResponse {
    return server.user.id === user.id || user.role === 'admin'
  }

  update(user: User, server: Server): AuthorizerResponse {
    return server.user.id === user.id || user.role === 'admin'
  }
}
