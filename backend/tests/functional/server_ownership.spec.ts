import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import User from '#models/user'
import ServerOwnershipService, { dnsTxtValue } from '#services/server_ownership_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: 'user' | 'admin' = 'user') {
  return User.create({
    username: `owner_${uid()}`,
    email: `${uid()}@example.com`,
    password: 'password123',
    role,
    verified: true,
  })
}

/** Jeton d'accès brut à passer en `Authorization: Bearer`. */
async function tokenFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function createServer(address = `claim-${uid()}.example.com`) {
  return Server.create({ name: 'Claim Test', address, port: 25565, type: 'java' })
}

test.group('Server ownership — claims', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Résolveur TXT par défaut : ne trouve rien. Les tests DNS le surchargent puis
  // le restaurent, pour rester hermétiques (aucune requête DNS réseau).
  const realResolveTxt = ServerOwnershipService.resolveTxt
  group.each.teardown(() => {
    ServerOwnershipService.resolveTxt = realResolveTxt
  })

  test('exige une authentification (401)', async ({ client }) => {
    const server = await createServer()
    const response = await client.get(`/api/v1/servers/${server.id}/claim`)
    response.assertStatus(401)
  })

  test('startDns renvoie l’enregistrement TXT à publier', async ({ client, assert }) => {
    const user = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/dns`)
      .bearerToken(await tokenFor(user))

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.claim.method, 'dns')
    assert.equal(body.claim.status, 'pending')
    assert.equal(body.dns.recordType, 'TXT')
    assert.match(body.dns.recordValue, /^minecraft-stats-verify=[0-9a-f]{32}$/)
    // Le jeton brut ne doit jamais être sérialisé tel quel dans `claim`.
    assert.isUndefined(body.claim.token)
  })

  test('startDns refuse un serveur en IP nue (409 dns_unavailable)', async ({ client, assert }) => {
    const user = await createUser()
    const server = await createServer('192.0.2.10')

    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/dns`)
      .bearerToken(await tokenFor(user))

    response.assertStatus(409)
    assert.equal(response.body().reason, 'dns_unavailable')
  })

  test('startDns refuse un serveur déjà vérifié par autrui (409)', async ({ client, assert }) => {
    const otherOwner = await createUser()
    const server = await createServer()
    server.merge({
      userId: otherOwner.id,
      ownerVerifiedAt: DateTime.now(),
      ownerVerifiedMethod: 'dns',
    })
    await server.save()

    const intruder = await createUser()
    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/dns`)
      .bearerToken(await tokenFor(intruder))

    response.assertStatus(409)
    assert.equal(response.body().reason, 'already_verified')
  })

  test('verifyDns sans demande renvoie no_claim (400)', async ({ client, assert }) => {
    const user = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/dns/verify`)
      .bearerToken(await tokenFor(user))

    response.assertStatus(400)
    assert.equal(response.body().reason, 'no_claim')
  })

  test('verifyDns sans TXT publié renvoie not_found_record (400)', async ({ client, assert }) => {
    const user = await createUser()
    const server = await createServer()
    const token = await tokenFor(user)
    // Le TXT publié ne contient pas notre jeton.
    ServerOwnershipService.resolveTxt = async () => [['v=spf1 include:_spf.google.com ~all']]

    await client.post(`/api/v1/servers/${server.id}/claim/dns`).bearerToken(token)
    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/dns/verify`)
      .bearerToken(token)

    response.assertStatus(400)
    assert.equal(response.body().reason, 'not_found_record')
  })

  test('verifyDns avec le bon TXT transfère la propriété', async ({ client, assert }) => {
    const fan = await createUser()
    const server = await createServer()
    server.merge({ userId: fan.id }) // ajouté par un fan, non confirmé
    await server.save()

    const realOwner = await createUser()
    const authToken = await tokenFor(realOwner)

    const start = await client.post(`/api/v1/servers/${server.id}/claim/dns`).bearerToken(authToken)
    start.assertStatus(200)

    // On lit le jeton (non sérialisé) en base pour simuler sa publication en TXT.
    const claim = await ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', realOwner.id)
      .firstOrFail()
    ServerOwnershipService.resolveTxt = async () => [[dnsTxtValue(claim.token!)]]

    const verify = await client
      .post(`/api/v1/servers/${server.id}/claim/dns/verify`)
      .bearerToken(authToken)
    verify.assertStatus(200)
    assert.isTrue(verify.body().verified)

    await server.refresh()
    assert.equal(server.userId, realOwner.id)
    assert.isNotNull(server.ownerVerifiedAt)
    assert.equal(server.ownerVerifiedMethod, 'dns')

    await claim.refresh()
    assert.equal(claim.status, 'verified')
  })

  test('submitManual crée une demande en attente', async ({ client, assert }) => {
    const user = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/manual`)
      .bearerToken(await tokenFor(user))
      .json({
        evidence: 'Je suis le proprio, Discord: owner#1234',
        evidenceUrl: 'https://imgur.com/proof',
      })

    response.assertStatus(200)
    assert.equal(response.body().claim.method, 'manual')
    assert.equal(response.body().claim.status, 'pending')

    const claim = await ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', user.id)
      .firstOrFail()
    assert.equal(claim.status, 'pending')
    assert.equal(claim.evidenceUrl, 'https://imgur.com/proof')
  })

  test('submitManual refuse une preuve trop courte (422)', async ({ client }) => {
    const user = await createUser()
    const server = await createServer()

    const response = await client
      .post(`/api/v1/servers/${server.id}/claim/manual`)
      .bearerToken(await tokenFor(user))
      .json({ evidence: 'moi' })

    response.assertStatus(422)
  })

  test('un admin approuve une demande manuelle et la propriété est transférée', async ({
    client,
    assert,
  }) => {
    const fan = await createUser()
    const server = await createServer()
    // Serveur ajouté par un "fan" non confirmé.
    server.merge({ userId: fan.id })
    await server.save()

    const realOwner = await createUser()
    await client
      .post(`/api/v1/servers/${server.id}/claim/manual`)
      .bearerToken(await tokenFor(realOwner))
      .json({ evidence: 'Propriétaire légitime, preuve en pièce jointe.' })

    const claim = await ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', realOwner.id)
      .firstOrFail()

    const admin = await createUser('admin')
    const response = await client
      .post(`/api/v1/admin/ownership-claims/${claim.id}/approve`)
      .bearerToken(await tokenFor(admin))
      .json({ note: 'Preuve valide' })

    response.assertStatus(200)

    await server.refresh()
    assert.equal(server.userId, realOwner.id)
    assert.isNotNull(server.ownerVerifiedAt)
    assert.equal(server.ownerVerifiedMethod, 'manual')

    await claim.refresh()
    assert.equal(claim.status, 'verified')
    assert.equal(claim.reviewedBy, admin.id)
  })

  test('un non-admin ne peut pas lister les demandes (403)', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .get('/api/v1/admin/ownership-claims')
      .bearerToken(await tokenFor(user))
    response.assertStatus(403)
  })

  test('un admin liste les demandes manuelles en attente', async ({ client, assert }) => {
    const requester = await createUser()
    const server = await createServer()
    await client
      .post(`/api/v1/servers/${server.id}/claim/manual`)
      .bearerToken(await tokenFor(requester))
      .json({ evidence: 'Demande de propriété à revoir.' })

    const admin = await createUser('admin')
    const response = await client
      .get('/api/v1/admin/ownership-claims')
      .bearerToken(await tokenFor(admin))

    response.assertStatus(200)
    const entry = response.body().find((c: { serverId: number }) => c.serverId === server.id)
    assert.exists(entry)
    assert.equal(entry.method, 'manual')
  })
})
