/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import swagger from "#config/swagger";
import router from '@adonisjs/core/services/router';
import AutoSwagger from "adonis-autoswagger";
import { middleware } from './kernel.js';
import { throttleLight } from "./limiter.js";

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
      .use('*', throttleLight('servers', 8))

    router
      .resource('servers.categories', '#controllers/server_categories_controller')
      .only(['index', 'store', 'destroy'])
      .use('*', throttleLight('servers.categories', 8))

    router
      .resource('categories', '#controllers/categories_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .use('*', throttleLight('categories', 8))

    router.resource('servers.stats', '#controllers/stats_controller').only(['index']).use('*', throttleLight('servers.stats', 40))

    router
      .resource('users', '#controllers/users_controller')
      .except(['create', 'edit'])
      .middleware(['destroy', 'store', 'update'], middleware.auth())
      .use('*', throttleLight('users', 8))

    router.get('website-stats', '#controllers/website_stats_controller.index').use(throttleLight('website-stats', 10))

    // Authentification et gestion de compte
    router.post('/login', '#controllers/auth_controller.login').use(throttleLight('login', 5))
    router.post('/register', '#controllers/auth_controller.register').use(throttleLight('register', 5))
    router.post('/verify-email', '#controllers/auth_controller.verifyEmail').use(throttleLight('verify-email', 5))
    router.get('/me', '#controllers/auth_controller.retrieveUser').use(middleware.auth()).use(throttleLight('me', 5))
    router
      .post('/change-password', '#controllers/auth_controller.changePassword')
      .use(middleware.auth())
      .use(throttleLight('change-password', 2))
    router
      .get('/login/:provider', '#controllers/auth_controller.providerLogin')
      .where('provider', /google|discord/)
      .use(throttleLight('provider-login', 5))
    router.get('/callback/google', '#controllers/auth_controller.googleCallback').use(throttleLight('google-callback', 5))
    router.get('/callback/discord', '#controllers/auth_controller.discordCallback').use(throttleLight('discord-callback', 5))
  })
  .prefix('/api/v1')
