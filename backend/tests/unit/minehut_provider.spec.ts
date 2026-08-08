import { test } from '@japa/runner'
import minehutProvider from '../../minecraft-ping/host_providers/minehut_provider.js'
import { resolveHostProvider } from '../../minecraft-ping/host_providers/index.js'

test.group('minehutProvider.resolveKey', () => {
  test('extrait le nom du serveur du sous-domaine', ({ assert }) => {
    assert.equal(minehutProvider.resolveKey('thatboxsrver.minehut.gg'), 'thatboxsrver')
    assert.equal(minehutProvider.resolveKey('TechMines.Minehut.GG'), 'techmines')
    assert.equal(minehutProvider.resolveKey('  techmines.minehut.gg  '), 'techmines')
  })

  test('gère la variante Bedrock', ({ assert }) => {
    assert.equal(minehutProvider.resolveKey('thatbox.bedrock.minehut.gg'), 'thatbox')
  })

  test('ignore les hôtes qui ne sont pas des sous-domaines Minehut', ({ assert }) => {
    assert.isNull(minehutProvider.resolveKey('mc.hypixel.net'))
    assert.isNull(minehutProvider.resolveKey('192.168.1.1'))
    // `minehut.gg` nu n'est le sous-domaine de personne : c'est le réseau lui-même.
    assert.isNull(minehutProvider.resolveKey('minehut.gg'))
    // Un hôte qui se contente de *contenir* le suffixe ne doit pas matcher.
    assert.isNull(minehutProvider.resolveKey('minehut.gg.evil.com'))
  })
})

test.group('resolveHostProvider', () => {
  test('route une adresse Minehut vers son provider', ({ assert }) => {
    const hosted = resolveHostProvider('thatboxsrver.minehut.gg')
    assert.equal(hosted?.provider.id, 'minehut')
    assert.equal(hosted?.key, 'thatboxsrver')
  })

  test('laisse passer une adresse ordinaire (ping direct)', ({ assert }) => {
    assert.isNull(resolveHostProvider('mc.hypixel.net'))
  })
})

/** Stub de `fetch` qui sert la liste `/servers` ou la fiche `?byName=true`. */
function stubMinehutApi(urls: string[]) {
  const realFetch = globalThis.fetch

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input)
    urls.push(url)

    if (url.includes('?byName=true')) {
      return new Response(
        JSON.stringify({
          server: {
            online: true,
            playerCount: 246,
            maxPlayers: 500,
            motd: 'Box-PvP',
            server_list_favicon: 'data:image/png;base64,AAAA',
          },
        }),
        { status: 200 }
      )
    }

    return new Response(
      JSON.stringify({
        servers: [
          {
            name: 'TechMines',
            motd: 'Box-PvP',
            maxPlayers: 500,
            playerData: { playerCount: 246 },
            versionMin: '1.20',
            versionMax: '1.21',
          },
        ],
      }),
      { status: 200 }
    )
  }) as typeof fetch

  return () => {
    globalThis.fetch = realFetch
  }
}

test.group('minehutProvider.fetchStats', (group) => {
  let urls: string[] = []

  group.each.setup(() => {
    urls = []
    return stubMinehutApi(urls)
  })

  test('lit le compte réel du serveur listé, et mutualise l’appel réseau', async ({ assert }) => {
    const stats = await minehutProvider.fetchStats('techmines')
    assert.deepEqual(stats, {
      players: { online: 246, max: 500 },
      motd: 'Box-PvP',
      version: '1.20-1.21',
      favicon: null,
    })

    // Un serveur absent de la liste `/servers` est hors-ligne : surtout pas les
    // ~4600 joueurs du réseau que renverrait un ping direct du proxy Minehut.
    assert.isNull(await minehutProvider.fetchStats('thatboxsrver'))

    // Les deux résolutions partagent le même instantané (TTL) : un seul appel.
    assert.lengthOf(urls, 1)
  })

  test('le mode detailed ramène le favicon via la fiche du serveur', async ({ assert }) => {
    const stats = await minehutProvider.fetchStats('techmines', { detailed: true })

    assert.equal(stats?.favicon, 'data:image/png;base64,AAAA')
    assert.deepEqual(stats?.players, { online: 246, max: 500 })
    assert.isTrue(urls[0].endsWith('/server/techmines?byName=true'))

    // Même MOTD que l'instantané : `motd_hash` ne doit pas dépendre du chemin de ping.
    const snapshotStats = await minehutProvider.fetchStats('techmines')
    assert.equal(stats?.motd, snapshotStats?.motd)
  })

  test('un serveur hors-ligne ou inconnu ne renvoie rien en mode detailed', async ({ assert }) => {
    // Le teardown du group restaure le vrai `fetch`.
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ server: { online: false } }), { status: 200 })) as typeof fetch
    assert.isNull(await minehutProvider.fetchStats('thatboxsrver', { detailed: true }))

    // Un nom inexistant : `{"server": null}` en HTTP 200.
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ server: null }), { status: 200 })) as typeof fetch
    assert.isNull(await minehutProvider.fetchStats('zzz-nexiste-pas', { detailed: true }))
  })
})
