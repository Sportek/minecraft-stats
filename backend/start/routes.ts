/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import swagger from '#config/swagger'
import { cacheHeaders } from '#middleware/cache_headers_middleware'
import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import { middleware } from './kernel.js'
import { throttleLight } from './limiter.js'

const PUBLIC_STATS = cacheHeaders({ maxAge: 300, sWR: 600 })
const PUBLIC_PAGINATE = cacheHeaders({ maxAge: 60, sWR: 120 })
const PUBLIC_LONG = cacheHeaders({ maxAge: 3600 })
const NO_STORE = cacheHeaders({ noStore: true })

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
      .use([throttleLight('servers.paginate', 50), PUBLIC_PAGINATE])

    router
      .get('servers/mine', '#controllers/servers_controller.mine')
      .use([middleware.auth(), throttleLight('servers.mine', 30), NO_STORE])

    router
      .resource('servers', '#controllers/servers_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .middleware(['destroy', 'store', 'update'], NO_STORE)
      .use('*', throttleLight('servers', 35))

    router
      .resource('servers.categories', '#controllers/server_categories_controller')
      .only(['index', 'store', 'destroy'])
      .middleware(['store', 'destroy'], NO_STORE)
      .use('*', throttleLight('servers.categories', 8))

    router
      .resource('languages', '#controllers/languages_controller')
      .only(['index'])
      .middleware('index', PUBLIC_LONG)
      .use('*', throttleLight('languages', 8))

    router
      .resource('categories', '#controllers/categories_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .middleware(['destroy', 'store', 'update'], NO_STORE)
      .middleware('index', PUBLIC_LONG)
      .use('*', throttleLight('categories', 8))

    router
      .resource('servers.stats', '#controllers/stats_controller')
      .only(['index'])
      .middleware('index', PUBLIC_STATS)
      .use('*', throttleLight('servers.stats', 40))

    router
      .get('global-stats', '#controllers/stats_controller.globalStats')
      .use([throttleLight('global-stats', 40), PUBLIC_STATS])

    router
      .resource('users', '#controllers/users_controller')
      .except(['create', 'edit'])
      .middleware(['index', 'show', 'destroy', 'store', 'update'], middleware.auth())
      .middleware(['index', 'show'], NO_STORE)
      .use('*', throttleLight('users', 8))

    router
      .get('website-stats', '#controllers/website_stats_controller.index')
      .use(throttleLight('website-stats', 10))

    // Authentification et gestion de compte
    router
      .post('/login', '#controllers/auth_controller.login')
      .use([throttleLight('login', 5), NO_STORE])
    router
      .post('/register', '#controllers/auth_controller.register')
      .use([throttleLight('register', 5), NO_STORE])
    router
      .post('/verify-email', '#controllers/auth_controller.verifyEmail')
      .use([throttleLight('verify-email', 5), NO_STORE])
    router
      .get('/me', '#controllers/auth_controller.retrieveUser')
      .use(middleware.auth())
      .use([throttleLight('me', 5), NO_STORE])
    router
      .post('/change-password', '#controllers/auth_controller.changePassword')
      .use(middleware.auth())
      .use([throttleLight('change-password', 2), NO_STORE])
    router
      .post('/account/avatar', '#controllers/auth_controller.updateAvatar')
      .use(middleware.auth())
      .use([throttleLight('account.avatar', 5), NO_STORE])
    router
      .post('/logout', '#controllers/auth_controller.logout')
      .use(middleware.auth())
      .use([throttleLight('logout', 10), NO_STORE])
    router
      .post('/logout-all', '#controllers/auth_controller.logoutAll')
      .use(middleware.auth())
      .use([throttleLight('logout-all', 5), NO_STORE])

    // Personal API tokens (for automated clients)
    router
      .get('/account/api-tokens', '#controllers/api_tokens_controller.index')
      .use(middleware.auth())
      .use([throttleLight('api-tokens.index', 20), NO_STORE])
    router
      .post('/account/api-tokens', '#controllers/api_tokens_controller.store')
      .use(middleware.auth())
      .use([throttleLight('api-tokens.store', 5), NO_STORE])
    router
      .delete('/account/api-tokens/:id', '#controllers/api_tokens_controller.destroy')
      .use(middleware.auth())
      .use([throttleLight('api-tokens.destroy', 10), NO_STORE])

    router
      .get('/login/:provider', '#controllers/auth_controller.providerLogin')
      .where('provider', /google|discord/)
      .use([throttleLight('provider-login', 5), NO_STORE])
    router
      .get('/callback/google', '#controllers/auth_controller.googleCallback')
      .use([throttleLight('google-callback', 5), NO_STORE])
    router
      .get('/callback/discord', '#controllers/auth_controller.discordCallback')
      .use([throttleLight('discord-callback', 5), NO_STORE])

    // Blog - Posts publics
    router.get('posts', '#controllers/posts_controller.index').use(throttleLight('posts.index', 50))

    router
      .get('posts/:slug', '#controllers/posts_controller.show')
      .use(throttleLight('posts.show', 50))

    // Blog - Placeholders (public)
    router
      .get('posts/placeholders/list', '#controllers/posts_controller.getPlaceholders')
      .use(throttleLight('posts.placeholders.list', 20))

    router
      .post('posts/placeholders/resolve', '#controllers/posts_controller.resolvePlaceholders')
      .use(throttleLight('posts.placeholders.resolve', 60))

    // Publicités - Diffusion publique
    router
      .get('advertisements', '#controllers/advertisements_controller.index')
      .use([throttleLight('advertisements.index', 60), PUBLIC_PAGINATE])
    router
      .post(
        'advertisements/:id/impression',
        '#controllers/advertisements_controller.recordImpression'
      )
      .use([throttleLight('advertisements.impression', 120), NO_STORE])
    router
      .get('advertisements/:id/click', '#controllers/advertisements_controller.click')
      .use([throttleLight('advertisements.click', 120), NO_STORE])

    // Analytics first-party — tracking d'usage du site
    router
      .post('analytics/hit', '#controllers/analytics_controller.hit')
      .use([throttleLight('analytics.hit', 240), NO_STORE])
    router
      .post('analytics/pageview', '#controllers/analytics_controller.pageview')
      .use([throttleLight('analytics.pageview', 120), NO_STORE])
    router
      .post('analytics/identify', '#controllers/analytics_controller.identify')
      .use(middleware.auth())
      .use([throttleLight('analytics.identify', 20), NO_STORE])

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

        // Placeholders preview (writers and admins)
        router
          .post('posts/placeholders/preview', '#controllers/posts_controller.previewPlaceholder')
          .use(throttleLight('admin.posts.placeholders.preview', 20))

        // Analytics dashboard (admin only)
        router
          .get('analytics', '#controllers/analytics_controller.dashboard')
          .use([middleware.admin(), throttleLight('admin.analytics', 30), NO_STORE])

        // User management (admin only via policy)
        router
          .get('users', '#controllers/users_controller.adminIndex')
          .use(throttleLight('admin.users.index', 20))
        router
          .get('users/:id', '#controllers/users_controller.adminShow')
          .use([throttleLight('admin.users.show', 30), NO_STORE])
        router
          .patch('users/:id/role', '#controllers/users_controller.updateRole')
          .use(throttleLight('admin.users.updateRole', 10))

        // Advertisements management (admin only via policy)
        router
          .get('advertisements', '#controllers/advertisements_controller.adminIndex')
          .use([throttleLight('admin.advertisements.index', 30), NO_STORE])
        router
          .get('advertisements/:id/stats', '#controllers/advertisements_controller.stats')
          .use([throttleLight('admin.advertisements.stats', 30), NO_STORE])
        router
          .get('advertisements/:id', '#controllers/advertisements_controller.show')
          .use([throttleLight('admin.advertisements.show', 30), NO_STORE])
        router
          .post('advertisements', '#controllers/advertisements_controller.store')
          .use([throttleLight('admin.advertisements.store', 20), NO_STORE])
        router
          .put('advertisements/:id', '#controllers/advertisements_controller.update')
          .use([throttleLight('admin.advertisements.update', 20), NO_STORE])
        router
          .delete('advertisements/:id', '#controllers/advertisements_controller.destroy')
          .use([throttleLight('admin.advertisements.destroy', 20), NO_STORE])
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
