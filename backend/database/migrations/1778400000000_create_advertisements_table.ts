import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'advertisements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      // 'custom' = HTML/CSS maison rendu en iframe sandboxée.
      // 'network' = snippet de régie (AdSense, etc.) — prévu pour la phase 2.
      table.string('type', 20).notNullable().defaultTo('custom')
      table.text('html_content', 'longtext').notNullable()
      table.boolean('enabled').notNullable().defaultTo(false)
      // Poids pour la rotation pondérée (plus le poids est élevé, plus la pub sort souvent).
      table.integer('weight').unsigned().notNullable().defaultTo(1)
      // Emplacements d'affichage.
      table.boolean('show_on_home').notNullable().defaultTo(false)
      table.boolean('show_on_server').notNullable().defaultTo(false)
      // Planification optionnelle (NULL = pas de borne).
      table.timestamp('starts_at').nullable()
      table.timestamp('ends_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['enabled'], 'advertisements_enabled_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
