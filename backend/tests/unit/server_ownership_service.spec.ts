import { test } from '@japa/runner'
import Server from '#models/server'
import ServerOwnershipService, {
  dnsTxtValue,
  txtRecordsContainToken,
} from '#services/server_ownership_service'

/** Construit un Server minimal en mémoire (pas de persistance) pour les helpers purs. */
function fakeServer(fields: Partial<Server>): Server {
  const server = new Server()
  server.merge(fields)
  return server
}

test.group('ServerOwnershipService — DNS helpers', () => {
  test('dnsTxtValue préfixe le jeton', ({ assert }) => {
    assert.equal(dnsTxtValue('abc123'), 'minecraft-stats-verify=abc123')
  })

  test('txtRecordsContainToken recolle les morceaux et ignore la casse', ({ assert }) => {
    const expected = dnsTxtValue('deadbeef')
    // Enregistrement découpé en chunks (comportement de dns.resolveTxt).
    assert.isTrue(txtRecordsContainToken([['minecraft-stats-verify=', 'deadbeef']], expected))
    // Casse différente sur l'entête.
    assert.isTrue(txtRecordsContainToken([['MINECRAFT-STATS-VERIFY=deadbeef']], expected))
    // Autres enregistrements TXT sans rapport → pas de faux positif.
    assert.isFalse(txtRecordsContainToken([['v=spf1 include:_spf.google.com ~all']], expected))
    assert.isFalse(txtRecordsContainToken([['minecraft-stats-verify=other']], expected))
  })

  test('dnsHostCandidates: domaine racine + adresse exacte, dédupliqués', ({ assert }) => {
    const server = fakeServer({ address: 'play.example.com', hostDomain: 'example.com' })
    assert.deepEqual(ServerOwnershipService.dnsHostCandidates(server).sort(), [
      'example.com',
      'play.example.com',
    ])
  })

  test('dnsHostCandidates ignore une adresse IP littérale', ({ assert }) => {
    const server = fakeServer({ address: '192.0.2.10', hostDomain: null })
    assert.deepEqual(ServerOwnershipService.dnsHostCandidates(server), [])
  })

  test('dnsAvailable est faux pour un serveur en IP nue', ({ assert }) => {
    assert.isFalse(ServerOwnershipService.dnsAvailable(fakeServer({ address: '192.0.2.10' })))
    assert.isTrue(
      ServerOwnershipService.dnsAvailable(
        fakeServer({ address: 'mc.example.com', hostDomain: 'example.com' })
      )
    )
  })
})
