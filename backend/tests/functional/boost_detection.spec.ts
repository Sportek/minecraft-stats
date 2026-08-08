import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import BoostDetectionService from '#services/boost_detection_service'
import ServerListingService from '#services/server_listing_service'
import Server from '#models/server'
import ServerBoostReview from '#models/server_boost_review'
import ServerBoostScore from '#models/server_boost_score'
import User from '#models/user'

/**
 * Le calcul lui-même est couvert sur séries réelles côté unitaire
 * (`tests/unit/boost_detection_service.spec.ts`). Ce qui se joue ici, c'est
 * l'aller-retour base : colonnes `jsonb` et `decimal` traversées dans les deux sens,
 * et l'effet du verdict admin sur le serveur.
 */

/** Série multipliée par `factor`, avec un cycle jour/nuit franc. */
const inflatedSeries = (serverId: number, factor: number, count = 620) => {
  const now = Date.now()
  return Array.from({ length: count }, (_, index) => {
    const at = now - (count - index) * 10 * 60_000
    const hour = new Date(at).getUTCHours()
    const real = 40 + Math.round(30 * Math.sin(((hour - 4) / 24) * 2 * Math.PI) + (index % 7))
    return {
      server_id: serverId,
      player_count: real * factor,
      max_count: 5000,
      created_at: new Date(at),
    }
  })
}

const makeServer = (address: string) =>
  Server.create({ name: 'Boost fixture', address, port: 25565, type: 'java', voteCount: 0 })

test.group('BoostDetectionService — persistance', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('écrit un score relisable, signaux et facteur compris', async ({ assert }) => {
    const server = await makeServer('boost-roundtrip.test')
    await Database.table('server_stats').multiInsert(inflatedSeries(server.id, 6))

    assert.isNotNull(await BoostDetectionService.scoreServer(server.id))

    const stored = await ServerBoostScore.findOrFail(server.id)
    assert.equal(stored.level, 'likely')
    // `decimal` revient en chaîne depuis pg si le modèle ne le reconvertit pas.
    assert.strictEqual(stored.detectedFactor, 6)
    assert.isTrue(Array.isArray(stored.signals))
    assert.equal(stored.signals[0].key, 'valueLattice')
    assert.isString(stored.signals[0].detail)
    assert.closeTo(stored.estimatedRealPlayers!, 42, 8)
  })

  test('efface le score quand la fenêtre devient trop pauvre', async ({ assert }) => {
    const server = await makeServer('boost-thin.test')
    await Database.table('server_stats').multiInsert(inflatedSeries(server.id, 6))
    await BoostDetectionService.scoreServer(server.id)

    await Database.from('server_stats').where('server_id', server.id).delete()
    assert.isNull(await BoostDetectionService.scoreServer(server.id))
    assert.isNull(await ServerBoostScore.find(server.id))
  })
})

test.group('BoostDetectionService — verdict admin', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('fige les signaux dans la revue et marque le serveur', async ({ assert }) => {
    const server = await makeServer('boost-verdict.test')
    await Database.table('server_stats').multiInsert(inflatedSeries(server.id, 6))
    await BoostDetectionService.scoreServer(server.id)

    const admin = await User.create({
      username: `boost-admin-${server.id}`,
      email: `boost-admin-${server.id}@example.test`,
      password: 'secret-password',
      role: 'admin',
    })

    const review = await BoostDetectionService.review(
      server,
      admin,
      'boosting',
      'multiplicateur ×6'
    )

    // Le score est recalculé chaque nuit : la revue doit porter sa propre copie des
    // signaux, sinon l'étiquette ne vaut rien pour recalibrer plus tard.
    const stored = await ServerBoostReview.findOrFail(review.id)
    assert.equal(stored.verdict, 'boosting')
    assert.isAbove(stored.scoreAtReview, 0)
    assert.equal(stored.signalsAtReview[0].key, 'valueLattice')
    assert.equal(stored.reviewedBy, admin.id)

    await server.refresh()
    assert.equal(server.boostStatus, 'boosting')
    assert.isNotNull(server.boostReviewedAt)
  })

  test('la file de revue remonte les serveurs les plus suspects', async ({ assert }) => {
    const server = await makeServer('boost-queue.test')
    await Database.table('server_stats').multiInsert(inflatedSeries(server.id, 6))
    await BoostDetectionService.scoreServer(server.id)

    const queue = await BoostDetectionService.listQueue()
    const entry = queue.find((row) => row.serverId === server.id)

    assert.isDefined(entry)
    assert.equal(entry!.server.address, 'boost-queue.test')
  })
})

test.group('Classement — rétrogradation des serveurs confirmés', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /** Un serveur pingué à l'instant, donc éligible au tri « joueurs ». */
  const liveServer = async (address: string, players: number, boosting: boolean) => {
    const server = await makeServer(address)
    server.lastPlayerCount = players
    server.lastStatsAt = DateTime.now()
    server.lastOnlineAt = DateTime.now()
    if (boosting) server.boostStatus = 'boosting'
    await server.save()
    return server
  }

  test('un serveur confirmé passe derrière un serveur sain plus petit', async ({ assert }) => {
    const cheater = await liveServer('boost-rank-cheater.test', 9000, true)
    const honest = await liveServer('boost-rank-honest.test', 100, false)

    const listing = await ServerListingService.paginate({
      page: 1,
      limit: 10,
      search: '',
      sort: 'players',
      ids: [cheater.id, honest.id],
    })

    const order = listing.data.map((row) => row.server.id)
    assert.deepEqual(order, [honest.id, cheater.id])
  })

  test('le tri « nouveautés » n’est pas affecté', async ({ assert }) => {
    // Un compteur gonflé ne fausse pas la date de création : rétrograder là serait
    // une double peine sans rapport avec la triche constatée.
    const cheater = await liveServer('boost-rank-recent.test', 9000, true)
    const honest = await liveServer('boost-rank-older.test', 100, false)
    await Database.from('servers')
      .where('id', honest.id)
      .update({ created_at: DateTime.now().minus({ years: 1 }).toSQL() })

    const listing = await ServerListingService.paginate({
      page: 1,
      limit: 10,
      search: '',
      sort: 'newest',
      ids: [cheater.id, honest.id],
    })

    assert.equal(listing.data[0].server.id, cheater.id)
  })
})
