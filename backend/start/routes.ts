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
  })
  .prefix('/api/v1')
