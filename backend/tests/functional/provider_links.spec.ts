import User from '#models/user'
import UserProvider from '#models/user_provider'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

async function createUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
  return User.create({
    email: `link_${suffix}@example.com`,
    username: `link_${suffix}`,
    password: 'password123',
    verified: true,
    ...overrides,
  })
}

/** Crée un lien en attente et renvoie le token brut (celui qui partirait par email). */
async function createPendingLink(user: User, provider: 'google' | 'discord' = 'google') {
  const rawToken = randomBytes(32).toString('base64url')
  await UserProvider.create({
    userId: user.id,
    provider,
    linkTokenHash: createHash('sha256').update(rawToken).digest('hex'),
    linkTokenExpiresAt: DateTime.now().plus({ hours: 1 }),
  })
  return rawToken
}

async function createConfirmedLink(user: User, provider: 'google' | 'discord') {
  return UserProvider.create({ userId: user.id, provider, confirmedAt: DateTime.now() })
}

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

test.group('Provider links', (group) => {
  // Chaque test tourne dans une transaction annulée à la fin : rien n'est persisté.
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('confirme un lien en attente et connecte directement', async ({ client, assert }) => {
    const user = await createUser()
    const rawToken = await createPendingLink(user)

    const response = await client.post('/api/v1/link-provider').json({ token: rawToken })

    response.assertStatus(200)
    assert.equal(response.body().user.id, user.id)
    assert.isString(response.body().accessToken.token)

    const link = await UserProvider.findByOrFail('user_id', user.id)
    assert.isNotNull(link.confirmedAt)
    assert.isNull(link.linkTokenHash)
  })

  test('marque le compte vérifié à la confirmation (preuve de possession de l’email)', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ verified: false })
    const rawToken = await createPendingLink(user)

    const response = await client.post('/api/v1/link-provider').json({ token: rawToken })

    response.assertStatus(200)
    await user.refresh()
    assert.isTrue(user.verified)
  })

  test('refuse un token expiré', async ({ client }) => {
    const user = await createUser()
    const rawToken = randomBytes(32).toString('base64url')
    await UserProvider.create({
      userId: user.id,
      provider: 'google',
      linkTokenHash: createHash('sha256').update(rawToken).digest('hex'),
      linkTokenExpiresAt: DateTime.now().minus({ minutes: 1 }),
    })

    const response = await client.post('/api/v1/link-provider').json({ token: rawToken })

    response.assertStatus(400)
  })

  test('refuse un token inconnu', async ({ client }) => {
    const response = await client
      .post('/api/v1/link-provider')
      .json({ token: randomBytes(32).toString('base64url') })

    response.assertStatus(400)
  })

  test('un token confirmé ne peut pas être rejoué', async ({ client }) => {
    const user = await createUser()
    const rawToken = await createPendingLink(user)

    const first = await client.post('/api/v1/link-provider').json({ token: rawToken })
    first.assertStatus(200)

    const replay = await client.post('/api/v1/link-provider').json({ token: rawToken })
    replay.assertStatus(400)
  })

  test('liste uniquement les providers confirmés', async ({ client, assert }) => {
    const user = await createUser()
    await createConfirmedLink(user, 'google')
    await createPendingLink(user, 'discord')

    const response = await client
      .get('/api/v1/account/providers')
      .bearerToken(await bearerFor(user))

    response.assertStatus(200)
    const providers = response.body().providers
    assert.lengthOf(providers, 1)
    assert.equal(providers[0].provider, 'google')
  })

  test('refuse de délier la seule méthode de connexion d’un compte OAuth', async ({ client }) => {
    // Compte créé via OAuth : mot de passe aléatoire inutilisable, google est sa
    // seule méthode de connexion.
    const user = await createUser({ provider: 'google' })
    await createConfirmedLink(user, 'google')

    const response = await client
      .delete('/api/v1/account/providers/google')
      .bearerToken(await bearerFor(user))

    response.assertStatus(400)
  })

  test('délie un provider quand une autre méthode reste', async ({ client, assert }) => {
    const user = await createUser({ provider: 'google' })
    await createConfirmedLink(user, 'google')
    await createConfirmedLink(user, 'discord')

    const response = await client
      .delete('/api/v1/account/providers/discord')
      .bearerToken(await bearerFor(user))

    response.assertStatus(200)
    const remaining = await UserProvider.query().where('user_id', user.id)
    assert.lengthOf(remaining, 1)
    assert.equal(remaining[0].provider, 'google')
  })

  test('un compte local peut délier son unique provider (le mot de passe reste)', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await createConfirmedLink(user, 'google')

    const response = await client
      .delete('/api/v1/account/providers/google')
      .bearerToken(await bearerFor(user))

    response.assertStatus(200)
    assert.lengthOf(await UserProvider.query().where('user_id', user.id), 0)
  })

  test('délier un provider non lié renvoie 404', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .delete('/api/v1/account/providers/google')
      .bearerToken(await bearerFor(user))

    response.assertStatus(404)
  })
})
