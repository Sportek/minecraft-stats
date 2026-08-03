import BlacklistedIdentifier from '#models/blacklisted_identifier'
import User from '#models/user'
import Visitor from '#models/visitor'
import VisitorAccount from '#models/visitor_account'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

async function createUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
  return User.create({
    email: `blacklist_${suffix}@example.com`,
    username: `blacklist_${suffix}`,
    password: 'password123',
    verified: true,
    ...overrides,
  })
}

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

/** Simule un utilisateur ayant consenti à l'analytics depuis une IP donnée. */
async function linkVisitor(user: User, ipHash: string) {
  const visitor = await Visitor.create({ uuid: randomUUID(), ipHash })
  await VisitorAccount.create({ visitorId: visitor.id, userId: user.id })
}

test.group('Blacklist', (group) => {
  // Chaque test tourne dans une transaction annulée à la fin : rien n'est persisté.
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un admin peut blacklister un autre utilisateur', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()

    const response = await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true, reason: 'spam' })

    response.assertStatus(200)
    await target.refresh()
    assert.isNotNull(target.blacklistedAt)
    assert.equal(target.blacklistedBy, admin.id)
    assert.equal(target.blacklistReason, 'spam')

    const emailEntry = await BlacklistedIdentifier.query()
      .where('type', 'email')
      .where('value', target.email.toLowerCase())
      .first()
    assert.isNotNull(emailEntry)
  })

  test('un admin ne peut pas se blacklister lui-même', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })

    const response = await client
      .patch(`/api/v1/admin/users/${admin.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    response.assertStatus(403)
  })

  test('un non-admin ne peut pas blacklister', async ({ client }) => {
    const requester = await createUser()
    const target = await createUser()

    const response = await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(requester))
      .json({ blacklisted: true })

    response.assertStatus(403)
  })

  test('un admin peut débannir un utilisateur et cela lève le blocage de son email', async ({
    client,
    assert,
  }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()
    await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    const response = await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: false })

    response.assertStatus(200)
    await target.refresh()
    assert.isNull(target.blacklistedAt)

    const emailEntry = await BlacklistedIdentifier.query()
      .where('type', 'email')
      .where('value', target.email.toLowerCase())
      .first()
    assert.isNull(emailEntry)
  })

  test('débannir un utilisateur ne lève pas le blocage d’une IP encore utilisée par un autre compte banni', async ({
    client,
    assert,
  }) => {
    const admin = await createUser({ role: 'admin' })
    const first = await createUser()
    const second = await createUser()
    const sharedIpHash = `shared_${randomUUID()}`
    await linkVisitor(first, sharedIpHash)
    await linkVisitor(second, sharedIpHash)

    await client
      .patch(`/api/v1/admin/users/${first.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })
    await client
      .patch(`/api/v1/admin/users/${second.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    // Débannir `first` seul ne doit pas déprotéger l'IP : `second` reste banni dessus.
    await client
      .patch(`/api/v1/admin/users/${first.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: false })

    const stillBlocked = await BlacklistedIdentifier.query()
      .where('type', 'ip')
      .where('value', sharedIpHash)
      .first()
    assert.isNotNull(stillBlocked)

    // Débannir `second` aussi lève enfin le blocage, plus personne n'en dépend.
    await client
      .patch(`/api/v1/admin/users/${second.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: false })

    const nowFree = await BlacklistedIdentifier.query()
      .where('type', 'ip')
      .where('value', sharedIpHash)
      .first()
    assert.isNull(nowFree)
  })

  test('le login est refusé pour un compte blacklisté', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()
    await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    const response = await client
      .post('/api/v1/login')
      .json({ email: target.email, password: 'password123' })

    response.assertStatus(403)
  })

  test("l'inscription avec un email blacklisté est refusée", async ({ client }) => {
    await BlacklistedIdentifier.create({ type: 'email', value: 'banned@example.com' })

    const response = await client.post('/api/v1/register').json({
      username: 'newcomer',
      email: 'banned@example.com',
      password: 'password123',
    })

    response.assertStatus(403)
  })

  test('/me refuse une requête authentifiée par un token nommé conservé après le ban', async ({
    client,
    assert,
  }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()
    // logoutAll/blacklistUser ne révoquent que les tokens de session (name === null) ;
    // un token nommé (API token) simule ici une requête qui échapperait à cette
    // révocation, pour vérifier que le middleware bloque bien via `blacklistedAt`.
    const namedToken = await User.accessTokens.create(target, ['*'], { name: 'ci-token' })

    await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    const response = await client.get('/api/v1/me').bearerToken(namedToken.value!.release())

    response.assertStatus(403)
    assert.notInclude([200], response.status())
  })

  test('bannir un utilisateur révoque ses sessions actives', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser()
    const sessionToken = await bearerFor(target)

    await client
      .patch(`/api/v1/admin/users/${target.id}/blacklist`)
      .bearerToken(await bearerFor(admin))
      .json({ blacklisted: true })

    const response = await client.get('/api/v1/me').bearerToken(sessionToken)

    response.assertStatus(401)
  })
})
