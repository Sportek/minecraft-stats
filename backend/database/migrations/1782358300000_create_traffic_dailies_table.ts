import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Snapshot quotidien et durable des compteurs Redis (trafic, erreurs, visiteurs
  // uniques anonymes, répartition par pays). Redis reste la source temps réel,
  // mais ce snapshot survit à une recréation du volume Redis et à l'expiration des
  // clés (TTL ~100 jours) — c'est ce que lit le dashboard quand Redis n'a plus la
  // donnée. Voir `#services/analytics_counters`.
  protected tableName = 'traffic_daily'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.date('date').notNullable().unique()
      table.bigInteger('http_requests').notNullable().defaultTo(0)
      table.bigInteger('http_errors').notNullable().defaultTo(0)
      table.integer('unique_visitors').notNullable().defaultTo(0)
      // { "CA": 1234, "US": 567, ... } — vues par pays sur la journée.
      table.jsonb('countries').notNullable().defaultTo('{}')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
