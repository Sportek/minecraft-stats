import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import User from '#models/user'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import ServerRegistrationService from '#services/server_registration_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: 'user' | 'admin' = 'user') {
  return User.create({
    username: `vis_${uid()}`,
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
    name: `Visibility ${uid()}`,
    address: `vis-${uid()}.example.com`,
    port: 25565,
    type: 'java',
    ...fields,
  })
}

/** Serveur dont `owner` a prouvé la propriété — seul cas où le masquage est permis. */
async function createVerifiedServer(owner: User, fields: Partial<Server> = {}) {
  return createServer({
    userId: owner.id,
    ownerVerifiedAt: DateTime.now(),
    ownerVerifiedMethod: 'motd',
    ...fields,
  })
}

test.group('Server visibility — permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('exige une authentification (401)', async ({ client }) => {
    const server = await createServer()
    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .json({ hidden: true })
    response.assertStatus(401)
  })

  test('refuse un propriétaire non vérifié et lui indique la marche à suivre (403)', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer({ userId: owner.id })

    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(owner))
      .json({ hidden: true })

    response.assertStatus(403)
    assert.match(response.body().message, /verif/i)
    await server.refresh()
    assert.isNull(server.hiddenAt)
  })

  test('refuse un tiers sur un serveur vérifié (403)', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)
    const stranger = await createUser()

    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(stranger))
      .json({ hidden: true })

    response.assertStatus(403)
    await server.refresh()
    assert.isNull(server.hiddenAt)
  })

  test('autorise un admin même sans vérification', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const server = await createServer()

    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(admin))
      .json({ hidden: true })

    response.assertStatus(200)
    await server.refresh()
    assert.isNotNull(server.hiddenAt)
  })

  test('valide le corps de la requête (422)', async ({ client }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)

    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(owner))
      .json({})

    response.assertStatus(422)
  })
})

test.group('Server visibility — effets du masquage', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('le propriétaire vérifié masque son serveur : il disparaît du public', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)

    const hide = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(owner))
      .json({ hidden: true })
    hide.assertStatus(200)
    assert.isNotNull(hide.body().hiddenAt)

    // Fiche publique : 410 dédié, sans aucune information sur le serveur.
    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(410)
    assert.isTrue(show.body().hidden)
    assert.notProperty(show.body(), 'server')

    // Stats et rythme : 410 aussi, l'historique n'est plus public.
    const stats = await client.get(`/api/v1/servers/${server.id}/stats?interval=1 hour`)
    stats.assertStatus(410)
    const rhythm = await client.get(
      `/api/v1/servers/${server.id}/stats/daily-rhythm?days=7&timezone=UTC`
    )
    rhythm.assertStatus(410)

    // Liste légère (sitemap, sélecteurs) et classement : absent.
    const index = await client.get('/api/v1/servers')
    const indexIds = index.body().map((item: { server: { id: number } }) => item.server.id)
    assert.notInclude(indexIds, server.id)

    const paginate = await client.get(`/api/v1/servers/paginate?ids=${server.id}&nocache=1`)
    assert.lengthOf(paginate.body().data, 0)

    // Votes : comme un serveur inexistant.
    const voteStatus = await client.get(
      `/api/v1/servers/${server.id}/vote-status?visitorId=${randomUUID()}`
    )
    voteStatus.assertStatus(404)
  })

  test('le propriétaire continue de voir son serveur masqué dans son tableau de bord', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner, { hiddenAt: DateTime.now() })

    const response = await client.get('/api/v1/servers/mine').bearerToken(await tokenFor(owner))

    response.assertStatus(200)
    const mine = response
      .body()
      .find((item: { server: { id: number } }) => item.server.id === server.id)
    assert.exists(mine)
    assert.isNotNull(mine.server.hiddenAt)
  })

  test('démasquer le remet en ligne et relance son ping au prochain tick', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner, {
      hiddenAt: DateTime.now(),
      nextPingAt: DateTime.now().plus({ days: 1 }),
    })

    const response = await client
      .patch(`/api/v1/servers/${server.id}/visibility`)
      .bearerToken(await tokenFor(owner))
      .json({ hidden: false })

    response.assertStatus(200)
    await server.refresh()
    assert.isNull(server.hiddenAt)
    assert.isNull(server.nextPingAt)

    const show = await client.get(`/api/v1/servers/${server.id}`)
    show.assertStatus(200)
  })
})

test.group('Server visibility — ré-ajout bloqué', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const realPing = ServerRegistrationService.pingServer
  group.each.teardown(() => {
    ServerRegistrationService.pingServer = realPing
  })

  // IP littérale publique : l'empreinte d'endpoint se calcule sans DNS.
  const address = '203.0.113.7'
  const favicon = `data:image/png;base64,${Buffer.from(`icon-${uid()}`).toString('base64')}`
  const motd = 'Hidden Visibility Test Network'

  const stubPing = () => {
    ServerRegistrationService.pingServer = async () => ({
      players: { online: 0, max: 100 },
      version: { name: '1.21' },
      description: motd,
      favicon,
    })
  }

  /** Serveur masqué portant les empreintes que le stub de ping va reproduire. */
  const createHiddenFingerprintedServer = async (owner: User) =>
    createVerifiedServer(owner, {
      address,
      hiddenAt: DateTime.now(),
      faviconHash: DuplicateDetectionService.hashFavicon(favicon),
      motdHash: DuplicateDetectionService.hashMotd(motd),
      resolvedEndpoint: `${address}:25565`,
    })

  test('un tiers ne peut pas ré-ajouter un serveur masqué, et rien ne fuite (409)', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const hidden = await createHiddenFingerprintedServer(owner)
    stubPing()

    const intruder = await createUser()
    const response = await client
      .post('/api/v1/servers')
      .bearerToken(await tokenFor(intruder))
      .json({
        name: 'Re-add attempt',
        address,
        port: 25565,
        type: 'java',
        categories: [],
        languages: [],
      })

    response.assertStatus(409)
    assert.isTrue(response.body().hidden)
    assert.notProperty(response.body(), 'existingServer')
    assert.notProperty(response.body(), 'matchedSignals')
    assert.notInclude(JSON.stringify(response.body()), hidden.name)

    const copies = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('address', address)
    assert.lengthOf(copies, 1)
  })
})

test.group('Server visibility — masqués exclus par défaut (modèle)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('find, query et first ignorent un serveur masqué', async ({ assert }) => {
    const hidden = await createServer({ hiddenAt: DateTime.now() })

    assert.isNull(await Server.find(hidden.id))
    assert.isNull(await Server.query().where('id', hidden.id).first())
    assert.lengthOf(await Server.query().where('id', hidden.id), 0)
  })

  test('withHidden les inclut explicitement', async ({ assert }) => {
    const hidden = await createServer({ hiddenAt: DateTime.now() })

    const found = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', hidden.id)
      .first()
    assert.equal(found?.id, hidden.id)
  })

  test('les comptages et le total de pagination les excluent', async ({ assert }) => {
    const name = `Count ${uid()}`
    await createServer({ name })
    await createServer({ name, hiddenAt: DateTime.now() })

    const [count] = await Server.query().where('name', name).count('* as total')
    assert.equal(Number(count.$extras.total), 1)

    const page = await Server.query().where('name', name).paginate(1, 10)
    assert.equal(page.total, 1)
    assert.lengthOf(page.all(), 1)

    const pageWithHidden = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('name', name)
      .paginate(1, 10)
    assert.equal(pageWithHidden.total, 2)
  })

  test('un preload de relation les exclut aussi, sauf opt-in', async ({ assert }) => {
    const owner = await createUser()
    const hidden = await createVerifiedServer(owner, { hiddenAt: DateTime.now() })
    const claim = await ServerOwnershipClaim.create({
      serverId: hidden.id,
      userId: owner.id,
      method: 'manual',
      status: 'pending',
    })

    const withoutOptIn = await ServerOwnershipClaim.query()
      .where('id', claim.id)
      .preload('server')
      .firstOrFail()
    assert.isNull(withoutOptIn.server)

    const withOptIn = await ServerOwnershipClaim.query()
      .where('id', claim.id)
      .preload('server', (query) => query.apply((scopes) => scopes.withHidden()))
      .firstOrFail()
    assert.equal(withOptIn.server.id, hidden.id)
  })

  test('refresh fonctionne sur une instance masquée', async ({ assert }) => {
    const server = await createServer({ hiddenAt: DateTime.now() })
    await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', server.id)
      .update({ name: 'Renamed' })

    await server.refresh()
    assert.equal(server.name, 'Renamed')
  })
})
