import { test } from '@japa/runner'
import Server from '#models/server'
import ServerOwnershipService, {
  textContainsToken,
  txtRecordsContainToken,
  verificationValue,
} from '#services/server_ownership_service'

/** Construit un Server minimal en mémoire (pas de persistance) pour les helpers purs. */
function fakeServer(fields: Partial<Server>): Server {
  const server = new Server()
  server.merge(fields)
  return server
}

test.group('ServerOwnershipService — verification helpers', () => {
  test('verificationValue préfixe le jeton', ({ assert }) => {
    assert.equal(verificationValue('abc123'), 'minecraft-stats-verify=abc123')
  })

  test('txtRecordsContainToken recolle les morceaux et ignore la casse', ({ assert }) => {
    const expected = verificationValue('deadbeef')
    // Enregistrement découpé en chunks (comportement de dns.resolveTxt).
    assert.isTrue(txtRecordsContainToken([['minecraft-stats-verify=', 'deadbeef']], expected))
    // Casse différente sur l'entête.
    assert.isTrue(txtRecordsContainToken([['MINECRAFT-STATS-VERIFY=deadbeef']], expected))
    // Autres enregistrements TXT sans rapport → pas de faux positif.
    assert.isFalse(txtRecordsContainToken([['v=spf1 include:_spf.google.com ~all']], expected))
    assert.isFalse(txtRecordsContainToken([['minecraft-stats-verify=other']], expected))
  })

  test('textContainsToken détecte le jeton dans une MOTD (casse ignorée)', ({ assert }) => {
    const expected = verificationValue('cafe01')
    assert.isTrue(textContainsToken('Welcome! minecraft-stats-verify=cafe01 §aHave fun', expected))
    assert.isTrue(textContainsToken('MINECRAFT-STATS-VERIFY=CAFE01', expected))
    assert.isFalse(textContainsToken('Welcome to my server!', expected))
    assert.isFalse(textContainsToken('minecraft-stats-verify=other', expected))
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
