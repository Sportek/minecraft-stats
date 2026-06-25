import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Volume de trafic HTTP brut (toutes requêtes API confondues, humains + bots),
  // agrégé par heure. Alimenté par le flush du buffer en mémoire du middleware.
  protected tableName = 'traffic_stats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('bucket').notNullable().unique()
      table.integer('requests').notNullable().defaultTo(0)
      // Réponses 4xx/5xx, pour distinguer le trafic sain du bruit/erreurs.
      table.integer('errors').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
