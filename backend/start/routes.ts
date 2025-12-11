/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import swagger from '#config/swagger'
import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import { middleware } from './kernel.js'
import { throttleLight } from './limiter.js'

router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/swagger')
})

router
  .group(() => {
    // Gestion des ressources
    router
      .get('servers/paginate', '#controllers/servers_controller.paginate')
      .use(throttleLight('servers.paginate', 50))

    router
      .resource('servers', '#controllers/servers_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .use('*', throttleLight('servers', 35))

    router
      .resource('servers.categories', '#controllers/server_categories_controller')
      .only(['index', 'store', 'destroy'])
      .use('*', throttleLight('servers.categories', 8))

    router
      .resource('languages', '#controllers/languages_controller')
      .only(['index'])
      .use('*', throttleLight('languages', 8))

    router
      .resource('categories', '#controllers/categories_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .use('*', throttleLight('categories', 8))

    router
      .resource('servers.stats', '#controllers/stats_controller')
      .only(['index'])
      .use('*', throttleLight('servers.stats', 40))

    router
      .get('global-stats', '#controllers/stats_controller.globalStats')
      .use(throttleLight('global-stats', 40))

    router
      .resource('users', '#controllers/users_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .use('*', throttleLight('users', 8))

    router
      .get('website-stats', '#controllers/website_stats_controller.index')
      .use(throttleLight('website-stats', 10))

    // Authentification et gestion de compte
    router.post('/login', '#controllers/auth_controller.login').use(throttleLight('login', 5))
    router
      .post('/register', '#controllers/auth_controller.register')
      .use(throttleLight('register', 5))
    router
      .post('/verify-email', '#controllers/auth_controller.verifyEmail')
      .use(throttleLight('verify-email', 5))
    router
      .get('/me', '#controllers/auth_controller.retrieveUser')
      .use(middleware.auth())
      .use(throttleLight('me', 5))
    router
      .post('/change-password', '#controllers/auth_controller.changePassword')
      .use(middleware.auth())
      .use(throttleLight('change-password', 2))
    router
      .get('/login/:provider', '#controllers/auth_controller.providerLogin')
      .where('provider', /google|discord/)
      .use(throttleLight('provider-login', 5))
    router
      .get('/callback/google', '#controllers/auth_controller.googleCallback')
      .use(throttleLight('google-callback', 5))
    router
      .get('/callback/discord', '#controllers/auth_controller.discordCallback')
      .use(throttleLight('discord-callback', 5))

    // Blog - Posts publics
    router.get('posts', '#controllers/posts_controller.index').use(throttleLight('posts.index', 50))

    router
      .get('posts/:slug', '#controllers/posts_controller.show')
      .use(throttleLight('posts.show', 50))

    // Blog - Posts management (writers and admins via policy)
    router
      .group(() => {
        router
          .get('posts', '#controllers/posts_controller.adminIndex')
          .use(throttleLight('admin.posts.index', 20))
        router
          .post('posts', '#controllers/posts_controller.store')
          .use(throttleLight('admin.posts.store', 20))
        router
          .put('posts/:id', '#controllers/posts_controller.update')
          .use(throttleLight('admin.posts.update', 20))
        router
          .delete('posts/:id', '#controllers/posts_controller.destroy')
          .use(throttleLight('admin.posts.destroy', 20))
        router
          .post('posts/:id/publish', '#controllers/posts_controller.publish')
          .use(throttleLight('admin.posts.publish', 20))
        router
          .post('posts/:id/unpublish', '#controllers/posts_controller.unpublish')
          .use(throttleLight('admin.posts.unpublish', 20))

        // User management (admin only via policy)
        router
          .get('users', '#controllers/users_controller.adminIndex')
          .use(throttleLight('admin.users.index', 20))
        router
          .patch('users/:id/role', '#controllers/users_controller.updateRole')
          .use(throttleLight('admin.users.updateRole', 10))
      })
      .prefix('admin')
      .use(middleware.auth())

    // Blog - Image uploads (writers and admins via policy)
    router
      .post('uploads/image', '#controllers/uploads_controller.uploadImage')
      .use(middleware.auth())
      .use(throttleLight('uploads.image', 10))
  })
  .prefix('/api/v1')
