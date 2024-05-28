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
    router.resource('servers', 'ServersController').except(['create', 'edit'])
    router.resource('servers.stats', 'StatsController').only(['index'])
    router.resource('users', 'UsersController').except(['create', 'edit'])
    router.post('/login', 'AuthController@login')
    router.post('/register', 'AuthController@register')
  })
  .prefix('/api/v1')
