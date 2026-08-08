/**
 * Détection des serveurs qui gonflent artificiellement leur nombre de connectés.
 *
 * Le compteur affiché vient du Server List Ping : c'est le serveur lui-même qui
 * l'annonce, rien ne le contraint à dire la vérité. Les plugins qui le falsifient
 * (CountSpoof+, FakePlayers, FakePlayercount…) laissent trois familles de traces :
 *  - multiplicateur : `affiché = réel × k`, la forme de la journée est intacte mais
 *    tous les relevés tombent sur un réseau de pas (multiples de k) ;
 *  - décalage additif : `affiché = réel + c`, la forme est intacte mais l'amplitude
 *    relative jour/nuit s'effondre vers 1 ;
 *  - série synthétique : nombre tiré au sort, figé, ou marche aléatoire — plus de
 *    cycle circadien du tout, et l'inertie du compteur disparaît.
 *
 * Aucun signal n'est parfait seul, mais leur combinaison au-delà d'un seuil identifie
 * un tricheur de façon fiable. Voir {@link BoostDetectionService}.
 */

/** Niveau dérivé du score, pour trier la file de revue admin. */
export type BoostLevel = 'clean' | 'watch' | 'likely'

/** Verdict rendu par un admin — c'est lui qui fait foi, pas le score. */
export type BoostStatus = 'boosting' | 'clean' | 'inconclusive'

export const BOOST_STATUSES: BoostStatus[] = ['boosting', 'clean', 'inconclusive']

/**
 * Poids de chaque signal. Calibrés sur 111 serveurs de production analysés sur 7 jours
 * de relevés bruts. Logique de conception :
 *  - valueLattice / stepLattice : contrainte arithmétique, pas tendance statistique.
 *    Un compteur multiplié par k ne PEUT pas produire autre chose que des multiples
 *    de k. Ce sont les deux seuls signaux assez sûrs pour atteindre le seuil seuls.
 *  - inertia : une population réelle a une inertie énorme sur 10 min (autocorrélation
 *    ~0,99 observée partout). Le mode "random" d'un spoofer la détruit.
 *  - rhythm : rapport pic/creux de la journée type. Détecte le décalage additif, qui
 *    écrase l'amplitude relative sans toucher à la forme. Ne détecte PAS les
 *    multiplicateurs (multiplier conserve exactement le rapport).
 *  - flatness : corrobore `rhythm` sans dépendre du fuseau horaire.
 *  - granularity : une marche naturelle visite presque tous les entiers de sa plage ;
 *    une série truquée se répète.
 *  - slotsGlued : astuce "SlotsPlusOne" (faire croire que le serveur est plein). C'est
 *    cosmétique et répandu (12 serveurs sur 111), donc poids faible, jamais décisif.
 */
export const BOOST_WEIGHTS = {
  valueLattice: 70,
  valueLatticeRounded: 40,
  stepLattice: 65,
  inertia: 40,
  rhythm: 28,
  flatness: 22,
  granularity: 20,
  slotsGlued: 14,
} as const

export type BoostSignalKey = keyof typeof BOOST_WEIGHTS

/**
 * Plafond de la famille "forme" (rhythm + flatness + inertia + granularity). Ces
 * quatre mesures décrivent le même phénomène sous quatre angles : les additionner
 * naïvement gonflerait le score d'un serveur simplement calme. Le plafond garantit
 * qu'elles ne peuvent pas franchir {@link BOOST_LIKELY_THRESHOLD} sans corroboration
 * arithmétique — c'est ce qui protège les serveurs à file d'attente (type 2b2t),
 * plats pour une raison parfaitement légitime.
 */
export const SHAPE_FAMILY_CAP = 60

/** Score à partir duquel le serveur entre dans la file de revue admin. */
export const BOOST_LIKELY_THRESHOLD = 70

/** Score à partir duquel on garde le serveur sous surveillance sans le signaler. */
export const BOOST_WATCH_THRESHOLD = 40

/**
 * Suffisance des données : en dessous, aucun test statistique n'a de puissance et on
 * ne produit pas de score du tout (plutôt qu'un score bas trompeur). Sur ~630 serveurs
 * listés, une centaine franchit ce plancher ; les autres demandent des signaux
 * hors-ping (échantillon de joueurs, votes) qui viendront dans un second temps.
 */
export const BOOST_MIN_SAMPLES = 500
export const BOOST_MIN_MEAN_PLAYERS = 10
export const BOOST_MIN_DISTINCT_VALUES = 25

/** Fenêtre d'analyse, en jours. 7 j = ~1 000 relevés à la cadence de 10 min. */
export const BOOST_WINDOW_DAYS = 7
