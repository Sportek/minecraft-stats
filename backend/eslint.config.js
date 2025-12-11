import { configApp } from '@adonisjs/eslint-config'

export default [
  ...configApp(),
  {
    ignores: ['app/PrometheusMetricController.ts'],
  },
]
