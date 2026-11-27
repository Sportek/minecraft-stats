import OwnershipClaimReviewedNotification from '#mails/ownership_claim_reviewed_notification'
import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import User from '#models/user'
import ServerOwnershipService, { verificationValue } from '#services/server_ownership_service'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

function uid() {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

async function createUser(role: User['role'] = 'user') {
  return User.create({
    username: `mail_${uid()}`,
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

async function createServer(port = 25565) {
  return Server.create({
    name: `Mail ${uid()}`,
    address: `mail-${uid()}.example.com`,
    port,
    type: 'java',
  })
}

function reviewMails(mails: ReturnType<typeof mail.fake>['mails']) {
  return mails.queued(
    (m) => m instanceof OwnershipClaimReviewedNotification
  ) as OwnershipClaimReviewedNotification[]
}

function viewData(notification: OwnershipClaimReviewedNotification) {
  return notification.message.toJSON().views.html!.data as Record<string, string | null>
}

test.group('Demandes de propriété — emails au demandeur', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => mail.restore())

  async function submitClaim(server: Server, requester: User, language: string) {
    await ServerOwnershipService.submitManualClaim(
      server,
      requester,
      { evidence: 'Je suis le propriétaire, voici ma preuve.' },
      language
    )
    return ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', requester.id)
      .firstOrFail()
  }

  test('la langue de la demande est enregistrée', async ({ client, assert }) => {
    const requester = await createUser()
    const server = await createServer()

    await client
      .post(`/api/v1/servers/${server.id}/claim/manual`)
      .bearerToken(await tokenFor(requester))
      .header('Accept-Language', 'fr-FR,fr;q=0.9')
      .json({ evidence: 'Je suis le propriétaire, voici ma preuve.' })

    const claim = await ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', requester.id)
      .firstOrFail()
    assert.equal(claim.locale, 'fr')
  })

  test('accepter une demande envoie un email avec le serveur et le lien de gestion', async ({
    client,
    assert,
  }) => {
    const { mails } = mail.fake()
    const requester = await createUser()
    const server = await createServer()
    const claim = await submitClaim(server, requester, 'fr')

    const response = await client
      .post(`/api/v1/admin/ownership-claims/${claim.id}/approve`)
      .bearerToken(await tokenFor(await createUser('support')))
      .json({})
    response.assertStatus(200)

    const [sent] = reviewMails(mails)
    assert.exists(sent)
    assert.equal(sent.decision, 'approved')
    sent.message.assertTo(requester.email)
    sent.message.assertSubject(`Vous êtes propriétaire de ${server.name}`)

    const data = viewData(sent)
    assert.equal(data.serverName, server.name)
    assert.equal(data.serverAddress, server.address)
    assert.equal(data.cta_url, `${process.env.WEBSITE_URL}/fr/servers/${server.id}/edit`)
    assert.isNull(data.note)
  })

  test('refuser une demande envoie un email avec le motif, dans la langue de la demande', async ({
    client,
    assert,
  }) => {
    const { mails } = mail.fake()
    const requester = await createUser()
    const server = await createServer(25577)
    const claim = await submitClaim(server, requester, 'en')

    const response = await client
      .post(`/api/v1/admin/ownership-claims/${claim.id}/reject`)
      .bearerToken(await tokenFor(await createUser('admin')))
      .json({ note: 'Preuve insuffisante' })
    response.assertStatus(200)

    const [sent] = reviewMails(mails)
    assert.equal(sent.decision, 'rejected')
    sent.message.assertTo(requester.email)
    sent.message.assertSubject(`Your ownership request for ${server.name}`)

    const data = viewData(sent)
    assert.equal(data.note, 'Preuve insuffisante')
    assert.equal(data.serverAddress, `${server.address}:25577`)
    assert.equal(data.cta_url, `${process.env.WEBSITE_URL}/en/servers/${server.id}`)
  })

  test('une vérification automatique par DNS n’envoie pas d’email', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const requester = await createUser()
    const server = await createServer()
    const token = await tokenFor(requester)

    await client.post(`/api/v1/servers/${server.id}/claim/dns`).bearerToken(token)
    const claim = await ServerOwnershipClaim.query()
      .where('server_id', server.id)
      .where('user_id', requester.id)
      .firstOrFail()
    const realResolveTxt = ServerOwnershipService.resolveTxt
    ServerOwnershipService.resolveTxt = async () => [[verificationValue(claim.token!)]]

    try {
      const response = await client
        .post(`/api/v1/servers/${server.id}/claim/dns/verify`)
        .bearerToken(token)
      response.assertStatus(200)
      assert.lengthOf(reviewMails(mails), 0)
    } finally {
      ServerOwnershipService.resolveTxt = realResolveTxt
    }
  })
})
