import Server from '#models/server'
import StatsService from '#services/stat_service'
import testUtils from '@adonisjs/core/services/test_utils'
import Database from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const PARIS = 'Europe/Paris'

async function createServer() {
  return Server.create({
    name: 'Test Rhythm Server',
    address: 'rhythm.test.example.com',
    port: 25565,
    type: 'java',
  })
}

/**
 * Sème un relevé par demi-heure sur `days` jours pleins, en heure de Paris, avec
 * un profil journalier marqué : creux la nuit, pic en soirée. `playersAt` reste
 * la seule source du profil attendu, pour que les assertions ne recopient pas la
 * logique du service.
 */
function playersAt(hour: number) {
  if (hour >= 20 && hour < 23) return 500
  if (hour >= 2 && hour < 6) return 20
  return 100
}

async function seedStats(serverId: number, days: number, endsAt: DateTime) {
  const rows: Record<string, unknown>[] = []

  for (let halfHour = 0; halfHour < days * 48; halfHour++) {
    const at = endsAt.minus({ minutes: 30 * (halfHour + 1) })
    rows.push({
      server_id: serverId,
      player_count: playersAt(at.hour),
      max_count: 1000,
      created_at: at.toSQL(),
    })
  }

  await Database.table('server_stats').multiInsert(rows)
}

test.group('Daily rhythm', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('replie l’historique sur 48 créneaux dans le fuseau demandé', async ({ assert }) => {
    const server = await createServer()
    const endsAt = DateTime.now().setZone(PARIS).startOf('day')
    await seedStats(server.id, 10, endsAt)

    const rhythm = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 12,
      timezone: PARIS,
    })

    assert.equal(rhythm.slotMinutes, 30)
    assert.equal(rhythm.series.all.length, 48)
    assert.equal(rhythm.timezone, PARIS)

    // 21 h 00 en heure de Paris = créneau 42, et non ce que dirait une lecture UTC.
    const evening = rhythm.series.all.find((slot) => slot.slot === 42)
    const night = rhythm.series.all.find((slot) => slot.slot === 8)

    assert.equal(evening?.playerCount, 500)
    assert.equal(evening?.minuteOfDay, 1260)
    assert.equal(night?.playerCount, 20)
  })

  test('compte les jours distincts, pas les relevés', async ({ assert }) => {
    const server = await createServer()
    await seedStats(server.id, 10, DateTime.now().setZone(PARIS).startOf('day'))

    const rhythm = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 12,
      timezone: PARIS,
    })

    const slot = rhythm.series.all.find((entry) => entry.slot === 42)
    assert.equal(slot?.daysCount, 10)
    assert.equal(slot?.samplesCount, 10)
    assert.equal(rhythm.daysObserved.all, 10)
  })

  test('sépare semaine et week-end sur le calendrier local', async ({ assert }) => {
    const server = await createServer()
    // 14 jours pleins couvrent exactement deux week-ends, où qu’on démarre.
    await seedStats(server.id, 14, DateTime.now().setZone(PARIS).startOf('day'))

    const rhythm = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 16,
      timezone: PARIS,
    })

    assert.equal(rhythm.daysObserved.weekend, 4)
    assert.equal(rhythm.daysObserved.weekday, 10)
    assert.equal(rhythm.daysObserved.all, 14)
    assert.equal(rhythm.series.weekend.length, 48)
  })

  test('décale les créneaux quand le fuseau change', async ({ assert }) => {
    const server = await createServer()
    await seedStats(server.id, 10, DateTime.now().setZone(PARIS).startOf('day'))

    const paris = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 12,
      timezone: PARIS,
    })
    const utc = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 12,
      timezone: 'UTC',
    })

    const parisPeak = paris.series.all.find((slot) => slot.playerCount === 500)!
    const utcPeak = utc.series.all.find((slot) => slot.playerCount === 500)!
    const offsetSlots = DateTime.now().setZone(PARIS).offset / 30

    assert.equal(utcPeak.slot, parisPeak.slot - offsetSlots)
  })

  test('bascule sur le rollup horaire au-delà d’un mois de fenêtre', async ({ assert }) => {
    const server = await createServer()
    const endsAt = DateTime.now().setZone(PARIS).startOf('day')
    const rows: Record<string, unknown>[] = []

    for (let hour = 0; hour < 40 * 24; hour++) {
      const at = endsAt.minus({ hours: hour + 1 })
      rows.push({
        server_id: server.id,
        hour: at.toSQL(),
        avg_player_count: playersAt(at.hour),
        peak_player_count: playersAt(at.hour) * 2,
        min_player_count: 0,
        max_slot_count: 1000,
        samples_count: 6,
      })
    }
    await Database.table('server_stats_hourly').multiInsert(rows)

    const rhythm = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 40,
      timezone: PARIS,
    })

    // Le rollup ne descend pas sous l'heure : 24 créneaux, pas 48.
    assert.equal(rhythm.slotMinutes, 60)
    assert.equal(rhythm.series.all.length, 24)

    const evening = rhythm.series.all.find((slot) => slot.slot === 21)
    assert.equal(evening?.playerCount, 500)
    assert.equal(evening?.peakPlayerCount, 1000)
    assert.equal(evening?.minuteOfDay, 1260)
    assert.equal(evening?.daysCount, 40)
  })

  test('ne renvoie aucun créneau pour un serveur sans relevé', async ({ assert }) => {
    const server = await createServer()

    const rhythm = await StatsService.getDailyRhythm({
      server_id: server.id,
      days: 30,
      timezone: PARIS,
    })

    assert.lengthOf(rhythm.series.all, 0)
    assert.equal(rhythm.daysObserved.all, 0)
  })

  test('expose la journée type sur l’API publique', async ({ client, assert }) => {
    const server = await createServer()
    await seedStats(server.id, 10, DateTime.now().setZone(PARIS).startOf('day'))

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats/daily-rhythm`)
      .qs({ days: 12, timezone: PARIS })

    response.assertStatus(200)
    assert.equal(response.body().slotMinutes, 30)
    assert.lengthOf(response.body().series.all, 48)
  })

  test('refuse un fuseau horaire inconnu (422)', async ({ client }) => {
    const server = await createServer()

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats/daily-rhythm`)
      .qs({ timezone: 'Mars/Olympus_Mons' })

    response.assertStatus(422)
  })

  test('refuse une fenêtre au-delà du plafond (422)', async ({ client }) => {
    const server = await createServer()

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats/daily-rhythm`)
      .qs({ days: 5000, timezone: PARIS })

    response.assertStatus(422)
  })
})
