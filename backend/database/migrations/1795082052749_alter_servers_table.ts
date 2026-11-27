import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('moderation_status', 50).notNullable().defaultTo('approved')
      table.timestamp('moderation_reviewed_at', { useTz: true }).nullable()
    })

    this.schema.raw(
      `CREATE INDEX servers_moderation_status_index ON servers (moderation_status) WHERE moderation_status != 'approved'`
    )
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS servers_moderation_status_index`)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('moderation_status')
      table.dropColumn('moderation_reviewed_at')
    })
  }
}
