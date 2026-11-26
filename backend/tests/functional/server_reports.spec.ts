import Server from '#models/server'
import ServerReport from '#models/server_report'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: 'user' | 'admin' | 'support' = 'user') {
  return User.create({
    username: `rpt_${uid()}`,
    email: `${uid()}@example.com`,
    password: 'password123',
    role,
    verified: true,
  })
}

async function tokenFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function createServer(fields: Partial<Server> = {}) {
  return Server.create({
    name: `Reported ${uid()}`,
    address: `rpt-${uid()}.example.com`,
    port: 25565,
    type: 'java',
    ...fields,
  })
}

test.group('Server reports — création', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('exige une authentification (401)', async ({ client }) => {
    const server = await createServer()
    const response = await client
      .post(`/api/v1/servers/${server.id}/report`)
      .json({ reason: 'scam' })
    response.assertStatus(401)
  })

  test('crée un signalement ouvert', async ({ client, assert }) => {
    const reporter = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'scam', details: 'A pris mon argent, jamais livré le rang.' })

    response.assertStatus(200)
    const report = await ServerReport.query().where('server_id', server.id).firstOrFail()
    assert.equal(report.reason, 'scam')
    assert.equal(report.reporterId, reporter.id)
    assert.equal(report.status, 'open')
  })

  test('peut signaler un serveur pending ou blocked (pas seulement approved)', async ({
    client,
    assert,
  }) => {
    const reporter = await createUser()
    const pending = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .post(`/api/v1/servers/${pending.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'inappropriate_content' })

    response.assertStatus(200)
    assert.isNotNull(await ServerReport.query().where('server_id', pending.id).first())
  })

  test('refuse un deuxième signalement ouvert du même membre sur le même serveur (409)', async ({
    client,
  }) => {
    const reporter = await createUser()
    const server = await createServer()
    const token = await tokenFor(reporter)

    const first = await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(token)
      .json({ reason: 'offline' })
    first.assertStatus(200)

    const second = await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(token)
      .json({ reason: 'scam' })
    second.assertStatus(409)
  })

  test('valide le corps de la requête (422)', async ({ client }) => {
    const reporter = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'not-a-reason' })

    response.assertStatus(422)
  })

  test('serveur introuvable (404)', async ({ client }) => {
    const reporter = await createUser()

    const response = await client
      .post('/api/v1/servers/999999999/report')
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'scam' })

    response.assertStatus(404)
  })
})

test.group('Server reports — file admin', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('refuse un utilisateur simple (403)', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .get('/api/v1/admin/servers/reports')
      .bearerToken(await tokenFor(user))
    response.assertStatus(403)
  })

  test('un support liste les signalements ouverts, avec serveur et rapporteur', async ({
    client,
    assert,
  }) => {
    const support = await createUser('support')
    const reporter = await createUser()
    const server = await createServer()

    await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({
        reason: 'fake_playercount',
        details: 'Toujours à 2000 joueurs, jamais plus jamais moins.',
      })

    const response = await client
      .get('/api/v1/admin/servers/reports')
      .bearerToken(await tokenFor(support))

    response.assertStatus(200)
    const body = response.body() as Array<{
      server: { id: number }
      reporter: { id: number; username: string }
      reason: string
    }>
    const mine = body.find((r) => r.server.id === server.id)
    assert.exists(mine)
    assert.equal(mine?.reason, 'fake_playercount')
    assert.equal(mine?.reporter.id, reporter.id)
  })

  test('un signalement résolu disparaît de la liste', async ({ client, assert }) => {
    const support = await createUser('support')
    const reporter = await createUser()
    const server = await createServer()
    const supportToken = await tokenFor(support)

    await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'scam' })

    const report = await ServerReport.query().where('server_id', server.id).firstOrFail()

    const resolve = await client
      .post(`/api/v1/admin/servers/reports/${report.id}/resolve`)
      .bearerToken(supportToken)
    resolve.assertStatus(200)

    await report.refresh()
    assert.equal(report.status, 'resolved')
    assert.equal(report.resolvedBy, support.id)

    const list = await client.get('/api/v1/admin/servers/reports').bearerToken(supportToken)
    const ids = list.body().map((r: { id: number }) => r.id)
    assert.notInclude(ids, report.id)
  })

  test('résoudre un signalement ne touche pas au statut de modération du serveur', async ({
    client,
    assert,
  }) => {
    const support = await createUser('support')
    const reporter = await createUser()
    const server = await createServer({ moderationStatus: 'approved' })

    await client
      .post(`/api/v1/servers/${server.id}/report`)
      .bearerToken(await tokenFor(reporter))
      .json({ reason: 'other', details: 'Juste pour voir' })
    const report = await ServerReport.query().where('server_id', server.id).firstOrFail()

    await client
      .post(`/api/v1/admin/servers/reports/${report.id}/resolve`)
      .bearerToken(await tokenFor(support))

    await server.refresh()
    assert.equal(server.moderationStatus, 'approved')
  })

  test('signalement introuvable (404)', async ({ client }) => {
    const support = await createUser('support')
    const response = await client
      .post('/api/v1/admin/servers/reports/999999999/resolve')
      .bearerToken(await tokenFor(support))
    response.assertStatus(404)
  })
})
