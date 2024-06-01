/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router
  .group(() => {
    router.resource('servers', '#controllers/servers_controller').except(['create', 'edit'])
    router.resource('servers.stats', '#controllers/stats_controller').only(['index'])
    router.resource('users', '#controllers/users_controller').except(['create', 'edit'])

    // Authentification
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/register', '#controllers/auth_controller.register')
    router.post('/verify-email', '#controllers/auth_controller.verifyEmail')
    router.get('/me', '#controllers/auth_controller.retrieveUser').use(middleware.auth())
    router
      .get('/login/:provider', '#controllers/auth_controller.providerLogin')
      .where('provider', /github|discord/)
    router.get('/callback/discord', '#controllers/auth_controller.discordCallback')
    router.get('/callback/github', '#controllers/auth_controller.githubCallback')
  })
  .prefix('/api/v1')
