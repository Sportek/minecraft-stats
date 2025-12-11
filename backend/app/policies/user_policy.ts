import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserPolicy extends BasePolicy {
  /**
   * Only admins can manage users
   */
  manage(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  destroy(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  store(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  update(user: User): AuthorizerResponse {
    return user.role === 'admin'
  }

  /**
   * Only admins can change user roles
   * Admins cannot change their own role (to prevent locking themselves out)
   */
  updateRole(user: User, targetUser: User): AuthorizerResponse {
    if (user.role !== 'admin') {
      return false
    }
    // Prevent admin from changing their own role
    if (user.id === targetUser.id) {
      return false
    }
    return true
  }
}
