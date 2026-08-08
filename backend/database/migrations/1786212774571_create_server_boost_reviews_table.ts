import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Journal des verdicts admin. Une ligne par décision, jamais écrasée.
 *
 * `score` et `signals` sont **copiés** ici au moment de la revue plutôt que lus par
 * jointure : le score du serveur bouge chaque jour, et une étiquette rattachée à un
 * vecteur de signaux qui a changé depuis ne vaut rien. Ce figeage est ce qui fait de
 * cette table un jeu d'entraînement exploitable — mesurer la précision par tranche de
 * score, puis remplacer les poids écrits à la main par une régression entraînée.
 */
export default class extends BaseSchema {
  protected tableName = 'server_boost_reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('server_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')

      // 'boosting' | 'clean' | 'inconclusive'.
      table.string('verdict').notNullable()

      table.integer('score_at_review').notNullable()
      table.jsonb('signals_at_review').notNullable()

      // SET NULL plutôt que CASCADE : la suppression d'un compte admin ne doit pas
      // effacer l'historique des décisions rendues.
      table
        .integer('reviewed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.text('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['server_id', 'created_at'], 'server_boost_reviews_server_created_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
