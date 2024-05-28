/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.resource('servers', '#controllers/servers_controller').except(['create', 'edit'])
    router.resource('servers.stats', '#controllers/stats_controller').only(['index'])
    router.resource('users', '#controllers/users_controller').except(['create', 'edit'])
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/register', '#controllers/auth_controller.register')
    router.post('/verify-email', '#controllers/auth_controller.verifyEmail')
  })
  .prefix('/api/v1')
