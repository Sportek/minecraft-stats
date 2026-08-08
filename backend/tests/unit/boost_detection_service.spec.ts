import { test } from '@japa/runner'
import { readFileSync } from 'node:fs'
import BoostDetectionService, { type Sample } from '#services/boost_detection_service'
import { BOOST_LIKELY_THRESHOLD, BOOST_WATCH_THRESHOLD } from '../../app/constants/server_boost.js'

/**
 * Séries de production réelles, figées : 620 relevés consécutifs (~4,3 jours à la
 * cadence de 10 min) pour six serveurs dont on connaît le comportement.
 *
 * Trois d'entre eux multiplient leur compteur — c'est arithmétiquement démontrable,
 * pas une supposition : leurs relevés ne tombent que sur des multiples du facteur.
 * Les trois autres servent de contre-épreuve, dont `2b2t`, plat pour une raison
 * parfaitement légitime (file d'attente) : c'est le faux positif que la calibration
 * doit éviter.
 *
 * Ces fixtures sont ce qui rend la calibration rejouable : toucher aux poids sans
 * casser ce fichier, c'est avoir vérifié que la séparation tient encore.
 */
const SERIES: Record<string, { startedAt: string; samples: [number, number, number][] }> =
  JSON.parse(readFileSync(new URL('../fixtures/boost_series.json', import.meta.url), 'utf8'))

const load = (key: string): Sample[] => {
  const { startedAt, samples } = SERIES[key]
  const origin = new Date(startedAt).getTime()
  return samples.map(([minutes, playerCount, maxCount]) => ({
    playerCount,
    maxCount: maxCount === 0 ? null : maxCount,
    createdAt: new Date(origin + minutes * 60_000),
  }))
}

const evaluate = (key: string) => {
  const result = BoostDetectionService.evaluate(load(key))
  if (!result) throw new Error(`fixture ${key} jugée insuffisante`)
  return result
}

const pointsFor = (key: string, signal: string): number =>
  evaluate(key).signals.find((s) => s.key === signal)?.points ?? 0

test.group('BoostDetectionService — multiplicateurs entiers', () => {
  test('démasque un compteur multiplié par 4 et estime le compte réel', ({ assert }) => {
    const result = evaluate('fadecloud_x4')

    assert.equal(result.detectedFactor, 4)
    assert.isAbove(result.score, BOOST_LIKELY_THRESHOLD)
    assert.isAbove(pointsFor('fadecloud_x4', 'valueLattice'), 0)
    // ~2 400 joueurs annoncés pour ~600 réels.
    assert.isBelow(result.estimatedRealPlayers!, 800)
  })

  test('retient le plus grand facteur, pas ses diviseurs', ({ assert }) => {
    // Des relevés tous divisibles par 16 le sont aussi par 8, 4 et 2 : le
    // multiplicateur réellement appliqué est le plus grand des quatre.
    assert.equal(evaluate('minelegacy_x16').detectedFactor, 16)
  })
})

test.group('BoostDetectionService — multiplicateur fractionnaire', () => {
  test('démasque un facteur non entier via le réseau des incréments', ({ assert }) => {
    const result = evaluate('talonmc_x37')

    // Les valeurs ne sont divisibles par rien — seuls les écarts trahissent le
    // facteur : 3-4, 7-8, 11, 15, 18-19 sont les multiples arrondis de 3,7.
    assert.isNotNull(result.detectedFactor)
    assert.isAbove(result.detectedFactor!, 3)
    assert.isBelow(result.detectedFactor!, 4.5)
    assert.isAbove(pointsFor('talonmc_x37', 'stepLattice'), 0)
    assert.isAtLeast(result.score, BOOST_LIKELY_THRESHOLD)
  })
})

test.group('BoostDetectionService — serveurs sains', () => {
  test('laisse tranquille un gros serveur au cycle jour/nuit marqué', ({ assert }) => {
    const result = evaluate('pikanetwork_clean')

    assert.isNull(result.detectedFactor)
    assert.isBelow(result.score, BOOST_WATCH_THRESHOLD)
  })

  test('laisse tranquille un serveur mondial à la courbe aplatie', ({ assert }) => {
    // Une audience répartie sur tous les fuseaux lisse la journée type : le rapport
    // pic/creux tombe vers 1,6 sans que personne ne triche.
    const result = evaluate('wynncraft_clean')

    assert.isNull(result.detectedFactor)
    assert.isBelow(result.score, BOOST_WATCH_THRESHOLD)
  })

  test('un serveur plat par file d’attente ne franchit pas le seuil de signalement', ({
    assert,
  }) => {
    // 2b2t est plat (variance ~3 %, aucun cycle) pour une raison légitime. La famille
    // « forme » le remarque, mais son plafond l'empêche à lui seul d'atteindre le
    // seuil — c'est exactement la garantie que ce plafond existe pour offrir.
    const result = evaluate('2b2t_queued')

    assert.isNull(result.detectedFactor)
    assert.isBelow(result.score, BOOST_LIKELY_THRESHOLD)
  })
})

test.group('BoostDetectionService — suffisance des données', () => {
  test('refuse de noter une série trop courte', ({ assert }) => {
    assert.isNull(BoostDetectionService.evaluate(load('fadecloud_x4').slice(0, 120)))
  })

  test('refuse de noter un serveur à trop peu de joueurs', ({ assert }) => {
    // Un serveur qui oscille entre 0 et 2 est « divisible par 2 » une fois sur deux
    // par pur hasard : sans niveau, le test de réseau n'a aucune puissance.
    const tiny = load('pikanetwork_clean').map((sample, index) => ({
      ...sample,
      playerCount: index % 3,
    }))
    assert.isNull(BoostDetectionService.evaluate(tiny))
  })
})

test.group('BoostDetectionService.levelFor', () => {
  test('classe le score en trois niveaux', ({ assert }) => {
    assert.equal(BoostDetectionService.levelFor(BOOST_LIKELY_THRESHOLD), 'likely')
    assert.equal(BoostDetectionService.levelFor(BOOST_WATCH_THRESHOLD), 'watch')
    assert.equal(BoostDetectionService.levelFor(BOOST_WATCH_THRESHOLD - 1), 'clean')
  })
})
