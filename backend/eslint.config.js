import { configApp } from '@adonisjs/eslint-config'

export default [
  ...configApp(),
  {
    ignores: [
      'app/PrometheusMetricController.ts',
      // Généré par `node ace migration:run` (scan des tables), et non formaté par le
      // générateur : sans cette exclusion, toute régénération fait échouer `eslint .`
      // sur des erreurs prettier dans un fichier que personne n'écrit à la main.
      'database/schema.ts',
    ],
  },
]
