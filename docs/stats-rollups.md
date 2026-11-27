# Stats des serveurs : les trois niveaux

Les stats de joueurs sont lues sur **trois niveaux**, choisis par
`StatsService.pickSource()` selon la période demandée :

| Table | Granularité | Alimentée par |
|---|---|---|
| `server_stats` | brut, un point par ping (10 min) | le scheduler |
| `server_stats_hourly` | une ligne par serveur et par heure | le scheduler, ou `backfill:hourly-stats` |
| `server_stats_daily` | une ligne par serveur et par jour | le scheduler, ou `backfill:daily-stats` |

Chaque ligne d'agrégat porte `avg_player_count`, `peak_player_count`,
`min_player_count`, `max_slot_count` et `samples_count`. La moyenne journalière est
pondérée par `samples_count`.

⚠️ `max_slot_count` est la **capacité en slots** du serveur, pas un nombre de joueurs.

## Après une migration qui ajoute une colonne d'agrégat

Il faut **rejouer les backfills**, sinon la colonne reste `NULL` sur tout
l'historique. L'API retombe alors sur `playerCount` : jamais faux, mais plat.
L'ordre compte, parce que le journalier lit l'horaire, pas le brut :

```bash
node ace backfill:hourly-stats   # long sur une grosse base (≈ 1 h pour ~30 M lignes)
node ace backfill:daily-stats    # quelques secondes
```

`backfill:hourly-stats` accepte `--from-date=YYYY-MM-DD` pour reprendre après une
interruption. Sur un serveur distant, lance-les en arrière-plan : une déconnexion ne
doit pas couper le backfill, et un `timeout` autour de la commande le tronquerait
sans erreur visible.

## Contrôle de cohérence

Après un backfill, `avg_null` doit être égal à `peak_null`, avec 0 incohérence. Les
heures restées à `NULL` sont celles sans aucun ping réussi : il n'y avait rien à agréger.

```sql
SELECT count(*) FILTER (WHERE avg_player_count IS NULL) AS avg_null,
       count(*) FILTER (WHERE peak_player_count IS NULL) AS peak_null,
       count(*) FILTER (WHERE avg_player_count IS NULL
                          AND peak_player_count IS NOT NULL) AS incoherent
FROM server_stats_hourly;
```

## En local

`node ace db:seed` remplit les trois niveaux pour les serveurs de démo (voir
[CONTRIBUTING.md](../CONTRIBUTING.md)) : pas besoin de lancer les backfills.
