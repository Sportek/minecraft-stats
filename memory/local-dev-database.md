---
name: local-dev-database
description: Comment atteindre la base de dev locale — la commande docker de CLAUDE.md ne marche pas
metadata:
  type: project
---

**La ligne « Local DB » de `CLAUDE.md` est fausse** : `docker compose --env-file ./.env.development up -d`
échoue deux fois — `.env.development` n'existe pas (seulement `.env`), et surtout `backend/compose.yaml`
est la **stack de prod** (images `sportek/*` pré-construites, réseau externe `dokploy-network`) qui ne
contient **aucun service PostgreSQL**.

La base de dev est un **PostgreSQL natif installé sur la machine**, déjà en écoute sur `0.0.0.0:5432`
(`minecraft_stats` / `minecraft_stats` / base `minecraft_stats`, cf. `backend/.env`). Il n'y a rien à
démarrer : `node ace migration:run` et `node ace test` s'y connectent directement.

⚠️ Monter un conteneur Postgres sur le port 5432 **ne sert à rien et induit en erreur** : le Postgres
natif tient déjà l'IPv4, Docker ne récupère que l'IPv6 (`::`), et l'application continue de parler au
natif. Le `docker run -p 5432:5432` réussit sans que rien ne l'utilise.

Redis n'est pas lancé en local. `CacheService` dégrade proprement (log `CACHE: read failed, fallback
to fetcher`) et les tests passent — voir [[stats-rollups-backfill]] pour les paliers d'agrégation.

⚠️ **`node ace test` ne rend jamais la main en local** : à l'arrêt, `RedisProvider.shutdown` boucle sur
`connect ECONNREFUSED 127.0.0.1:6379` (FATAL toutes les ~1 s) et le récapitulatif final n'est jamais
imprimé. Les tests ont pourtant tourné : lire les `√` / `✖` dans la sortie, puis tuer le process. Ne
jamais piper dans `tail`, qui attend l'EOF et n'affiche donc rien du tout.

**Contournement** : monter un Redis jetable rend la suite complète propre (elle sort toute seule, avec
le récapitulatif, et on peut piper dans `tail`). Contrairement à Postgres, rien n'occupe le 6379, donc
le conteneur est bien utilisé. Le mot de passe doit correspondre à `REDIS_PASSWORD` de `backend/.env`.

```
docker run -d --name ms-redis-test -p 6379:6379 redis:7-alpine redis-server --requirepass minecraft_stats
node ace test          # 40 unit + 63 functional, ~4 s
docker rm -f ms-redis-test
```

La suite `unit` seule (`node ace test unit`) n'a besoin ni de Redis ni de données : elle sort en ~70 ms.

**Le dump local est daté** : `server_stats` s'arrête au **18/05/2026**, avec un gros trou après
juillet 2025 (4 relevés/serveur sur les 30 derniers jours du dump). Toute sonde ancrée sur `now()`
tombe donc dans le vide — viser une fenêtre dense comme juin 2025 (~4 400 relevés/serveur).

**Après tout `node ace`** (`migration:run`, `test`), le codegen réécrit `backend/database/schema.ts` et
`backend/.adonisjs/server/controllers.ts` **sans formatage**, ce qui pollue le diff sans changer le
contenu. Remettre en état avec `npx prettier --write` sur ces deux fichiers.
