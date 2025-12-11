import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Change the column from enum to varchar, add the new value, then keep as varchar
    // This is simpler than modifying PostgreSQL enums which is complex
    this.schema.alterTable(this.tableName, (table) => {
      table.string('role_new', 50).defaultTo('user')
    })

    // Copy existing values
    this.schema.raw(`UPDATE "${this.tableName}" SET "role_new" = "role"::text`)

    // Drop the old enum column
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })

    // Rename new column
    this.schema.raw(`ALTER TABLE "${this.tableName}" RENAME COLUMN "role_new" TO "role"`)
  }

  async down() {
    // Convert back to enum (without writer)
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('role_old', ['admin', 'user']).defaultTo('user')
    })

    // Copy values (convert writer to user)
    this.schema.raw(`
      UPDATE "${this.tableName}"
      SET "role_old" = CASE
        WHEN "role" = 'writer' THEN 'user'
        ELSE "role"
      END
    `)

    // Drop the varchar column
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })

    // Rename
    this.schema.raw(`ALTER TABLE "${this.tableName}" RENAME COLUMN "role_old" TO "role"`)
  }
}
