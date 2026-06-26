import { test } from '@japa/runner'
import DuplicateDetectionService from '#services/duplicate_detection_service'

test.group('DuplicateDetectionService.hostDomain', () => {
  test('réduit un sous-domaine au domaine racine (eTLD+1)', ({ assert }) => {
    assert.equal(DuplicateDetectionService.hostDomain('mc.hypixel.net'), 'hypixel.net')
    assert.equal(DuplicateDetectionService.hostDomain('hypixel.net'), 'hypixel.net')
    assert.equal(DuplicateDetectionService.hostDomain('play.hypixel.net'), 'hypixel.net')
    assert.equal(DuplicateDetectionService.hostDomain('alpha.hypixel.net'), 'hypixel.net')
  })

  test('gère les suffixes publics à deux niveaux', ({ assert }) => {
    assert.equal(DuplicateDetectionService.hostDomain('play.example.co.uk'), 'example.co.uk')
  })

  test('retourne null pour une IP ou un hôte sans TLD', ({ assert }) => {
    assert.isNull(DuplicateDetectionService.hostDomain('192.168.1.1'))
    assert.isNull(DuplicateDetectionService.hostDomain('localhost'))
  })
})

test.group('DuplicateDetectionService.playerCountsClose', () => {
  test('vrai quand les comptes sont à moins de 10 %', ({ assert }) => {
    assert.isTrue(DuplicateDetectionService.playerCountsClose(40000, 41000))
    assert.isTrue(DuplicateDetectionService.playerCountsClose(100, 100))
  })

  test('faux au-delà de 10 % d’écart', ({ assert }) => {
    assert.isFalse(DuplicateDetectionService.playerCountsClose(100, 120))
  })

  test('faux sous le plancher de bruit (petits serveurs)', ({ assert }) => {
    // Deux serveurs sans rapport peuvent tous deux stationner à ~10 joueurs.
    assert.isFalse(DuplicateDetectionService.playerCountsClose(10, 10))
  })

  test('faux quand un compte est inconnu', ({ assert }) => {
    assert.isFalse(DuplicateDetectionService.playerCountsClose(null, 5000))
    assert.isFalse(DuplicateDetectionService.playerCountsClose(5000, null))
  })
})

test.group('DuplicateDetectionService.hashMotd', () => {
  test('le même squelette de MOTD donne le même hash malgré chiffres/couleurs', ({ assert }) => {
    const a = DuplicateDetectionService.hashMotd('§aWelcome! §7Online: §e1234')
    const b = DuplicateDetectionService.hashMotd('§aWelcome! §7Online: §e5678')
    assert.isNotNull(a)
    assert.equal(a, b)
  })

  test('null pour un MOTD trop court pour discriminer', ({ assert }) => {
    assert.isNull(DuplicateDetectionService.hashMotd('hi'))
  })
})

test.group('DuplicateDetectionService.hashFavicon', () => {
  test('hash stable pour le même favicon, null sans favicon', ({ assert }) => {
    const favicon = 'data:image/png;base64,AAAABBBBCCCC'
    assert.equal(
      DuplicateDetectionService.hashFavicon(favicon),
      DuplicateDetectionService.hashFavicon(favicon)
    )
    assert.isNull(DuplicateDetectionService.hashFavicon(null))
  })
})
