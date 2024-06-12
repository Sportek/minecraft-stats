import Server from '#models/server'
import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ServerPolicy extends BasePolicy {
  destroy(user: User, server: Server): AuthorizerResponse {
    return server.load('user').then(() => {
      return user.id === server.user.id || user.role === 'admin'
    })
  }

  update(user: User, server: Server): AuthorizerResponse {
    return server.load('user').then(() => {
      return user.id === server.user.id || user.role === 'admin'
    })
  }
}
