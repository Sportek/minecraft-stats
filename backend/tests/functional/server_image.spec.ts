import Server from '#models/server'
import User from '#models/user'
import { storeFaviconIfChanged } from '#services/server_favicon'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: 'user' | 'admin' = 'user') {
  return User.create({
    username: `img_${uid()}`,
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
    name: `Image ${uid()}`,
    address: `img-${uid()}.example.com`,
    port: 25565,
    type: 'java',
    ...fields,
  })
}

async function createVerifiedServer(owner: User, fields: Partial<Server> = {}) {
  return createServer({
    userId: owner.id,
    ownerVerifiedAt: DateTime.now(),
    ownerVerifiedMethod: 'motd',
    ...fields,
  })
}

function samplePng() {
  return sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 30, g: 140, b: 80 } },
  })
    .png()
    .toBuffer()
}

async function sampleFavicon(color: { r: number; g: number; b: number }) {
  const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: color } })
    .png()
    .toBuffer()
  return `data:image/png;base64,${png.toString('base64')}`
}

test.group('Server image — permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fs')
    return () => drive.restore('fs')
  })

  test('exige une authentification (401)', async ({ client }) => {
    const server = await createServer()
    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .file('image', await samplePng(), { filename: 'logo.png' })
    response.assertStatus(401)
  })

  test('refuse un propriétaire non vérifié et lui indique la marche à suivre (403)', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createServer({ userId: owner.id })

    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(await tokenFor(owner))
      .file('image', await samplePng(), { filename: 'logo.png' })

    response.assertStatus(403)
    assert.match(response.body().message, /verif/i)
    await server.refresh()
    assert.isFalse(server.hasCustomImage)
  })

  test('refuse un tiers sur un serveur vérifié (403)', async ({ client }) => {
    const owner = await createUser()
    const other = await createUser()
    const server = await createVerifiedServer(owner)

    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(await tokenFor(other))
      .file('image', await samplePng(), { filename: 'logo.png' })

    response.assertStatus(403)
  })

  test('refuse une requête sans fichier (400)', async ({ client }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)

    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(await tokenFor(owner))

    response.assertStatus(400)
  })
})

test.group('Server image — upload et retour au favicon', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fs')
    return () => drive.restore('fs')
  })

  test('le propriétaire vérifié remplace l’image : WebP + PNG carrés 256x256', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner, { imageUrl: `/images/servers/123` })

    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(await tokenFor(owner))
      .file('image', await samplePng(), { filename: 'logo.png' })

    response.assertStatus(200)
    await server.refresh()
    assert.isTrue(server.hasCustomImage)
    assert.match(server.imageUrl!, new RegExp(`^/images/servers/custom/${server.id}-`))
    assert.equal(response.body().server.imageUrl, server.imageUrl)

    const key = server.imageUrl!.slice(1)
    const webp = await sharp(Buffer.from(await drive.use().getBytes(`${key}.webp`))).metadata()
    assert.deepInclude(webp, { format: 'webp', width: 256, height: 256 })
    assert.isTrue(await drive.use().exists(`${key}.png`))
  })

  test('un admin peut changer l’image d’un serveur qui n’est pas le sien', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin')
    const owner = await createUser()
    const server = await createServer({ userId: owner.id })

    const response = await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(await tokenFor(admin))
      .file('image', await samplePng(), { filename: 'logo.png' })

    response.assertStatus(200)
    await server.refresh()
    assert.isTrue(server.hasCustomImage)
  })

  test('un nouvel upload supprime l’image personnalisée précédente', async ({ client, assert }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)
    const token = await tokenFor(owner)

    await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(token)
      .file('image', await samplePng(), { filename: 'first.png' })
    await server.refresh()
    const firstKey = server.imageUrl!.slice(1)

    await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(token)
      .file('image', await samplePng(), { filename: 'second.png' })
    await server.refresh()

    assert.notEqual(server.imageUrl!.slice(1), firstKey)
    assert.isFalse(await drive.use().exists(`${firstKey}.webp`))
    assert.isFalse(await drive.use().exists(`${firstKey}.png`))
  })

  test('supprimer l’image revient au favicon stocké et force son rafraîchissement', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner, { faviconHash: 'old-hash' })
    await drive.use().put(`images/servers/${server.id}.webp`, Buffer.from('favicon'))
    const token = await tokenFor(owner)

    await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(token)
      .file('image', await samplePng(), { filename: 'logo.png' })
    await server.refresh()
    const customKey = server.imageUrl!.slice(1)

    const response = await client.delete(`/api/v1/servers/${server.id}/image`).bearerToken(token)

    response.assertStatus(200)
    await server.refresh()
    assert.isFalse(server.hasCustomImage)
    assert.equal(server.imageUrl, `/images/servers/${server.id}`)
    assert.isNull(server.faviconHash)
    assert.isFalse(await drive.use().exists(`${customKey}.webp`))
  })

  test('sans favicon stocké, supprimer l’image laisse le serveur sans image', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const server = await createVerifiedServer(owner)
    const token = await tokenFor(owner)

    await client
      .post(`/api/v1/servers/${server.id}/image`)
      .bearerToken(token)
      .file('image', await samplePng(), { filename: 'logo.png' })
    await client.delete(`/api/v1/servers/${server.id}/image`).bearerToken(token)

    await server.refresh()
    assert.isFalse(server.hasCustomImage)
    assert.isNull(server.imageUrl)
  })
})

test.group('Server image — le ping ne l’écrase pas', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake('fs')
    return () => drive.restore('fs')
  })

  test('image personnalisée : le favicon met à jour l’empreinte, pas l’image', async ({
    assert,
  }) => {
    const customImage = '/images/servers/custom/1-abc'
    const server = await createServer({ imageUrl: customImage, hasCustomImage: true })

    await storeFaviconIfChanged(server, await sampleFavicon({ r: 200, g: 20, b: 20 }))

    assert.equal(server.imageUrl, customImage)
    assert.isNotNull(server.faviconHash)
    assert.isFalse(await drive.use().exists(`images/servers/${server.id}.webp`))
  })

  test('sans image personnalisée, le favicon est toujours stocké', async ({ assert }) => {
    const server = await createServer()

    await storeFaviconIfChanged(server, await sampleFavicon({ r: 20, g: 20, b: 200 }))

    assert.equal(server.imageUrl, `/images/servers/${server.id}`)
    assert.isTrue(await drive.use().exists(`images/servers/${server.id}.webp`))
  })
})
