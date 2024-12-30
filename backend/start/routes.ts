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
import AutoSwagger from "adonis-autoswagger";
import swagger from "#config/swagger";

// returns swagger in YAML
router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});

// Renders Swagger-UI and passes YAML-output of /swagger
router.get("/docs", async () => {
  return AutoSwagger.default.ui("/swagger", swagger);
  // return AutoSwagger.default.scalar("/swagger"); to use Scalar instead
  // return AutoSwagger.default.rapidoc("/swagger", "view"); to use RapiDoc instead (pass "view" default, or "read" to change the render-style)
});

router
  .group(() => {
    // Gestion des ressources
    router
      .resource('servers', '#controllers/servers_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())

    router
      .resource('servers.categories', '#controllers/server_categories_controller')
      .only(['index', 'store', 'destroy'])

    router
      .resource('categories', '#controllers/categories_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())

    router.resource('servers.stats', '#controllers/stats_controller').only(['index'])

    router
      .resource('users', '#controllers/users_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())

    router.get('website-stats', '#controllers/website_stats_controller.index')

    // Authentification et gestion de compte
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/register', '#controllers/auth_controller.register')
    router.post('/verify-email', '#controllers/auth_controller.verifyEmail')
    router.get('/me', '#controllers/auth_controller.retrieveUser').use(middleware.auth())
    router
      .post('/change-password', '#controllers/auth_controller.changePassword')
      .use(middleware.auth())
    router
      .get('/login/:provider', '#controllers/auth_controller.providerLogin')
      .where('provider', /google|discord/)
    router.get('/callback/google', '#controllers/auth_controller.googleCallback')
    router.get('/callback/discord', '#controllers/auth_controller.discordCallback')
  })
  .prefix('/api/v1')
