import Server from '#models/server'
import ServerModerationReview from '#models/server_moderation_review'
import User from '#models/user'
import ServerRegistrationService from '#services/server_registration_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: 'user' | 'admin' | 'support' = 'user') {
  return User.create({
    username: `mod_${uid()}`,
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
    name: `Moderation ${uid()}`,
    address: `mod-${uid()}.example.com`,
    port: 25565,
    type: 'java',
    ...fields,
  })
}

test.group('Server moderation — permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('exige une authentification (401)', async ({ client }) => {
    const server = await createServer({ moderationStatus: 'pending' })
    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .json({ verdict: 'approved' })
    response.assertStatus(401)
  })

  test('refuse un utilisateur simple (403)', async ({ client }) => {
    const user = await createUser()
    const server = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(user))
      .json({ verdict: 'approved' })

    response.assertStatus(403)
  })

  test('autorise un support', async ({ client, assert }) => {
    const support = await createUser('support')
    const server = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'approved' })

    response.assertStatus(200)
    await server.refresh()
    assert.equal(server.moderationStatus, 'approved')
  })

  test('autorise un admin', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const server = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(admin))
      .json({ verdict: 'blocked' })

    response.assertStatus(200)
    await server.refresh()
    assert.equal(server.moderationStatus, 'blocked')
  })

  test('valide le corps de la requête (422)', async ({ client }) => {
    const support = await createUser('support')
    const server = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'not-a-verdict' })

    response.assertStatus(422)
  })

  test('serveur introuvable (404)', async ({ client }) => {
    const support = await createUser('support')

    const response = await client
      .post('/api/v1/admin/servers/999999999/review')
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'approved' })

    response.assertStatus(404)
  })
})

test.group('Server moderation — file à la soumission', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const realPing = ServerRegistrationService.pingServer
  group.each.teardown(() => {
    ServerRegistrationService.pingServer = realPing
  })

  test("un serveur nouvellement soumis démarre 'pending' et est invisible", async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const motd = `Pending Test ${uid()}`
    ServerRegistrationService.pingServer = async () => ({
      players: { online: 0, max: 100 },
      version: { name: '1.21' },
      description: motd,
      favicon: `data:image/png;base64,${Buffer.from(motd).toString('base64')}`,
    })

    const result = await ServerRegistrationService.register(
      {
        name: 'Pending Submission',
        address: `pending-${uid()}.example.com`,
        port: 25565,
        type: 'java',
        categories: [],
        languages: [],
      },
      owner
    )

    if (result.status !== 'created') throw new Error('expected creation')
    assert.equal(result.server.moderationStatus, 'pending')

    const show = await client.get(`/api/v1/servers/${result.server.id}`)
    show.assertStatus(404)

    const index = await client.get('/api/v1/servers')
    const indexIds = index.body().map((item: { server: { id: number } }) => item.server.id)
    assert.notInclude(indexIds, result.server.id)
  })

  test('un support approuve : le serveur devient public et repart en file de ping', async ({
    client,
    assert,
  }) => {
    const support = await createUser('support')
    const server = await createServer({
      moderationStatus: 'pending',
      nextPingAt: DateTime.now().plus({ days: 1 }),
    })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'approved', note: 'Looks legit' })
    response.assertStatus(200)

    await server.refresh()
    assert.equal(server.moderationStatus, 'approved')
    assert.isNotNull(server.moderationReviewedAt)
    assert.isNull(server.nextPingAt)

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(200)

    const review = await ServerModerationReview.query()
      .where('server_id', server.id)
      .orderBy('created_at', 'desc')
      .firstOrFail()
    assert.equal(review.verdict, 'approved')
    assert.equal(review.reviewedBy, support.id)
  })
})

test.group('Server moderation — blocage, indépendant du masquage propriétaire', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un serveur bloqué disparaît du public', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const server = await createServer({ moderationStatus: 'approved' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(admin))
      .json({ verdict: 'blocked', note: 'Fake stats' })
    response.assertStatus(200)

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(410)
    assert.isTrue(show.body().blocked)
    assert.notProperty(show.body(), 'server')
  })

  test('le propriétaire ne peut pas lever un blocage via son propre endpoint de visibilité', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer({
      userId: owner.id,
      ownerVerifiedAt: DateTime.now(),
      ownerVerifiedMethod: 'motd',
      moderationStatus: 'blocked',
      hiddenAt: null,
    })

    const unhide = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(owner))
      .json({ hidden: false })
    unhide.assertStatus(200)

    await server.refresh()
    assert.isNull(server.hiddenAt)
    assert.equal(server.moderationStatus, 'blocked')

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(410)
    assert.isTrue(show.body().blocked)
  })

  test('un support débloque via le même verdict "approved"', async ({ client }) => {
    const support = await createUser('support')
    const server = await createServer({ moderationStatus: 'blocked' })

    const response = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'approved' })
    response.assertStatus(200)

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(200)
  })
})

test.group('Server moderation — file de revue (adminIndex)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("liste les serveurs 'pending', les plus anciens d'abord", async ({ client, assert }) => {
    const support = await createUser('support')
    await createServer({ moderationStatus: 'approved' })
    await createServer({ moderationStatus: 'blocked' })
    const older = await createServer({
      moderationStatus: 'pending',
      createdAt: DateTime.now().minus({ days: 1 }),
    })
    const newer = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .get('/api/v1/admin/servers/pending')
      .bearerToken(await tokenFor(support))

    response.assertStatus(200)
    const ids = response.body().map((s: { id: number }) => s.id)
    assert.include(ids, older.id)
    assert.include(ids, newer.id)
    assert.isBelow(ids.indexOf(older.id), ids.indexOf(newer.id))
  })
})

test.group('Server moderation — recherche (ticket hors file)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('trouve un serveur déjà approuvé par nom, sans passer par la file pending', async ({
    client,
    assert,
  }) => {
    const support = await createUser('support')
    const target = await createServer({
      name: `Scam Network ${uid()}`,
      moderationStatus: 'approved',
    })
    await createServer({ name: `Unrelated ${uid()}`, moderationStatus: 'approved' })

    const response = await client
      .get('/api/v1/admin/servers/search?search=Scam Network')
      .bearerToken(await tokenFor(support))

    response.assertStatus(200)
    const ids = response.body().map((s: { id: number }) => s.id)
    assert.deepEqual(ids, [target.id])
  })

  test('bloque un serveur trouvé par la recherche, qui disparaît du public', async ({
    client,
    assert,
  }) => {
    const support = await createUser('support')
    const server = await createServer({ name: `Reported ${uid()}`, moderationStatus: 'approved' })

    const review = await client
      .post(`/api/v1/admin/servers/${server.id}/review`)
      .bearerToken(await tokenFor(support))
      .json({ verdict: 'blocked', note: 'Signalé sur Discord' })
    review.assertStatus(200)

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(410)
    assert.isTrue(show.body().blocked)
  })

  test("une recherche trop courte ne renvoie rien (pas d'erreur)", async ({ client, assert }) => {
    const support = await createUser('support')

    const response = await client
      .get('/api/v1/admin/servers/search?search=a')
      .bearerToken(await tokenFor(support))

    response.assertStatus(200)
    assert.deepEqual(response.body(), [])
  })

  test('refuse un utilisateur simple (403)', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .get('/api/v1/admin/servers/search?search=anything')
      .bearerToken(await tokenFor(user))

    response.assertStatus(403)
  })
})

test.group('Server moderation — fiche vue par un modérateur', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un support voit un serveur pending (public : 404)', async ({ client, assert }) => {
    const support = await createUser('support')
    const server = await createServer({ moderationStatus: 'pending' })

    const anon = await client.get(`/api/v1/servers/${server.id}`)
    anon.assertStatus(404)

    const asSupport = await client
      .get(`/api/v1/servers/${server.id}`)
      .bearerToken(await tokenFor(support))
    asSupport.assertStatus(200)
    assert.equal(asSupport.body().server.id, server.id)
    assert.equal(asSupport.body().server.moderationStatus, 'pending')
  })

  test('un admin voit un serveur blocked (public : 410)', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const server = await createServer({ moderationStatus: 'blocked' })

    const anon = await client.get(`/api/v1/servers/${server.id}`)
    anon.assertStatus(410)

    const asAdmin = await client
      .get(`/api/v1/servers/${server.id}`)
      .bearerToken(await tokenFor(admin))
    asAdmin.assertStatus(200)
    assert.equal(asAdmin.body().server.moderationStatus, 'blocked')
  })

  test('un utilisateur simple authentifié ne voit pas plus que le public', async ({ client }) => {
    const user = await createUser()
    const server = await createServer({ moderationStatus: 'pending' })

    const response = await client
      .get(`/api/v1/servers/${server.id}`)
      .bearerToken(await tokenFor(user))
    response.assertStatus(404)
  })

  test("404 reste 404 même pour un modérateur si le serveur n'existe pas", async ({ client }) => {
    const admin = await createUser('admin')

    const response = await client
      .get('/api/v1/servers/999999999')
      .bearerToken(await tokenFor(admin))
    response.assertStatus(404)
  })
})

test.group('Server moderation — exclusion par défaut (modèle)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('find, query et first ignorent un serveur pending ou blocked', async ({ assert }) => {
    const pending = await createServer({ moderationStatus: 'pending' })
    const blocked = await createServer({ moderationStatus: 'blocked' })

    assert.isNull(await Server.find(pending.id))
    assert.isNull(await Server.find(blocked.id))
  })

  test('withHidden les inclut explicitement', async ({ assert }) => {
    const pending = await createServer({ moderationStatus: 'pending' })

    const found = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', pending.id)
      .first()
    assert.equal(found?.id, pending.id)
  })
})
