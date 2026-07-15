import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Horodatage de la vérification de propriété. NULL = personne n'a jamais prouvé
      // la propriété (le `user_id` courant n'est alors qu'un simple "ajouteur", pas un
      // propriétaire confirmé). Une fois non-NULL, seule une autre preuve DNS de la même
      // personne — ou une décision admin — peut transférer le serveur (cf. ServerOwnershipService).
      table.timestamp('owner_verified_at', { useTz: true }).nullable()

      // Comment la propriété a été prouvée : 'dns' (self-service, enregistrement TXT) ou
      // 'manual' (demande revue et approuvée par un admin). NULL tant que non vérifié.
      table.string('owner_verified_method').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('owner_verified_at')
      table.dropColumn('owner_verified_method')
    })
  }
}
