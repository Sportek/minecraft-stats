import Category from '#models/category'
import Server from '#models/server'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

async function createServer() {
  return Server.create({
    name: 'Test Categories Server',
    address: 'categories.test.example.com',
    port: 25565,
    type: 'java',
  })
}

test.group('Server categories', (group) => {
  // Chaque test tourne dans une transaction annulée à la fin : rien n'est persisté.
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('liste les catégories attachées à un serveur', async ({ client, assert }) => {
    const server = await createServer()
    const survival = await Category.firstOrCreate({ name: 'Survival' })
    await server.related('categories').attach([survival.id])

    // Régression : la resource imbriquée expose le param `server_id`. Lire `serverId`
    // renvoyait `undefined` à `findOrFail` → 500 au lieu de la liste.
    const response = await client.get(`/api/v1/servers/${server.id}/categories`)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().map((c: { name: string }) => c.name),
      ['Survival']
    )
  })

  test('renvoie 404 pour un serveur inexistant', async ({ client }) => {
    const response = await client.get('/api/v1/servers/999999999/categories')

    response.assertStatus(404)
  })
})
