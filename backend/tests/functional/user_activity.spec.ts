import User from '#models/user'
import Visitor from '#models/visitor'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

async function createUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
  return User.create({
    email: `activity_${suffix}@example.com`,
    username: `activity_${suffix}`,
    password: 'password123',
    verified: true,
    ...overrides,
  })
}

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

/**
 * Insère des pages vues à des instants imposés : `created_at` est en `autoCreate`
 * sur le modèle, donc le seul moyen de rejouer un historique est l'insert direct.
 * `minutesAgo` décrit chaque vue par son ancienneté.
 */
async function recordViews(
  user: User,
  visitorId: number,
  minutesAgo: number[],
  path = '/servers/1'
) {
  await db.table('page_views').multiInsert(
    minutesAgo.map((minutes) => ({
      visitor_id: visitorId,
      user_id: user.id,
      path,
      duration_ms: 1000,
      created_at: DateTime.now().minus({ minutes }).toSQL(),
    }))
  )
}

async function createVisitor() {
  const visitor = await Visitor.create({ uuid: randomUUID() })
  return visitor.id
}

test.group('User activity analytics', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('les vues sont découpées en connexions sur 30 minutes d’inactivité', async ({
    client,
    assert,
  }) => {
    const admin = await createUser({ role: 'admin' })
    const member = await createUser()
    const visitorId = await createVisitor()

    // Trois visites : deux vues rapprochées (10 min), puis deux autres à ~1 h et
    // ~3 h — soit 3 connexions et 5 pages vues.
    await recordViews(member, visitorId, [180, 175, 60, 55, 10])

    const response = await client
      .get('/api/v1/admin/analytics/users')
      .bearerToken(await bearerFor(admin))

    response.assertStatus(200)
    const row = response.body().data.find((entry: { id: number }) => entry.id === member.id)
    assert.exists(row)
    assert.equal(row.connections, 3)
    assert.equal(row.pageViews, 5)
    assert.equal(row.devices, 1)
    assert.equal(row.viewsPerConnection, 1.7)
  })

  test('le classement met les comptes les plus actifs en tête', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    const heavy = await createUser()
    const light = await createUser()

    await recordViews(heavy, await createVisitor(), [300, 240, 180, 120, 60])
    await recordViews(light, await createVisitor(), [90])

    const response = await client
      .get('/api/v1/admin/analytics/users')
      .qs({ sort: 'connections' })
      .bearerToken(await bearerFor(admin))

    response.assertStatus(200)
    const ranking: number[] = response.body().data.map((entry: { id: number }) => entry.id)
    assert.isBelow(ranking.indexOf(heavy.id), ranking.indexOf(light.id))
    assert.equal(response.body().totals.activeUsers, 2)
    assert.equal(response.body().totals.connections, 6)
  })

  test('la fenêtre exclut les visites hors période', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    const member = await createUser()

    await recordViews(member, await createVisitor(), [60 * 24 * 45, 30])

    const response = await client
      .get('/api/v1/admin/analytics/users')
      .qs({
        fromDate: DateTime.now().minus({ days: 7 }).toMillis(),
        toDate: DateTime.now().toMillis(),
      })
      .bearerToken(await bearerFor(admin))

    response.assertStatus(200)
    const row = response.body().data.find((entry: { id: number }) => entry.id === member.id)
    assert.equal(row.connections, 1)
    assert.equal(row.pageViews, 1)
  })

  test('la recherche filtre le classement sur le nom ou l’e-mail', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    const member = await createUser()
    const other = await createUser()

    await recordViews(member, await createVisitor(), [30])
    await recordViews(other, await createVisitor(), [30])

    const response = await client
      .get('/api/v1/admin/analytics/users')
      .qs({ search: member.username })
      .bearerToken(await bearerFor(admin))

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].id, member.id)
    assert.equal(response.body().meta.total, 1)
  })

  test('un utilisateur non admin ne peut pas lire le classement', async ({ client }) => {
    const member = await createUser()

    const response = await client
      .get('/api/v1/admin/analytics/users')
      .bearerToken(await bearerFor(member))

    response.assertStatus(403)
  })

  test('le détail admin d’un compte expose son activité', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    const member = await createUser()

    await recordViews(member, await createVisitor(), [120, 115], '/servers/42')

    const response = await client
      .get(`/api/v1/admin/users/${member.id}`)
      .bearerToken(await bearerFor(admin))

    response.assertStatus(200)
    const { activity } = response.body()
    assert.equal(activity.connections, 1)
    assert.equal(activity.pageViews, 2)
    assert.equal(activity.activeDays, 1)
    assert.deepEqual(activity.topPages, [{ path: '/servers/:id', views: 2 }])
    assert.lengthOf(activity.series, 1)
    assert.equal(activity.series[0].connections, 1)
  })
})
