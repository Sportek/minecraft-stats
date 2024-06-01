import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserPolicy extends BasePolicy {
  destroy(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  store(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  update(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }
}
