import { BaseSchema } from '@adonisjs/lucid/schema'
import { deriveServerWebsite } from '#utils/server_website'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('website').nullable()
    })

    // Backfill : déduire le site web des serveurs existants depuis leur adresse
    // (play.hypixel.net -> hypixel.net). Les adresses IP/locales restent NULL.
    this.defer(async (db) => {
      const rows = await db.from(this.tableName).select('id', 'address')
      for (const row of rows) {
        const website = deriveServerWebsite(row.address)
        if (website) {
          await db.from(this.tableName).where('id', row.id).update({ website })
        }
      }
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('website')
    })
  }
}
