# Backend — Minecraft Stats

AdonisJS 7 (TypeScript, Lucid) sur PostgreSQL, Redis pour le cache et le rate
limiting. Expose l'API REST `/api/v1` et fait tourner le scheduler qui pingue les
serveurs Minecraft.

## Développement local

```bash
docker compose -f ../compose.dev.yaml up -d   # PostgreSQL + Redis
yarn install
cp .env.example .env
node ace generate:key
node ace migration:run
node ace db:seed                              # serveurs de démo
yarn dev                                      # http://localhost:9000
```

Détails (ports déjà pris, variables d'environnement, scheduler) dans
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Commandes utiles

| Commande | Rôle |
|---|---|
| `yarn test` | Tests Japa (`tests/unit`, `tests/functional`), demande PostgreSQL et Redis |
| `node ace test unit` | Tests unitaires seuls, sans base ni Redis |
| `yarn typecheck` / `yarn lint` | Vérifications statiques |
| `node ace docs:generate` | Régénère la doc Swagger (`/docs`, `/swagger`) ; doit passer avant de pousser |
| `node ace make:migration <nom>` | Nouvelle migration (voir le skill `scaffolding-adonis-resources`) |
| `node ace scheduler:run` | Lance le scheduler (pings, rollups, croissance) |
| `node ace backfill:hourly-stats` puis `backfill:daily-stats` | Recalcule les agrégats, voir [docs/stats-rollups.md](../docs/stats-rollups.md) |

`compose.yaml` est la stack de **production** (images publiées, réseau Dokploy) : ne
pas l'utiliser en local.
