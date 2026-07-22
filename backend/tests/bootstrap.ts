import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executer after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    // Le rate-limiter est keyé sur l'IP et tous les tests partagent 127.0.0.1 : sans
    // remise à zéro, le budget d'une route (5 req/min) est consommé par les tests
    // précédents et les suivants reçoivent un 429 au lieu du statut attendu.
    // `onTest` ne voit que les tests posés directement sur la suite ; ceux déclarés
    // dans un `test.group()` passent par `onGroup`. Les deux sont nécessaires.
    suite.onTest((test) => test.setup(() => limiter.clear()))
    suite.onGroup((group) => group.each.setup(() => limiter.clear()))

    // Limite connue : les réponses en cache (TTL 300 s) survivent à la transaction
    // globale. En CI chaque run part d'un Redis vierge, donc sans effet ; en local,
    // relancer la suite dans les 5 minutes peut resservir un classement calculé au
    // run précédent et faire échouer `server_votes`. Un `redis.flushdb()` ici ne
    // règle pas le problème : la connexion est configurée avec
    // `enableOfflineQueue: false` et rejette la commande, ce qui casse le client
    // pour tout le reste du run — testé avant et après le démarrage du serveur.
    return suite.setup(() => testUtils.httpServer().start())
  }
}
