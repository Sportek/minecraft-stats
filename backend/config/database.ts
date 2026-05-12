import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const isProd = env.get('NODE_ENV') === 'production'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      // debug=true loggue chaque query côté stdout — coûteux en prod (cf. investigation P.1.6).
      debug: !isProd,
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      // Pool tuning (cf. P.1.6) — défaut Knex { min: 2, max: 10 } trop bas pour les bursts
      // observés (jusqu'à ~20 ops/s sur des handlers parallèles avec Promise.all).
      // À coordonner avec `max_connections` côté Postgres si plusieurs apps partagent l'instance.
      pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30_000,
        idleTimeoutMillis: 30_000,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
