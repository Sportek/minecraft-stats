import Post from '#models/post'
import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class PostPolicy extends BasePolicy {
  /**
   * Check if user can manage posts (create, list all, upload images)
   * Admins and writers can manage posts
   */
  manage(user: User): AuthorizerResponse {
    return user.role === 'admin' || user.role === 'writer'
  }

  /**
   * Check if user can update a specific post
   * Writers can only update their own posts, admins can update any post
   */
  update(user: User, post: Post): AuthorizerResponse {
    if (user.role === 'admin') {
      return true
    }
    if (user.role === 'writer') {
      return user.id === post.userId
    }
    return false
  }

  /**
   * Check if user can delete a specific post
   * Writers can only delete their own posts, admins can delete any post
   */
  destroy(user: User, post: Post): AuthorizerResponse {
    if (user.role === 'admin') {
      return true
    }
    if (user.role === 'writer') {
      return user.id === post.userId
    }
    return false
  }

  /**
   * Check if user can publish/unpublish a post
   * Writers can only publish/unpublish their own posts, admins can do any
   */
  publish(user: User, post: Post): AuthorizerResponse {
    if (user.role === 'admin') {
      return true
    }
    if (user.role === 'writer') {
      return user.id === post.userId
    }
    return false
  }
}
