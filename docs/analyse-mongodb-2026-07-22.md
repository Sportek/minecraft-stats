# MongoDB pour le ping et les stats — analyse prospective

**Date :** 22 juillet 2026
**Question posée :** faut-il, à l'avenir, remplacer PostgreSQL par MongoDB pour la partie ping
des serveurs et restitution des statistiques, et quels gains de performance en attendre ?
**Mesures :** effectuées sur staging (`minecraft-stats-postgres-lgzajp`, 23,7 M lignes brutes),
volumétrie comparable à la production (28,1 M lignes).

---

## 1. Réponse courte

**Non, pas maintenant — et le gain espéré n'est pas là où on le cherche.**

La lenteur mesurable actuelle ne vient pas du moteur de stockage. Elle vient d'un **index
manquant** : la requête globale sur fenêtre courte lit l'intégralité de la table (155 765 blocs)
pour restituer 48 points. Un index btree sur `created_at` la fait passer de **1 065 ms à 46 ms**,
soit **23× plus rapide et 186× moins de blocs lus**, pour 527 Mo et 13 secondes de construction.

Aucune migration MongoDB ne produira un gain de cet ordre sur cette requête, parce que le
problème n'est pas « Postgres est lent » mais « on ne lui a pas donné le chemin d'accès ».

---

## 2. Ligne de base mesurée

### 2.1 Volumétrie (staging)

| Table | Total | Données | Index | Lignes |
|---|---|---|---|---|
| `server_stats` | 2 973 Mo | 1 216 Mo | **1 756 Mo** | 23,7 M |
| `server_stats_hourly` | 584 Mo | 296 Mo | 287 Mo | 4,0 M |
| `server_stats_daily` | 20 Mo | 11 Mo | 9,8 Mo | 169 k |
| `servers` | 776 ko | 352 ko | 384 ko | 319 |

Les index de `server_stats` pèsent **plus lourd que les données elles-mêmes**.

### 2.2 Temps de réponse par chemin de lecture

Requête globale (agrégation sur les 319 serveurs), moyenne de 3 exécutions à chaud :

| Cas | Points rendus | Temps | Blocs lus |
|---|---|---|---|
| 24 h × 30 min — palier **brut** | 48 | **2 395 ms** | 155 764 |
| 7 j × 1 h — palier horaire | 169 | 77 ms | 458 |
| 30 j × 6 h — palier horaire | 121 | 188 ms | 1 662 |
| 1 an × 1 j — palier journalier | 357 | 102 ms | 11 417 |
| 2 ans × 1 sem — palier journalier | 52 | **39 ms** | 11 417 |
| *(contrefactuel)* 2 ans × 1 sem sur le brut | 52 | 4 138 ms | 155 764 |

Deux enseignements :

1. **Les paliers d'agrégation fonctionnent.** 4 138 ms → 39 ms sur 2 ans, soit un facteur 106.
   C'est le gain structurel, et il est déjà encaissé.
2. **La fenêtre la plus courte est la plus lente.** 24 h coûte 2 395 ms quand 2 ans coûtent 39 ms.
   C'est contre-intuitif, et c'est le symptôme.

### 2.3 Diagnostic

```
Parallel Seq Scan on server_stats  (actual time=662..1942 rows=11071 loops=3)
  Filter: created_at >= '2025-05-31' AND created_at <= '2025-06-01'
  Rows Removed by Filter: 8 236 904
  Buffers: shared read=154 704
```

Pour retenir 33 000 lignes, Postgres en lit 24,7 millions. Les index disponibles :

```
server_stats_pkey                          btree (id)                       594 Mo
server_stats_server_id_created_at_index    btree (server_id, created_at)    981 Mo
server_stats_server_id_player_count_index  btree (server_id, player_count)  181 Mo
```

Aucun ne commence par `created_at`. Un prédicat portant uniquement sur la date ne peut donc
utiliser aucun d'eux — d'où le balayage complet. Les requêtes *par serveur* vont bien, parce
qu'elles fournissent `server_id` en tête ; c'est la vue **globale** qui paie.

### 2.4 Index morts

`pg_stat_user_indexes` sur staging :

| Index | Taille | Scans |
|---|---|---|
| `server_stats_server_id_created_at_index` | 981 Mo | 10 125 |
| `server_stats_hourly_pkey` | 222 Mo | 4 255 285 |
| `server_stats_daily_pkey` | 8 Mo | 172 286 |
| **`server_stats_pkey`** | **594 Mo** | **0** |
| **`server_stats_server_id_player_count_index`** | **181 Mo** | **0** |

**775 Mo d'index n'ont jamais servi à une seule lecture.** `server_id_player_count` est
supprimable immédiatement. `server_stats_pkey` porte une contrainte d'unicité sur une colonne
`id` que personne n'interroge — le supprimer est possible mais demande de vérifier qu'aucun
code ne s'appuie sur `id`, et c'est une décision distincte.

### 2.5 Correctif mesuré

Trois variantes testées sur staging (index créé, mesuré, puis supprimé) :

| Variante sur `created_at` | Temps (chaud) | Blocs lus | Taille | Construction |
|---|---|---|---|---|
| Aucune — état actuel | 1 065 ms | 155 765 | — | — |
| BRIN | 628 ms | 25 990 | **56 ko** | 4,2 s |
| **btree** | **46 ms** | **835** | 527 Mo | 12,8 s |

Le BRIN est séduisant (56 ko !) et divise les I/O par 6, mais le btree divise par 186. Sur une
table append-only, le BRIN aurait dû mieux s'en tirer ; il souffre ici du fait qu'une fenêtre de
24 h est éparpillée sur de nombreuses plages de blocs, chacune ramenée en entier.

> Les temps de cette section (1 065 ms) diffèrent de ceux du § 2.2 (2 395 ms) : la requête y est
> simplifiée (2 agrégats au lieu de 5). Seules les comparaisons **au sein** d'un même tableau
> sont valides.

---

## 3. Ce que MongoDB apporterait

Le candidat pertinent n'est pas MongoDB « document » mais les **time series collections**
(MongoDB 5.0+), conçues exactement pour ce profil.

**Ce qui jouerait en sa faveur :**

- **Bucketing automatique.** Les mesures d'une même série sur une fenêtre sont regroupées dans
  un document unique, stocké en colonnes. C'est structurellement ce que nos tables `_hourly` et
  `_daily` font à la main.
- **Compression.** Le stockage colonnaire compresse bien des séries d'entiers lentement
  variables — typiquement un facteur 3 à 10 sur ce genre de données, à vérifier sur un
  échantillon réel avant d'y croire.
- **Expiration native.** `expireAfterSeconds` purge le brut ancien sans job maison.
- **Index implicite sur le temps.** Le problème du § 2.3 ne peut pas exister : le champ temporel
  est indexé par construction.

**Ce qui ne changerait rien :**

- Les paliers d'agrégation resteraient nécessaires. Mongo ne fait pas de downsampling
  automatique ; il faudrait réécrire nos rollups en pipelines `$group` + `$dateTrunc` et les
  matérialiser via `$merge`. Le travail est le même, dans une autre syntaxe.
- Le gain du § 2.5 est déjà atteignable pour le coût d'une migration d'index.
- Le cache Redis (TTL 300 s) absorbe déjà la répétition. La base ne voit chaque combinaison de
  paramètres qu'une fois toutes les 5 minutes.

**Ce qui coûterait cher :**

- **Les filtres catégorie/langue sont des jointures.** `getGlobalStats` joint `server_stats` à
  `server_categories` et `server_languages`. En polyglotte, ces jointures disparaissent : il
  faudrait résoudre la liste des `server_id` côté Postgres puis la passer à Mongo — un `$in`
  potentiellement large, et deux allers-retours réseau au lieu d'un plan unique.
- **Toute la couche d'accès est Lucid.** Modèles, policies Bouncer, transactions, migrations,
  `schema.ts` généré. Le ping écrit dans `server_stats` par bulk insert transactionnel ; la
  cohérence avec `servers.last_player_count` et `peak_player_count` en dépend.
- **Deux bases à exploiter.** Deux sauvegardes, deux restaurations, deux surveillances, deux
  procédures de reprise. Aujourd'hui : un `docker exec` et un dump.
- **Le backfill.** 28 M lignes à réécrire, avec la même contrainte de fenêtre hors heure de
  pointe qu'on vient d'expérimenter (≈ 1 h pour le rollup horaire).

---

## 4. Alternatives mieux ciblées

| Option | Effort | Gain attendu | Remarque |
|---|---|---|---|
| **Index btree sur `created_at`** | 1 migration | **23× sur la vue globale courte** | Mesuré § 2.5 |
| **Supprimer les index morts** | 1 migration | 181 à 775 Mo | Mesuré § 2.4 |
| **Rétention du brut à 90 j** | 1 job planifié | ≈ 88 % du volume brut | Les rollups couvrent déjà l'historique |
| **Partitionnement par mois** | moyen | élagage de partitions | Le code de maintenance existe déjà (`start/scheduler.ts`) mais la table n'est pas partitionnée (`relkind = 'r'`) |
| **TimescaleDB** | moyen | agrégats continus natifs | Extension Postgres : remplace nos rollups maison sans quitter Lucid ni le SQL |
| **ClickHouse** | élevé | 10–100× sur l'agrégation | Le meilleur choix technique *si* la volumétrie explose ; même coût polyglotte que Mongo |
| **MongoDB** | élevé | compression, pas de gain de latence démontré | — |

**TimescaleDB mérite un examen sérieux** si le sujet revient : c'est une extension PostgreSQL,
donc Lucid, les migrations, les policies et les jointures continuent de fonctionner. Ses
*continuous aggregates* font exactement, et automatiquement, ce que `backfill:hourly-stats` et
`backfill:daily-stats` font à la main — avec rafraîchissement incrémental, ce qui supprimerait
la procédure de backfill d'une heure documentée dans `memory/stats-rollups-backfill.md`.

---

## 5. Quand la question se reposera

Volumétrie actuelle : 319 serveurs × 144 pings/jour = **45 936 lignes/jour**, soit ≈ 16,8 M/an.

| Serveurs suivis | Lignes brutes/an | Données brutes/an* | Rollup horaire/an |
|---|---|---|---|
| 319 (aujourd'hui) | 16,8 M | ≈ 0,9 Go | 2,8 M lignes |
| 1 000 | 52,6 M | ≈ 2,7 Go | 8,8 M lignes |
| 5 000 | 263 M | ≈ 13,4 Go | 43,8 M lignes |

*\* données seules, ≈ 51 octets/ligne mesurés (1 216 Mo / 23,7 M) ; hors index.*

À 5 000 serveurs, le brut devient inconfortable — mais c'est précisément là que la **rétention à
90 jours** répond, en plafonnant le brut à ≈ 3,3 Go quelle que soit l'ancienneté du service. Les
rollups, eux, croissent lentement et restent minuscules.

**Seuil de réexamen proposé :** si le rollup horaire dépasse ~50 M lignes ou si une requête
sur un palier agrégé dépasse 500 ms après application du § 4, la question du moteur redevient
légitime — et le candidat sera alors ClickHouse ou TimescaleDB plutôt que MongoDB.

---

## 6. Recommandation

1. **Ajouter l'index btree sur `server_stats(created_at)`.** Gain mesuré : 23×. C'est le seul
   changement de cette liste dont l'effet est démontré chiffres en main.
2. **Supprimer `server_stats_server_id_player_count_index`** (181 Mo, 0 scan).
3. **Instrumenter avant d'aller plus loin.** Aucune mesure de latence côté application n'existe
   aujourd'hui : je n'ai chronométré que le SQL, pas le temps vu par un utilisateur (sérialisation,
   cache Redis, réseau). Sans cette donnée, tout arbitrage de moteur se ferait à l'aveugle.
4. **Mettre la rétention du brut à l'ordre du jour** — c'est le seul levier qui change l'ordre de
   grandeur, et il ne dépend d'aucun choix de moteur.
5. **Ne pas migrer vers MongoDB.** Le gain principal qu'il apporterait (indexation temporelle
   native) s'obtient ici pour une migration d'index ; les gains restants (compression, TTL) sont
   réels mais ne justifient pas une base supplémentaire à exploiter, la perte des jointures
   catégorie/langue et la réécriture de la couche d'accès.

---

## Limites de cette analyse

- Mesures faites sur **staging**, pas en production. Volumétries proches (23,7 M vs 28,1 M
  lignes) mais la charge concurrente et le cache disque diffèrent.
- **Aucun prototype MongoDB n'a été construit.** Les gains attribués à Mongo au § 3 sont issus
  de ses caractéristiques documentées, pas d'une mesure sur ces données. Toute décision
  d'y aller devrait passer par un prototype chargé d'un extrait réel.
- **Le chemin d'écriture n'a pas été mesuré.** Le ping insère en masse toutes les 10 minutes ;
  je n'ai chronométré que les lectures. Un index supplémentaire sur `created_at` ralentit
  légèrement l'insertion — négligeable a priori à 46 000 lignes/jour, mais non vérifié.
- Les index temporaires créés pour le § 2.5 ont été supprimés après mesure ; staging est revenu
  à son état initial.
