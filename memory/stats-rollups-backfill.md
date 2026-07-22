---
name: stats-rollups-backfill
description: Paliers d'agrégation des stats (brut/horaire/journalier) et procédure de backfill sur wyvern
metadata:
  type: project
---

Les stats de joueurs sont lues sur **trois paliers**, choisis par `StatsService.pickSource()` :
`server_stats` (brut) → `server_stats_hourly` → `server_stats_daily`. Chaque ligne de rollup
porte `avg_player_count`, `peak_player_count`, `min_player_count`, `max_slot_count`, `samples_count`.

⚠️ `max_slot_count` est la **capacité en slots**, pas un nombre de joueurs. Elle s'appelait
`max_player_count` avant juillet 2026, ce qui avait fait croire qu'un pic était déjà stocké —
il ne l'était pas.

**Toute migration qui ajoute une colonne de rollup impose de rejouer les backfills**, sinon la
colonne reste `NULL` sur tout l'historique (l'API dégrade alors sur `playerCount`, jamais faux
mais plat). L'ordre compte : le journalier lit l'horaire, pas le brut.

```
ssh wyvern
docker exec -d stats-backend-prod sh -c "node ace backfill:hourly-stats > /tmp/bf-h.log 2>&1"
# attendre "Backfill done" — ~1 h sur 28 M lignes brutes (juillet 2026)
docker exec -d stats-backend-prod sh -c "node ace backfill:daily-stats  > /tmp/bf-d.log 2>&1"
# ~30 s
```

Conteneurs : `stats-backend-prod` / `stats-backend-dev` (staging), bases PostgreSQL **distinctes**
(`minecraft-stats-postgres-jxfsd3` en prod, `-lgzajp` en staging). Toujours lancer en détaché
(`-d`) : une déconnexion SSH tuerait un backfill attaché. Ne pas utiliser `timeout N` autour de la
commande — ça tronque silencieusement le backfill en laissant croire qu'il a réussi.

**Contrôle de cohérence** après backfill — `avg_null` doit égaler `peak_null` avec 0 incohérence.
Les pics `NULL` restants (~24 %) sont les heures sans aucun ping réussi, où il n'y a rien à agréger :

```sql
SELECT count(*) FILTER (WHERE avg_player_count IS NULL) avg_null,
       count(*) FILTER (WHERE peak_player_count IS NULL) peak_null,
       count(*) FILTER (WHERE avg_player_count IS NULL
                          AND peak_player_count IS NOT NULL) incoherent
FROM server_stats_hourly;
```

Les migrations tournent seules au démarrage du conteneur (`backend/compose.yaml` :
`node ace migration:run --force && node ace serve`) — voir [[deployment-setup]].
