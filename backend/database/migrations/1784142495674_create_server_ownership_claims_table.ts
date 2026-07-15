import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_ownership_claims'

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

      // L'utilisateur qui revendique la propriété. Cascade : si le compte est supprimé,
      // ses demandes en cours n'ont plus de sens.
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // 'dns' = preuve automatique par enregistrement TXT ; 'manual' = demande revue par un admin.
      table.string('method').notNullable()

      // 'pending' (en attente : TXT pas encore posé, ou demande manuelle non traitée),
      // 'verified' (propriété transférée), 'rejected' (demande manuelle refusée),
      // 'expired' (jeton DNS périmé sans vérification).
      table.string('status').notNullable().defaultTo('pending')

      // Jeton DNS : la valeur à publier dans l'enregistrement TXT. NULL pour une demande manuelle.
      table.string('token').nullable()

      // Preuve manuelle : texte libre (tag Discord, explication) + URL de preuve optionnelle.
      table.text('evidence').nullable()
      table.string('evidence_url').nullable()

      // Expiration du jeton DNS (propagation DNS parfois lente : fenêtre large). NULL = manuel.
      table.timestamp('expires_at', { useTz: true }).nullable()

      // Renseignés à la résolution de la demande.
      table.timestamp('verified_at', { useTz: true }).nullable()
      table
        .integer('reviewed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('review_note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Un seul dossier de réclamation par (serveur, utilisateur) : on réutilise/rejoue
      // la même ligne plutôt que d'empiler les demandes (cf. ServerOwnershipService.claimFor).
      table.unique(['server_id', 'user_id'])
      // Le tableau de bord admin liste les demandes manuelles en attente par ancienneté.
      table.index(['status', 'method'], 'server_ownership_claims_status_method_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
