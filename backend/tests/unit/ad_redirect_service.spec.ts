import { test } from '@japa/runner'
import AdRedirectService from '#services/ad_redirect_service'

test.group('AdRedirectService.extractHrefs', () => {
  test('collecte les href du HTML (guillemets simples ou doubles)', ({ assert }) => {
    const hrefs = AdRedirectService.extractHrefs(
      `<a href="https://example.com">x</a><a href='http://foo.bar/path'>y</a>`
    )
    assert.isTrue(hrefs.has('https://example.com'))
    assert.isTrue(hrefs.has('http://foo.bar/path'))
  })

  test('ajoute la variante décodée des entités HTML', ({ assert }) => {
    const hrefs = AdRedirectService.extractHrefs(`<a href="https://x.com/a&amp;b">x</a>`)
    assert.isTrue(hrefs.has('https://x.com/a&b'))
  })
})

test.group('AdRedirectService.resolveTarget', () => {
  const html = `<a href="https://example.com/promo">Click</a>`

  test('renvoie la cible normalisée si elle est dans la liste blanche', ({ assert }) => {
    assert.equal(
      AdRedirectService.resolveTarget(html, 'https://example.com/promo'),
      'https://example.com/promo'
    )
  })

  test('null si la cible ne figure pas dans le HTML de la pub', ({ assert }) => {
    assert.isNull(AdRedirectService.resolveTarget(html, 'https://evil.com'))
  })

  test('null pour un protocole non http(s), même présent dans le HTML', ({ assert }) => {
    const js = `<a href="javascript:alert(1)">x</a>`
    assert.isNull(AdRedirectService.resolveTarget(js, 'javascript:alert(1)'))
  })

  test('null pour une cible vide', ({ assert }) => {
    assert.isNull(AdRedirectService.resolveTarget(html, ''))
  })

  test('les caractères de contrôle sont retirés avant comparaison', ({ assert }) => {
    // Un CRLF injecté ne doit pas contourner l'allow-list ni polluer l'en-tête Location.
    assert.equal(
      AdRedirectService.resolveTarget(html, 'https://example.com/promo\r\n'),
      'https://example.com/promo'
    )
  })
})
