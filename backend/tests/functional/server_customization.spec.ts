import Server from '#models/server'
import User from '#models/user'
import type { ApiClient } from '@japa/api-client'
import drive from '@adonisjs/drive/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import { CARD_EFFECTS, TITLE_FONTS } from '../../app/constants/server_customization.js'

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

async function createServer(owner: User, { verified }: { verified: boolean }) {
  return Server.create({
    name: 'Custom Test',
    address: `custom-${uid()}.example.com`,
    port: 25565,
    type: 'java',
    userId: owner.id,
    ownerVerifiedAt: verified ? DateTime.now() : null,
    ownerVerifiedMethod: verified ? 'motd' : null,
  })
}

const STYLE = {
  titleFont: 'pixel',
  titleColor: '#ff8800',
  titleColorEnd: '#ffcc00',
  cardEffect: 'frost',
}

const RESET = { titleFont: null, titleColor: null, titleColorEnd: null, cardEffect: null }

const solid = (width: number, height: number, background: string) =>
  sharp({ create: { width, height, channels: 3, background } })

const bannerPng = (width = 468, height = 60) => solid(width, height, '#0099ff').png().toBuffer()

/** GIF animé de `count` frames 468x60. */
async function animatedBanner(count = 3) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
  const frames = await Promise.all(
    Array.from({ length: count }, (_, i) => solid(468, 60, colors[i % colors.length]).png().toBuffer())
  )
  return sharp(frames, { join: { animated: true } })
    .gif()
    .toBuffer()
}

test.group('Server customization — style', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('exige une authentification (401)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client.put(`/api/v1/servers/${server.id}/customization`).json(STYLE)

    response.assertStatus(401)
  })

  test('refuse un utilisateur qui ne possède pas le serveur (403)', async ({ client }) => {
    const owner = await createUser()
    const stranger = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(stranger))
      .json(STYLE)

    response.assertStatus(403)
  })

  test('refuse un propriétaire non vérifié (403)', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: false })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(owner))
      .json(STYLE)

    response.assertStatus(403)
    await server.refresh()
    assert.isNull(server.titleFont)
  })

  test('un propriétaire vérifié enregistre son style', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(owner))
      .json(STYLE)

    response.assertStatus(200)
    assert.containSubset(response.body(), STYLE)
    await server.refresh()
    assert.equal(server.titleFont, 'pixel')
    assert.equal(server.cardEffect, 'frost')
  })

  test('normalise la couleur en minuscules', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(owner))
      .json({ ...STYLE, titleColor: '#FF8800', titleColorEnd: '#FFCC00' })

    response.assertStatus(200)
    assert.equal(response.body().titleColor, '#ff8800')
    assert.equal(response.body().titleColorEnd, '#ffcc00')
  })

  test('écarte la couleur de fin de dégradé quand il n’y a pas de couleur de titre', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(owner))
      .json({ ...STYLE, titleColor: null })

    response.assertStatus(200)
    assert.isNull(response.body().titleColorEnd)
  })

  test('null remet les valeurs par défaut', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)
    await client.put(`/api/v1/servers/${server.id}/customization`).bearerToken(token).json(STYLE)

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(token)
      .json(RESET)

    response.assertStatus(200)
    assert.containSubset(response.body(), RESET)
  })

  test('accepte chaque police et chaque effet de la liste blanche', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)

    for (const titleFont of TITLE_FONTS) {
      const response = await client
        .put(`/api/v1/servers/${server.id}/customization`)
        .bearerToken(token)
        .json({ ...STYLE, titleFont })
      response.assertStatus(200)
    }
    for (const cardEffect of CARD_EFFECTS) {
      const response = await client
        .put(`/api/v1/servers/${server.id}/customization`)
        .bearerToken(token)
        .json({ ...STYLE, cardEffect })
      response.assertStatus(200)
    }
  })

  test('rejette une police, un effet ou une couleur hors liste (422)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)
    const put = (body: object) =>
      client.put(`/api/v1/servers/${server.id}/customization`).bearerToken(token).json(body)

    ;(await put({ ...STYLE, titleFont: 'comic-sans' })).assertStatus(422)
    ;(await put({ ...STYLE, cardEffect: 'confetti' })).assertStatus(422)
    ;(await put({ ...STYLE, titleColor: 'red' })).assertStatus(422)
    // Injection CSS : la couleur finit dans un attribut style côté client.
    ;(await put({ ...STYLE, titleColor: '#fff; background: url(//evil)' })).assertStatus(422)
  })

  test('un admin peut personnaliser un serveur non vérifié', async ({ client, assert }) => {
    const owner = await createUser()
    const admin = await createUser('admin')
    const server = await createServer(owner, { verified: false })

    const response = await client
      .put(`/api/v1/servers/${server.id}/customization`)
      .bearerToken(await tokenFor(admin))
      .json(STYLE)

    response.assertStatus(200)
    assert.equal(response.body().titleFont, 'pixel')
  })
})

test.group('Server customization — banner', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Disque factice : les tests n'écrivent rien dans `public/`.
  let disk: ReturnType<typeof drive.fake>
  group.each.setup(() => {
    disk = drive.fake()
  })
  group.each.teardown(() => drive.restore())

  const upload = (
    client: ApiClient,
    serverId: number,
    token: string,
    file: Buffer,
    filename = 'banner.png'
  ) =>
    client
      .post(`/api/v1/servers/${serverId}/banner`)
      .bearerToken(token)
      .file('banner', file, { filename })

  test('enregistre une bannière 468x60', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await upload(client, server.id, await tokenFor(owner), await bannerPng())

    response.assertStatus(200)
    const { bannerUrl } = response.body()
    assert.match(bannerUrl, new RegExp(`^/images/servers/banners/${server.id}-[0-9a-f-]{36}\\.webp$`))
    disk.assertExists(bannerUrl.slice(1))
  })

  test('conserve l’animation d’un GIF', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await upload(
      client,
      server.id,
      await tokenFor(owner),
      await animatedBanner(3),
      'banner.gif'
    )

    response.assertStatus(200)
    const stored = await disk.getBytes(response.body().bannerUrl.slice(1))
    const metadata = await sharp(stored, { animated: true }).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.pages, 3)
    assert.equal(metadata.pageHeight, 60)
  })

  test('rejette des dimensions différentes de 468x60 (422)', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)

    for (const [width, height] of [
      [728, 90],
      [468, 90],
      [936, 120],
    ]) {
      const response = await upload(client, server.id, token, await bannerPng(width, height))
      response.assertStatus(422)
      assert.match(response.body().message, /468/)
    }
    await server.refresh()
    assert.isNull(server.bannerUrl)
  })

  test('rejette un GIF animé dont les frames ne font pas 468x60 (422)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const frames = await Promise.all(
      [0, 1].map(() => solid(468, 90, '#ff0000').png().toBuffer())
    )
    const gif = await sharp(frames, { join: { animated: true } }).gif().toBuffer()

    const response = await upload(client, server.id, await tokenFor(owner), gif, 'banner.gif')

    response.assertStatus(422)
  })

  test('rejette un fichier dont le contenu n’est pas une image (400)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await upload(
      client,
      server.id,
      await tokenFor(owner),
      Buffer.from('ceci n’est pas une image'),
      'banner.png'
    )

    // Le bodyparser sniffe le contenu réel et écarte le fichier avant Sharp.
    response.assertStatus(400)
  })

  test('rejette une image tronquée mais à l’en-tête valide (422, pas 500)', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const truncated = (await bannerPng()).subarray(0, 120)

    const response = await upload(client, server.id, await tokenFor(owner), truncated)

    response.assertStatus(422)
    await server.refresh()
    assert.isNull(server.bannerUrl)
  })

  test('rejette une extension non image (400)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await upload(
      client,
      server.id,
      await tokenFor(owner),
      await bannerPng(),
      'banner.svg'
    )

    response.assertStatus(400)
  })

  test('rejette un fichier de plus de 1 Mo (400)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const oversized = Buffer.alloc(1024 * 1024 + 1)

    const response = await upload(client, server.id, await tokenFor(owner), oversized)

    response.assertStatus(400)
  })

  test('sans fichier (400)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .post(`/api/v1/servers/${server.id}/banner`)
      .bearerToken(await tokenFor(owner))

    response.assertStatus(400)
  })

  test('refuse un propriétaire non vérifié (403)', async ({ client }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: false })

    const response = await upload(client, server.id, await tokenFor(owner), await bannerPng())

    response.assertStatus(403)
  })

  test('refuse un utilisateur qui ne possède pas le serveur (403)', async ({ client }) => {
    const owner = await createUser()
    const stranger = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await upload(client, server.id, await tokenFor(stranger), await bannerPng())

    response.assertStatus(403)
  })

  test('remplacer la bannière supprime l’ancienne', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)

    const first = await upload(client, server.id, token, await bannerPng())
    const second = await upload(client, server.id, token, await animatedBanner(2), 'banner.gif')

    const firstUrl = first.body().bannerUrl
    const secondUrl = second.body().bannerUrl
    assert.notEqual(firstUrl, secondUrl)
    disk.assertMissing(firstUrl.slice(1))
    disk.assertExists(secondUrl.slice(1))
  })

  test('supprime la bannière et son fichier', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })
    const token = await tokenFor(owner)
    const { bannerUrl } = (await upload(client, server.id, token, await bannerPng())).body()

    const response = await client.delete(`/api/v1/servers/${server.id}/banner`).bearerToken(token)

    response.assertStatus(200)
    assert.isNull(response.body().bannerUrl)
    disk.assertMissing(bannerUrl.slice(1))
  })

  test('la suppression est idempotente', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .delete(`/api/v1/servers/${server.id}/banner`)
      .bearerToken(await tokenFor(owner))

    response.assertStatus(200)
    assert.isNull(response.body().bannerUrl)
  })

  test('un propriétaire non vérifié peut retirer une bannière existante', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer(owner, { verified: false })
    server.bannerUrl = '/images/servers/banners/legacy.webp'
    await server.save()

    const response = await client
      .delete(`/api/v1/servers/${server.id}/banner`)
      .bearerToken(await tokenFor(owner))

    response.assertStatus(200)
    assert.isNull(response.body().bannerUrl)
  })

  test('un admin peut retirer la bannière d’un serveur', async ({ client, assert }) => {
    const owner = await createUser()
    const admin = await createUser('admin')
    const server = await createServer(owner, { verified: true })
    server.bannerUrl = '/images/servers/banners/abusive.webp'
    await server.save()

    const response = await client
      .delete(`/api/v1/servers/${server.id}/banner`)
      .bearerToken(await tokenFor(admin))

    response.assertStatus(200)
    assert.isNull(response.body().bannerUrl)
  })

  test('un tiers ne peut pas retirer la bannière (403)', async ({ client }) => {
    const owner = await createUser()
    const stranger = await createUser()
    const server = await createServer(owner, { verified: true })

    const response = await client
      .delete(`/api/v1/servers/${server.id}/banner`)
      .bearerToken(await tokenFor(stranger))

    response.assertStatus(403)
  })
})
