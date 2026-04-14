import type Server from '#models/server'
import type User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { type AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerPolicy extends BasePolicy {
  async destroy(user: User, server: Server): Promise<AuthorizerResponse> {
    await server.load('user')
    return user.id === server.user.id || user.role === 'admin'
  }

  async update(user: User, server: Server): Promise<AuthorizerResponse> {
    await server.load('user')
    return user.id === server.user.id || user.role === 'admin'
  }
}
