import Server from '#models/server'
import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerCategoryPolicy extends BasePolicy {
  destroy(user: User, server: Server): AuthorizerResponse {
    return server.user.id === user.id || user.role === 'admin'
  }

  update(user: User, server: Server): AuthorizerResponse {
    return server.user.id === user.id || user.role === 'admin'
  }
}
