import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import Language from '#models/language'
import Server from '#models/server'
import StatsService from '#services/stat_service'
import LanguageSeeder from './language_seeder.js'

const DAYS = 14
const STEP_MINUTES = 10

// Adresses en `.invalid` (TLD réservé, RFC 2606) : si un contributeur lance le
// scheduler en local, il ne pingue aucun vrai serveur tiers.
const DEMO_SERVERS = [
  { name: 'Demo Survie', base: 420, categories: ['Survival'], languages: ['fr'] },
  { name: 'Demo Skyblock', base: 260, categories: ['Skyblock'], languages: ['fr', 'en'] },
  { name: 'Demo PvP Arena', base: 180, categories: ['PvP', 'Minigames'], languages: ['en'] },
  { name: 'Demo Roleplay', base: 95, categories: ['Roleplay'], languages: ['fr'] },
  { name: 'Demo Creative', base: 60, categories: ['Creative'], languages: ['en'] },
  { name: 'Demo Minigames', base: 310, categories: ['Minigames'], languages: ['de', 'en'] },
  { name: 'Demo Factions', base: 140, categories: ['Factions', 'PvP'], languages: ['fr'] },
  { name: 'Demo Vanilla', base: 25, categories: ['Survival'], languages: ['es'] },
].map((server, index) => ({ ...server, address: `demo-${index + 1}.minecraft-stats.invalid` }))

/**
 * Jeu de données de démo pour le développement local : quelques serveurs fictifs
 * avec 14 jours d'historique, leurs rollups horaires/journaliers et leurs
 * métriques de croissance. Relançable : un serveur déjà présent est ignoré.
 */
export default class DemoSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    await new LanguageSeeder(this.client).run()

    const created: Array<{ server: Server; base: number }> = []
    for (const demo of DEMO_SERVERS) {
      const existing = await Server.query()
        .apply((scopes) => scopes.withHidden())
        .where('address', demo.address)
        .first()
      if (existing) continue

      const server = await Server.create({
        name: demo.name,
        address: demo.address,
        port: 25565,
        type: 'java',
        version: '1.21',
        motd: `${demo.name} — serveur de démonstration`,
      })

      const categories = await Promise.all(
        demo.categories.map((name) => Category.firstOrCreate({ name }))
      )
      await server.related('categories').attach(categories.map((category) => category.id))
      const languages = await Language.query().whereIn('code', demo.languages)
      await server.related('languages').attach(languages.map((language) => language.id))

      created.push({ server, base: demo.base })
    }

    if (created.length === 0) return

    for (const { server, base } of created) {
      await this.insertHistory(server, base)
    }
    await this.computeRollups(created.map(({ server }) => server.id))
    await StatsService.calculateAndStoreGrowthStats()
  }

  /**
   * Courbe réaliste : creux vers 5 h UTC, pic vers 20 h, week-ends plus chargés,
   * légère tendance sur la période et un peu de bruit.
   */
  private async insertHistory(server: Server, base: number) {
    const maxCount = Math.ceil((base * 2.5) / 100) * 100
    const now = Date.now() - (Date.now() % (STEP_MINUTES * 60_000))
    const points = (DAYS * 24 * 60) / STEP_MINUTES
    const rows = []

    for (let i = points; i >= 0; i--) {
      const date = new Date(now - i * STEP_MINUTES * 60_000)
      const hour = date.getUTCHours() + date.getUTCMinutes() / 60
      const daily = 0.55 + 0.45 * Math.cos(((hour - 20) / 24) * 2 * Math.PI)
      const weekend = [0, 6].includes(date.getUTCDay()) ? 1.2 : 1
      const trend = 1 + (0.15 * (points - i)) / points
      const noise = 0.9 + Math.random() * 0.2
      rows.push({
        server_id: server.id,
        player_count: Math.round(base * daily * weekend * trend * noise),
        max_count: maxCount,
        created_at: date,
      })
    }

    for (let i = 0; i < rows.length; i += 1000) {
      await db.table('server_stats').multiInsert(rows.slice(i, i + 1000))
    }

    // Champs « dernier ping » et pic que le scheduler tient à jour en prod : sans
    // eux, la liste affiche les serveurs comme hors ligne.
    const last = rows[rows.length - 1]
    const peak = rows.reduce((best, row) => (row.player_count > best.player_count ? row : best))
    await server
      .merge({
        lastPlayerCount: last.player_count,
        lastMaxCount: maxCount,
        lastStatsAt: DateTime.fromJSDate(last.created_at),
        lastOnlineAt: DateTime.fromJSDate(last.created_at),
        peakPlayerCount: peak.player_count,
        peakPlayerAt: DateTime.fromJSDate(peak.created_at),
      })
      .save()
  }

  /** Même agrégation que `backfill:hourly-stats` puis `backfill:daily-stats`. */
  private async computeRollups(serverIds: number[]) {
    await db.rawQuery(
      `INSERT INTO server_stats_hourly (server_id, hour, avg_player_count, peak_player_count, min_player_count, max_slot_count, samples_count)
       SELECT server_id, date_trunc('hour', created_at), ROUND(AVG(player_count))::int,
              MAX(player_count)::int, MIN(player_count)::int, MAX(max_count), COUNT(*)::int
       FROM server_stats WHERE server_id = ANY(:ids)
       GROUP BY server_id, date_trunc('hour', created_at)
       ON CONFLICT (server_id, hour) DO NOTHING`,
      { ids: serverIds }
    )
    await db.rawQuery(
      `INSERT INTO server_stats_daily (server_id, day, avg_player_count, peak_player_count, min_player_count, max_slot_count, samples_count)
       SELECT server_id, date_trunc('day', hour),
              ROUND(SUM(avg_player_count::bigint * samples_count)::numeric / NULLIF(SUM(samples_count), 0))::int,
              MAX(peak_player_count)::int, MIN(min_player_count)::int, MAX(max_slot_count), SUM(samples_count)::int
       FROM server_stats_hourly WHERE server_id = ANY(:ids)
       GROUP BY server_id, date_trunc('day', hour)
       ON CONFLICT (server_id, day) DO NOTHING`,
      { ids: serverIds }
    )
  }
}
