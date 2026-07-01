import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Tout se fait dans un seul bloc déféré (donc séquentiel et dans la transaction
    // de la migration) : on dédoublonne d'abord les usernames existants, PUIS on
    // pose l'index unique — sinon la création de l'index échouerait sur les doublons.
    this.defer(async (db) => {
      // Doublons insensibles à la casse : on garde le compte le plus ancien (id le
      // plus bas) intact et on renomme les autres. `ORDER BY id` → rn=1 = le plus ancien.
      const duplicates = await db.rawQuery(
        `SELECT id, username
           FROM (
             SELECT id, username,
                    ROW_NUMBER() OVER (PARTITION BY lower(username) ORDER BY id) AS rn
               FROM users
           ) ranked
          WHERE rn > 1
          ORDER BY id`
      )

      for (const row of duplicates.rows as Array<{ id: number; username: string }>) {
        // On laisse de la marge sous la limite varchar(255) pour le suffixe.
        const base = row.username.slice(0, 240)
        let candidate = `${base}_${row.id}`
        let attempt = 0

        // Garantit l'unicité (insensible à la casse) contre l'état courant de la
        // table, y compris les lignes déjà renommées dans cette même boucle.
        while (
          await db
            .from('users')
            .whereRaw('lower(username) = ?', [candidate.toLowerCase()])
            .whereNot('id', row.id)
            .first()
        ) {
          attempt += 1
          candidate = `${base}_${row.id}_${attempt}`
        }

        await db.from('users').where('id', row.id).update({ username: candidate })
      }

      await db.rawQuery(
        'CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username))'
      )
    })
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS users_username_lower_unique')
  }
}
