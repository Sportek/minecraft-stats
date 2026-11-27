# Contribuer à Minecraft Stats

Merci de ton intérêt ! Ce guide explique comment lancer le projet en local et
comment proposer une modification.

- Une question, une idée ? Le [Discord](https://discord.gg/dGEqqPEaXP) ou une
  [issue](https://github.com/Sportek/minecraft-stats/issues).
- Avant un gros changement (nouvelle page, refonte, nouvelle dépendance), ouvre
  d'abord une issue pour en discuter : ça évite de travailler pour rien.
- Les issues marquées
  [`good first issue`](https://github.com/Sportek/minecraft-stats/labels/good%20first%20issue)
  sont un bon point de départ.
- Une faille de sécurité ne se signale **pas** en issue publique : voir [SECURITY.md](SECURITY.md).

## Prérequis

- **Node 26** (version dans [`.nvmrc`](.nvmrc) : `nvm use` ou `fnm use`).
- **Yarn 4** via Corepack : lance `corepack enable` une fois, `yarn` prendra alors
  la version épinglée par chaque `package.json`.
- **Docker**, seulement pour la stack complète (PostgreSQL et Redis).

Le dépôt contient trois applications indépendantes, chacune avec ses dépendances :
`frontend/` (Next.js), `backend/` (AdonisJS) et `mcp/` (serveur MCP).

## Parcours 1 : frontend seul (le plus rapide)

Pour travailler sur l'interface, pas besoin du backend : le frontend peut lire
l'API publique de production.

```bash
cd frontend
yarn install
cp .env.example .env.local
# Dans .env.local, commente le bloc « Backend local » et décommente « API publique ».
yarn dev
```

Le site tourne sur http://localhost:3000 avec les vraies données. C'est de la
lecture seule : la connexion, l'ajout de serveur et l'administration demandent
le backend local (parcours 2).

## Parcours 2 : stack complète

### 1. PostgreSQL et Redis

```bash
docker compose -f compose.dev.yaml up -d
```

Si les ports 5432 ou 6379 sont déjà pris sur ta machine :
`DEV_DB_PORT=5433 DEV_REDIS_PORT=6380 docker compose -f compose.dev.yaml up -d`,
puis reporte ces ports dans `backend/.env` à l'étape suivante.

### 2. Backend (http://localhost:9000)

```bash
cd backend
yarn install
cp .env.example .env
node ace generate:key      # remplit APP_KEY
node ace migration:run
node ace db:seed           # serveurs de démo avec 14 jours d'historique
yarn dev
```

`.env.example` est prêt pour `compose.dev.yaml`. Les clés Resend, Discord et
Google ont des valeurs factices : l'application démarre, seuls l'envoi d'emails et
la connexion OAuth ne marchent pas sans vraies clés.

Le seeder crée 8 serveurs fictifs avec leur historique, leurs agrégats horaires et
journaliers et leurs métriques de croissance. Tu peux le relancer : un serveur
déjà présent est ignoré.

La documentation de l'API est sur http://localhost:9000/docs.

### 3. Frontend (http://localhost:3000)

```bash
cd frontend
yarn install
cp .env.example .env.local   # pointe déjà sur le backend local
yarn dev
```

### Le scheduler (facultatif)

En production, `node ace scheduler:run` pingue chaque serveur toutes les
10 minutes. En local, tu n'en as besoin que si tu travailles sur la collecte :
les serveurs de démo ont des adresses en `.invalid`, ils apparaîtront hors ligne
après le premier ping.

## Avant d'ouvrir une PR

Lance les vérifications de l'application que tu as modifiée. La CI lance les
mêmes sur chaque PR (frontend et backend).

| Application | Commandes |
|---|---|
| `frontend/` | `yarn lint`, `yarn test` et `yarn build` |
| `backend/` | `yarn typecheck`, `yarn lint`, `yarn build`, `node ace docs:generate` et `yarn test` |
| `mcp/` | `yarn typecheck` et `yarn build` (pas encore dans la CI) |

- `yarn test` (backend) demande PostgreSQL et Redis (`compose.dev.yaml`). Chaque test
  tourne dans une transaction annulée à la fin : tes données de démo restent intactes.
- `node ace docs:generate` doit passer sans erreur : une annotation Swagger invalide
  casse le build de l'image Docker, donc le déploiement. Voir
  [docs/swagger-annotations.md](docs/swagger-annotations.md).

## Proposer la PR

- Une branche par sujet, depuis `staging` : `type/description-courte`
  (`fix/blog-article-isr`, `feat/server-search`).
- La PR vise **`staging`**. `main` reçoit `staging` lors des mises en production.
- Messages de commit et titre de PR au format
  [Conventional Commits](https://www.conventionalcommits.org/fr/), en français, à
  l'infinitif : `fix(blog): rétablir les pages d'article cassées par l'ISR`.
  Types : `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`.
- Remplis le modèle de PR : ce qui change, pourquoi, et comment tu l'as vérifié. Pour
  un changement visuel, ajoute une capture avant/après.

### Assistants IA

Tu peux utiliser Claude Code ou un autre assistant : [CLAUDE.md](CLAUDE.md) et les
skills de `.claude/skills/` décrivent les conventions du projet. Le code reste sous
ton nom : pas de trailer `Co-Authored-By` pour un assistant, pas de mention « généré
par », et des commits faits avec ta propre identité git. Le check CI
« Pas d'attribution IA » refuse la PR sinon.

## Pour aller plus loin

- [CLAUDE.md](CLAUDE.md) : architecture, patterns et conventions (en anglais).
- [docs/i18n.md](docs/i18n.md) : FR/EN, routing par domaine, catalogue de messages.
- [docs/stats-rollups.md](docs/stats-rollups.md) : les trois niveaux de stats.
- [mcp/README.md](mcp/README.md) : le serveur MCP.

En contribuant, tu acceptes que ton code soit publié sous la licence du projet
([GPL v3](LICENSE)).
