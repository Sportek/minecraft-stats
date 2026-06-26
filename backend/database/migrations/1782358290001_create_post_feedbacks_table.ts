import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'post_feedbacks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('post_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('posts')
        .onDelete('CASCADE')
      // Compte connecté au moment du vote (null si anonyme), pour permettre à
      // l'admin de savoir qui a donné son avis.
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      // UUID visiteur anonyme (même identifiant que l'analytics, stocké côté
      // client). Sert de clé de déduplication : un vote par appareil et par post.
      table.string('visitor_id').notNullable()
      table.boolean('helpful').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['post_id', 'visitor_id'])
      table.index(['post_id'], 'post_feedbacks_post_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
