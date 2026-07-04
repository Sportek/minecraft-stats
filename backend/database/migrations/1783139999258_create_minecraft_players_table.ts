import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'minecraft_players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // UUID Mojang sans tirets — clé de partage de la tête entre tous les votes
      // d'un même joueur.
      table.string('uuid', 32).notNullable().unique()

      table.string('username').notNullable()

      // Chemin relatif de la tête rendue (ex. `/images/heads/<uuid>`), NULL tant
      // que le skin n'a pas encore été récupéré/rendu.
      table.string('head_path').nullable()

      // Hash de la texture du skin : évite de re-rendre une tête inchangée.
      table.string('texture_hash', 64).nullable()

      table.timestamp('resolved_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
