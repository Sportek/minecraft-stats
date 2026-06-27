import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'post_translations'

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
      table.string('locale', 5).notNullable()
      table.string('title', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.text('content', 'longtext').notNullable()
      table.text('excerpt').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Une seule traduction par (article, langue) ; slug unique par langue.
      // L'unique (locale, slug) sert aussi d'index pour le lookup public.
      table.unique(['post_id', 'locale'])
      table.unique(['locale', 'slug'])
    })

    // Langue principale de l'article, utilisée en fallback quand la traduction
    // demandée n'existe pas. Tous les articles existants sont en anglais.
    this.schema.alterTable('posts', (table) => {
      table.string('default_locale', 5).notNullable().defaultTo('en')
    })

    // Recopier le contenu existant en traduction 'en' AVANT de supprimer les
    // colonnes sources (l'ordre des deferred suit celui de déclaration).
    this.defer(async (db) => {
      await db.rawQuery(
        `insert into post_translations (post_id, locale, title, slug, content, excerpt, created_at, updated_at)
         select id, 'en', title, slug, content, excerpt, created_at, updated_at from posts`
      )
    })

    // Le texte vit désormais dans post_translations. Sous PostgreSQL, supprimer
    // la colonne `slug` retire automatiquement sa contrainte unique
    // (`posts_slug_unique`), pas besoin d'un dropUnique explicite.
    this.schema.alterTable('posts', (table) => {
      table.dropColumn('title')
      table.dropColumn('slug')
      table.dropColumn('content')
      table.dropColumn('excerpt')
    })
  }

  async down() {
    this.schema.alterTable('posts', (table) => {
      table.string('title', 255).nullable()
      table.string('slug', 255).nullable()
      table.text('content', 'longtext').nullable()
      table.text('excerpt').nullable()
    })

    // Restaurer le texte depuis la traduction de la langue principale.
    this.defer(async (db) => {
      await db.rawQuery(
        `update posts p
         set title = t.title, slug = t.slug, content = t.content, excerpt = t.excerpt
         from post_translations t
         where t.post_id = p.id and t.locale = p.default_locale`
      )
    })

    this.schema.alterTable('posts', (table) => {
      table.dropColumn('default_locale')
    })

    this.schema.dropTable('post_translations')
  }
}
