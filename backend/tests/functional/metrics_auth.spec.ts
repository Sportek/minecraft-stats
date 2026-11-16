import env from '#start/env'
import { test } from '@japa/runner'

const TOKEN = 'test-metrics-token'

test.group('Metrics auth', (group) => {
  group.each.setup(() => {
    const previous = env.get('METRICS_TOKEN')
    env.set('METRICS_TOKEN', TOKEN)
    return () => env.set('METRICS_TOKEN', previous ?? '')
  })

  test('refuse /metrics sans jeton', async ({ client }) => {
    const response = await client.get('/metrics')

    response.assertStatus(401)
  })

  test('refuse /metrics avec un mauvais jeton', async ({ client }) => {
    const response = await client.get('/metrics').bearerToken('wrong-token')

    response.assertStatus(401)
  })

  test('refuse /metrics quand METRICS_TOKEN est vide', async ({ client }) => {
    env.set('METRICS_TOKEN', '')

    const response = await client.get('/metrics').bearerToken('')

    response.assertStatus(401)
  })

  test('sert les métriques avec le bon jeton', async ({ client, assert }) => {
    const response = await client.get('/metrics').bearerToken(TOKEN)

    response.assertStatus(200)
    assert.include(response.text(), 'http_requests_total')
  })

  test("n'affecte pas les autres routes", async ({ client }) => {
    const response = await client.get('/api/v1/categories')

    response.assertStatus(200)
  })
})
