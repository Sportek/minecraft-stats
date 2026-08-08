import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Score de suspicion de gonflage des connectés — une ligne par serveur, réécrite
 * à chaque passage du balayage quotidien (cf. `BoostDetectionService.scanAll`).
 *
 * `server_id` est la clé primaire : on ne garde que le score courant. L'historique
 * des décisions vit dans `server_boost_reviews`, qui fige le vecteur de signaux au
 * moment de la revue — c'est ce journal, et non cette table, qui sert de jeu étiqueté
 * pour recalibrer les poids plus tard.
 */
export default class extends BaseSchema {
  protected tableName = 'server_boost_scores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('server_id')
        .unsigned()
        .primary()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')

      table.integer('score').notNullable()

      // 'clean' | 'watch' | 'likely' — dérivé du score, dénormalisé pour filtrer
      // la file admin sans recalculer les seuils côté SQL.
      table.string('level').notNullable()

      // Détail point par point : [{ key, points, detail }]. C'est ce que l'admin lit
      // pour décider — un score nu n'est pas une preuve.
      table.jsonb('signals').notNullable()

      // Facteur de multiplication détecté (4, 6, 16, 3.7…) et estimation du compte
      // réel qui en découle. NULL quand la suspicion ne vient pas d'un multiplicateur.
      table.decimal('detected_factor', 6, 2).nullable()
      table.integer('estimated_real_players').nullable()

      // Bornes de la fenêtre analysée + volume observé : sans ça, un score n'est pas
      // interprétable (7 jours pleins ou 12 heures de relevés ne se valent pas).
      table.timestamp('window_from', { useTz: true }).notNullable()
      table.timestamp('window_to', { useTz: true }).notNullable()
      table.integer('samples_count').notNullable()

      table.timestamp('computed_at', { useTz: true }).notNullable()

      // La file admin lit "les scores les plus élevés d'abord".
      table.index(['score'], 'server_boost_scores_score_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
