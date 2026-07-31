import Server from '#models/server'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import Database from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { TIERS } from '../../app/constants/tiers.js'

const DAY_MS = 24 * 60 * 60 * 1000

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createServer() {
  return Server.create({
    name: 'Tier Test',
    address: `tier-${uid()}.example.com`,
    port: 25565,
    type: 'java',
  })
}

/** Jeton d'accès brut à passer en `Authorization: Bearer`. */
async function memberToken() {
  const user = await User.create({
    username: `member_${uid()}`,
    email: `${uid()}@example.com`,
    password: 'password123',
    verified: true,
  })
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function seedStats(serverId: number, count: number) {
  const now = DateTime.now()
  await Database.table('server_stats').multiInsert(
    Array.from({ length: count }, (_, index) => ({
      server_id: serverId,
      player_count: 100,
      max_count: 1000,
      created_at: now.minus({ minutes: 10 * index }).toSQL(),
    }))
  )
}

/**
 * Une plage qui dépasse le plafond de points invité sans atteindre celui des
 * membres — c'est exactement la zone que la connexion débloque.
 */
function betweenTiers() {
  const toDate = Date.now()
  const buckets = Math.floor((TIERS.guest.maxStatBuckets + TIERS.member.maxStatBuckets) / 2)
  return { fromDate: toDate - buckets * 60 * 60 * 1000, toDate, interval: '1 hour' }
}

test.group('Stats entitlements', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('refuse à un invité une plage réservée aux membres, et dit comment la débloquer', async ({
    client,
    assert,
  }) => {
    const server = await createServer()

    const response = await client.get(`/api/v1/servers/${server.id}/stats`).qs(betweenTiers())

    response.assertStatus(400)
    assert.equal(response.body().errors[0].code, 'E_TIER_LIMIT')
    assert.equal(response.body().limit, 'statBuckets')
    assert.equal(response.body().allowed, TIERS.guest.maxStatBuckets)
    assert.equal(response.body().unlockedBy, 'login')
  })

  test('sert la même plage à un membre', async ({ client }) => {
    const server = await createServer()

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats`)
      .header('authorization', `Bearer ${await memberToken()}`)
      .qs(betweenTiers())

    response.assertStatus(200)
  })

  test('plafonne la profondeur d’historique d’un invité', async ({ client, assert }) => {
    const server = await createServer()
    const toDate = Date.now()

    const response = await client.get(`/api/v1/servers/${server.id}/stats`).qs({
      fromDate: toDate - (TIERS.guest.maxHistoryDays! + 30) * DAY_MS,
      toDate,
      interval: '1 week',
    })

    response.assertStatus(400)
    assert.equal(response.body().limit, 'historyDays')
  })

  test('laisse passer le preset « 1 an » d’un invité, bornes arrondies comprises', async ({
    client,
  }) => {
    const server = await createServer()
    const toDate = Date.now()

    const response = await client.get(`/api/v1/servers/${server.id}/stats`).qs({
      fromDate: toDate - TIERS.guest.maxHistoryDays! * DAY_MS,
      toDate,
      interval: '1 day',
    })

    response.assertStatus(200)
  })

  test('plafonne la fenêtre de la journée type d’un invité', async ({ client, assert }) => {
    const server = await createServer()

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats/daily-rhythm`)
      .qs({ days: TIERS.guest.maxRhythmDays + 1 })

    response.assertStatus(400)
    assert.equal(response.body().limit, 'rhythmDays')
  })

  test('sort les réponses authentifiées du cache partagé', async ({ client, assert }) => {
    const server = await createServer()
    const query = { fromDate: Date.now() - 2 * DAY_MS, toDate: Date.now(), interval: '1 hour' }

    const anonymous = await client.get(`/api/v1/servers/${server.id}/stats`).qs(query)
    const member = await client
      .get(`/api/v1/servers/${server.id}/stats`)
      .header('authorization', `Bearer ${await memberToken()}`)
      .qs(query)

    // Cloudflare ignore `Vary` : une réponse de membre ne doit jamais pouvoir être
    // resservie à un anonyme depuis le cache partagé.
    assert.include(anonymous.header('cache-control'), 'public')
    assert.include(member.header('cache-control'), 'private')
  })

  test('réserve l’export aux membres', async ({ client, assert }) => {
    const server = await createServer()

    const response = await client.get(`/api/v1/servers/${server.id}/stats/export`).qs({
      fromDate: Date.now() - DAY_MS,
      toDate: Date.now(),
    })

    response.assertStatus(400)
    assert.equal(response.body().limit, 'statsExport')
    assert.equal(response.body().unlockedBy, 'login')
  })

  test('exporte un CSV en-têté pour un membre', async ({ client, assert }) => {
    const server = await createServer()
    await seedStats(server.id, 5)

    const response = await client
      .get(`/api/v1/servers/${server.id}/stats/export`)
      .header('authorization', `Bearer ${await memberToken()}`)
      .qs({ fromDate: Date.now() - DAY_MS, toDate: Date.now() })

    response.assertStatus(200)
    const [header, ...rows] = response.text().split('\n')
    assert.equal(header, 'createdAt,playerCount,peakPlayerCount,minPlayerCount,maxCount')
    assert.lengthOf(rows, 5)
  })

  test('annonce au client ses limites et ce qu’un compte débloquerait', async ({
    client,
    assert,
  }) => {
    const anonymous = await client.get('/api/v1/entitlements')
    anonymous.assertStatus(200)
    assert.equal(anonymous.body().tier, 'guest')
    assert.equal(anonymous.body().upgrade.tier, 'member')

    const member = await client
      .get('/api/v1/entitlements')
      .header('authorization', `Bearer ${await memberToken()}`)

    assert.equal(member.body().tier, 'member')
    assert.isNull(member.body().upgrade)
  })
})
