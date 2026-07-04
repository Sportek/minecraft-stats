import Server from '#models/server'
import ServerVote from '#models/server_vote'
import VoteService from '#services/vote_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

// Pseudo au format valide mais très improbablement un vrai compte Mojang :
// `resolveProfile` renvoie alors `null` (aucun appel réseau de rendu de tête).
function fakeUsername() {
  return `test_${randomUUID().replace(/-/g, '').slice(0, 8)}`
}

async function createServer() {
  return Server.create({
    name: 'Test Vote Server',
    address: 'vote.test.example.com',
    port: 25565,
    type: 'java',
  })
}

test.group('Server votes', (group) => {
  // Chaque test tourne dans une transaction annulée à la fin : rien n'est persisté.
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renvoie 404 pour un serveur inexistant', async ({ client }) => {
    const response = await client.post('/api/v1/servers/999999999/vote').json({
      username: fakeUsername(),
      visitorId: randomUUID(),
      acceptedTerms: true,
    })

    response.assertStatus(404)
  })

  test('refuse un pseudo invalide (422)', async ({ client }) => {
    const server = await createServer()

    const response = await client.post(`/api/v1/servers/${server.id}/vote`).json({
      username: 'no',
      visitorId: randomUUID(),
      acceptedTerms: true,
    })

    response.assertStatus(422)
  })

  test('exige l’acceptation des conditions (400)', async ({ client }) => {
    const server = await createServer()

    const response = await client.post(`/api/v1/servers/${server.id}/vote`).json({
      username: fakeUsername(),
      visitorId: randomUUID(),
      acceptedTerms: false,
    })

    response.assertStatus(400)
  })

  test('enregistre un vote lié au visiteur puis bloque le second (429)', async ({
    client,
    assert,
  }) => {
    const server = await createServer()
    const visitorId = randomUUID()
    const payload = { username: fakeUsername(), visitorId, acceptedTerms: true }

    const first = await client.post(`/api/v1/servers/${server.id}/vote`).json(payload)
    first.assertStatus(200)
    first.assertBodyContains({ voteCount: 1 })

    await server.refresh()
    assert.equal(server.voteCount, 1)

    // Le vote est bien lié au visiteur tracké (FK non nulle vers `visitors`).
    const vote = await ServerVote.query().where('server_id', server.id).firstOrFail()
    assert.isNotNull(vote.visitorId)

    const second = await client.post(`/api/v1/servers/${server.id}/vote`).json(payload)
    second.assertStatus(429)
  })

  test('le cooldown sur pseudo ignore la casse', async ({ client, assert }) => {
    const server = await createServer()
    const username = fakeUsername()

    const vote = await client.post(`/api/v1/servers/${server.id}/vote`).json({
      username,
      visitorId: randomUUID(),
      acceptedTerms: true,
    })
    vote.assertStatus(200)

    // Même pseudo en MAJUSCULES, identité visiteur/IP différente : seul le volet
    // pseudo peut bloquer, il doit matcher malgré la casse.
    const cooldown = await VoteService.checkCooldown(server.id, {
      visitorPk: null,
      ipHash: 'empreinte-differente',
      username: username.toUpperCase(),
    })
    assert.isFalse(cooldown.allowed)
  })

  test('vote-status renvoie l’état du visiteur', async ({ client }) => {
    const server = await createServer()
    const visitorId = randomUUID()

    const before = await client.get(`/api/v1/servers/${server.id}/vote-status`).qs({ visitorId })
    before.assertStatus(200)
    before.assertBodyContains({ canVote: true, voteCount: 0, monthlyVoteCount: 0 })

    const vote = await client.post(`/api/v1/servers/${server.id}/vote`).json({
      username: fakeUsername(),
      visitorId,
      acceptedTerms: true,
    })
    vote.assertStatus(200)

    const after = await client.get(`/api/v1/servers/${server.id}/vote-status`).qs({ visitorId })
    after.assertStatus(200)
    after.assertBodyContains({ canVote: false, voteCount: 1, monthlyVoteCount: 1 })
  })

  test('le classement par votes expose le compteur mensuel', async ({ client, assert }) => {
    const server = await createServer()

    const vote = await client.post(`/api/v1/servers/${server.id}/vote`).json({
      username: fakeUsername(),
      visitorId: randomUUID(),
      acceptedTerms: true,
    })
    vote.assertStatus(200)

    const response = await client
      .get('/api/v1/servers/paginate')
      .qs({ page: 1, limit: 10, sort: 'votes' })
    response.assertStatus(200)

    const entry = response
      .body()
      .data.find((row: { server: { id: number } }) => row.server.id === server.id)
    assert.equal(entry.monthlyVoteCount, 1)
  })

  test('vote-status refuse un visitorId mal formé (422)', async ({ client }) => {
    const server = await createServer()

    // La colonne `visitors.uuid` est de type PG uuid : sans validation, une valeur
    // arbitraire ferait échouer la requête en 500.
    const response = await client
      .get(`/api/v1/servers/${server.id}/vote-status`)
      .qs({ visitorId: 'pas-un-uuid' })
    response.assertStatus(422)
  })
})
