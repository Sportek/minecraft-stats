import Server from '#models/server'
import User from '#models/user'
import Webhook from '#models/webhook'
import ServerReport from '#models/server_report'
import { serverReportMessage } from '#services/webhook_messages'
import WebhookService from '#services/webhook_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import type { WebhookEvent } from '../../app/constants/webhook.js'

const DISCORD_URL = 'https://discord.com/api/webhooks/123456/secret-token-abcd'

interface SentRequest {
  url: string
  body: {
    allowed_mentions: { parse: string[] }
    embeds: { title: string; description?: string; fields?: { name: string; value: string }[] }[]
  }
}

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: User['role'] = 'user') {
  return User.create({
    username: `hook_${uid()}`,
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

async function createServer() {
  return Server.create({
    name: `Hook ${uid()}`,
    address: `hook-${uid()}.example.com`,
    port: 25565,
    type: 'java',
  })
}

function createWebhook(events: WebhookEvent[], fields: Partial<Webhook> = {}) {
  return Webhook.create({ name: 'Staff', url: DISCORD_URL, events, enabled: true, ...fields })
}

function stubFetch(respond: () => Promise<Response>) {
  const original = globalThis.fetch
  const sent: SentRequest[] = []
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body)) })
    return respond()
  }) as typeof fetch
  return { sent, restore: () => (globalThis.fetch = original) }
}

async function waitForDelivery(webhook: Webhook) {
  for (let attempt = 0; attempt < 50; attempt++) {
    await webhook.refresh()
    if (webhook.lastSentAt) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('webhook was never delivered')
}

test.group('Webhooks — administration', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('réservée aux admins : le support est refusé (403)', async ({ client }) => {
    const support = await createUser('support')
    const response = await client.get('/api/v1/admin/webhooks').bearerToken(await tokenFor(support))
    response.assertStatus(403)
  })

  test('un admin ajoute un webhook ; l’URL n’est renvoyée que masquée', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin')
    const response = await client
      .post('/api/v1/admin/webhooks')
      .bearerToken(await tokenFor(admin))
      .json({ name: 'Modération', url: DISCORD_URL, events: ['server.submitted'] })

    response.assertStatus(201)
    assert.notProperty(response.body(), 'url')
    assert.notInclude(response.body().maskedUrl, 'secret-token')
    assert.match(response.body().maskedUrl, /abcd$/)
    assert.deepEqual(response.body().events, ['server.submitted'])

    const stored = await Webhook.findOrFail(response.body().id)
    assert.equal(stored.url, DISCORD_URL)
    assert.equal(stored.createdBy, admin.id)
  })

  test('refuse une URL qui n’est pas un webhook Discord (422)', async ({ client }) => {
    const admin = await createUser('admin')
    const response = await client
      .post('/api/v1/admin/webhooks')
      .bearerToken(await tokenFor(admin))
      .json({
        name: 'Ailleurs',
        url: 'http://169.254.169.254/latest',
        events: ['server.submitted'],
      })
    response.assertStatus(422)
  })

  test('refuse un webhook sans événement (422)', async ({ client }) => {
    const admin = await createUser('admin')
    const response = await client
      .post('/api/v1/admin/webhooks')
      .bearerToken(await tokenFor(admin))
      .json({ name: 'Vide', url: DISCORD_URL, events: [] })
    response.assertStatus(422)
  })

  test('un admin met en pause, modifie puis supprime un webhook', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const token = await tokenFor(admin)
    const webhook = await createWebhook(['server.submitted'])

    const updated = await client
      .patch(`/api/v1/admin/webhooks/${webhook.id}`)
      .bearerToken(token)
      .json({ enabled: false, events: ['server_report.created'] })
    updated.assertStatus(200)
    await webhook.refresh()
    assert.isFalse(webhook.enabled)
    assert.deepEqual(webhook.events, ['server_report.created'])

    const deleted = await client.delete(`/api/v1/admin/webhooks/${webhook.id}`).bearerToken(token)
    deleted.assertStatus(204)
    assert.isNull(await Webhook.find(webhook.id))
  })

  test('le bouton de test envoie un message et enregistre le résultat', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin')
    const webhook = await createWebhook(['server.submitted'])
    const fetchStub = stubFetch(async () => new Response(null, { status: 204 }))

    try {
      const response = await client
        .post(`/api/v1/admin/webhooks/${webhook.id}/test`)
        .bearerToken(await tokenFor(admin))

      response.assertStatus(200)
      assert.deepEqual(response.body(), { ok: true, status: 204, error: null })
      assert.equal(fetchStub.sent[0].url, DISCORD_URL)
      await webhook.refresh()
      assert.equal(webhook.lastStatus, 204)
    } finally {
      fetchStub.restore()
    }
  })
})

test.group('Webhooks — mise en forme', () => {
  test('neutralise le Markdown du texte saisi et masque le port par défaut', async ({ assert }) => {
    const server = new Server().merge({
      id: 7,
      name: 'Srv',
      address: 'play.example.com',
      port: 25565,
    })
    const reporter = new User().merge({ username: 'a_b*c' })
    const report = new ServerReport().merge({
      reason: 'scam',
      details: '**gras** [lien](http://x)',
    })

    const embed = serverReportMessage(report, server, reporter)

    assert.include(embed.description, String.raw`a\_b\*c`)
    assert.include(embed.description, String.raw`> \*\*gras\*\* \[lien\]\(http://x\)`)
    assert.equal(embed.fields![0].value, '`play.example.com`')
  })
})

test.group('Webhooks — notifications', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un signalement notifie les webhooks abonnés, sans mentions', async ({ client, assert }) => {
    const subscribed = await createWebhook(['server_report.created'])
    await createWebhook(['server.submitted'], { name: 'Autre événement' })
    await createWebhook(['server_report.created'], { name: 'En pause', enabled: false })
    const fetchStub = stubFetch(async () => new Response(null, { status: 204 }))

    try {
      const reporter = await createUser()
      const server = await createServer()
      const response = await client
        .post(`/api/v1/servers/${server.id}/report`)
        .bearerToken(await tokenFor(reporter))
        .json({ reason: 'fake_playercount', details: '@everyone ce serveur gonfle ses joueurs' })

      response.assertStatus(200)
      await waitForDelivery(subscribed)

      assert.lengthOf(fetchStub.sent, 1)
      const { body } = fetchStub.sent[0]
      const embed = body.embeds[0]
      assert.equal(embed.title, `🚩 Signalement · ${server.name}`)
      assert.deepEqual(body.allowed_mentions, { parse: [] })
      assert.include(embed.description, 'Nombre de connectés truqué')
      assert.include(embed.description, '> @everyone ce serveur gonfle ses joueurs')
      assert.equal(subscribed.lastStatus, 204)
    } finally {
      fetchStub.restore()
    }
  })

  test('une demande de propriété manuelle notifie les webhooks abonnés', async ({
    client,
    assert,
  }) => {
    const webhook = await createWebhook(['ownership_claim.created'])
    const fetchStub = stubFetch(async () => new Response(null, { status: 204 }))

    try {
      const requester = await createUser()
      const server = await createServer()
      const response = await client
        .post(`/api/v1/servers/${server.id}/claim/manual`)
        .bearerToken(await tokenFor(requester))
        .json({ evidence: 'Je suis le propriétaire, voici ma preuve.' })

      response.assertStatus(200)
      await waitForDelivery(webhook)

      const embed = fetchStub.sent[0].body.embeds[0]
      assert.equal(embed.title, `🛡️ Demande de propriété · ${server.name}`)
      assert.include(embed.description, requester.username.replaceAll('_', String.raw`\_`))
    } finally {
      fetchStub.restore()
    }
  })

  test('un nouveau serveur soumis notifie les webhooks abonnés', async ({ assert }) => {
    const webhook = await createWebhook(['server.submitted'])
    const fetchStub = stubFetch(async () => new Response(null, { status: 204 }))

    try {
      await WebhookService.notifyServerSubmitted(await createServer(), await createUser())
      await waitForDelivery(webhook)

      assert.include(fetchStub.sent[0].body.embeds[0].title, '🆕 Serveur à modérer · ')
    } finally {
      fetchStub.restore()
    }
  })

  test('un échec Discord est enregistré sans faire échouer la requête', async ({
    client,
    assert,
  }) => {
    const webhook = await createWebhook(['server_report.created'])
    const fetchStub = stubFetch(async () => new Response('Unknown Webhook', { status: 404 }))

    try {
      const server = await createServer()
      const response = await client
        .post(`/api/v1/servers/${server.id}/report`)
        .bearerToken(await tokenFor(await createUser()))
        .json({ reason: 'other', details: 'Test' })

      response.assertStatus(200)
      await waitForDelivery(webhook)
      assert.equal(webhook.lastStatus, 404)
      assert.equal(webhook.lastError, 'Unknown Webhook')
    } finally {
      fetchStub.restore()
    }
  })

  test('une erreur réseau est enregistrée sans statut', async ({ assert }) => {
    const webhook = await createWebhook(['server.submitted'])
    const fetchStub = stubFetch(async () => {
      throw new Error('The operation was aborted due to timeout')
    })

    try {
      await WebhookService.notifyServerSubmitted(await createServer(), await createUser())
      await waitForDelivery(webhook)
      assert.isNull(webhook.lastStatus)
      assert.match(webhook.lastError!, /timeout/)
    } finally {
      fetchStub.restore()
    }
  })
})
