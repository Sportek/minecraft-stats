import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class CategoryPolicy extends BasePolicy {
  create(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  destroy(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  update(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }
}
