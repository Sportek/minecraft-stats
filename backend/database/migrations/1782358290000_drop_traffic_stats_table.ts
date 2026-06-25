import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Le volume de trafic est désormais compté dans Redis (compteurs partagés entre
 * process), pas dans une table SQL alimentée par le scheduler. On supprime donc
 * `traffic_stats`, créée à l'itération précédente.
 */
export default class extends BaseSchema {
  protected tableName = 'traffic_stats'

  async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  async down() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('bucket').notNullable().unique()
      table.integer('requests').notNullable().defaultTo(0)
      table.integer('errors').notNullable().defaultTo(0)
    })
  }
}
