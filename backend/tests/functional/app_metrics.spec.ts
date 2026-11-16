import env from '#start/env'
import redis from '@adonisjs/redis/services/main'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { PING_RUN_REDIS_KEY, type PingRunSummary } from '../../app/constants/metrics.js'

const TOKEN = 'test-metrics-token'
const prefix = `${env.get('APP_NAME')}_`

function metricValue(body: string, name: string): number | undefined {
  const line = body.split('\n').find((l) => l.startsWith(`${prefix}${name} `))
  return line === undefined ? undefined : Number(line.split(' ')[1])
}

test.group('Métriques applicatives', (group) => {
  group.each.setup(() => {
    const previous = env.get('METRICS_TOKEN')
    env.set('METRICS_TOKEN', TOKEN)
    return () => env.set('METRICS_TOKEN', previous ?? '')
  })

  test('expose les chiffres produit et la santé du ping', async ({ client, assert }) => {
    const response = await client.get('/metrics').bearerToken(TOKEN)

    response.assertStatus(200)
    for (const name of [
      'servers_tracked',
      'servers_registered',
      'servers_online',
      'servers_ping_overdue',
      'servers_boosting',
      'players_online',
    ]) {
      assert.isDefined(metricValue(response.text(), name), name)
    }
  })

  test('publie le bilan du dernier passage de ping déposé par le scheduler', async ({
    client,
    assert,
    cleanup,
  }) => {
    const run: PingRunSummary = {
      finishedAt: Date.now() - 60_000,
      durationMs: 4200,
      due: 12,
      pinged: 9,
    }
    await redis.set(PING_RUN_REDIS_KEY, JSON.stringify(run))
    cleanup(async () => {
      await redis.del(PING_RUN_REDIS_KEY)
    })

    const response = await client.get('/metrics').bearerToken(TOKEN)
    const body = response.text()

    assert.equal(metricValue(body, 'ping_run_due'), 12)
    assert.equal(metricValue(body, 'ping_run_succeeded'), 9)
    assert.equal(metricValue(body, 'ping_run_duration_seconds'), 4.2)
    assert.closeTo(metricValue(body, 'ping_run_age_seconds')!, 60, 5)
  })

  test("n'exporte pas le bilan du ping tant que le scheduler n'en a déposé aucun", async ({
    client,
    assert,
  }) => {
    await redis.del(PING_RUN_REDIS_KEY)

    const response = await client.get('/metrics').bearerToken(TOKEN)
    const body = response.text()

    assert.isUndefined(metricValue(body, 'ping_run_due'))
  })

  test('mesure la durée des requêtes SQL', async ({ client, assert }) => {
    await db.rawQuery('select pg_sleep(0.05)')

    const response = await client.get('/metrics').bearerToken(TOKEN)
    const body = response.text()

    assert.include(body, `${prefix}lucid_query_duration_seconds_count{`)
  })
})
