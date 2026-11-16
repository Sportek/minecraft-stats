# Version épinglée volontairement (tag flottant `node:26` = déploiements non
# reproductibles). 26.12.1 : correctifs de sécurité du 21/10/2026.
#
# Depuis Node 26.7 (et 24.22), le parseur d'URL applique strictement WHATWG et
# `jsonschema` (utilisé par Ace pour valider les commandes) plantait au boot de
# `node ace docs:generate` (« Invalid command exported … Invalid URL »). Corrigé
# par `.yarn/patches/jsonschema-*.patch` tant qu'aucune version amont ne le fait.
FROM node:26.12.1 AS base

WORKDIR /home/node/app

# Les images node:26 ne fournissent plus yarn ni corepack : on installe
# corepack via npm puis on l'active pour obtenir le yarn épinglé (packageManager).
RUN npm install -g corepack@latest && corepack enable

# ---------------------------------------------------------------------------
# Build : compile le TypeScript et génère la doc OpenAPI.
# ---------------------------------------------------------------------------
FROM base AS builder

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/patches ./.yarn/patches
RUN yarn install --immutable

COPY . .

# `docs:generate` démarre l'application, qui valide son environnement : un .env
# factice suffit, seule NODE_ENV=production compte. Il n'est pas copié dans l'image
# finale (`node ace build` n'embarque pas le .env).
RUN echo "NODE_ENV=production" > .env && \
    echo "PORT=3333" >> .env && \
    echo "APP_KEY=QSKJDKOQWJDIQWJHDOIQWHJJDIQWUDHWIQDHIQHWID" >> .env && \
    echo "HOST=127.0.0.1" >> .env && \
    echo "LOG_LEVEL=info" >> .env && \
    echo "DB_HOST=localhost" >> .env && \
    echo "DB_PORT=5432" >> .env && \
    echo "DB_USER=default_user" >> .env && \
    echo "DB_DATABASE=default_db" >> .env && \
    echo "RESEND_API_KEY=default_key" >> .env && \
    echo "DISCORD_CLIENT_ID=default_client_id" >> .env && \
    echo "DISCORD_CLIENT_SECRET=default_client_secret" >> .env && \
    echo "GOOGLE_CLIENT_ID=default_google_id" >> .env && \
    echo "GOOGLE_CLIENT_SECRET=default_google_secret" >> .env && \
    echo "LIMITER_STORE=redis" >> .env && \
    echo "REDIS_HOST=redis" >> .env && \
    echo "REDIS_PORT=6379" >> .env && \
    echo "REDIS_PASSWORD=temporary_password" >> .env

# En production, `/swagger` sert le `swagger.json` pré-généré à la racine de
# l'application (AutoSwagger ne relit pas les sources quand NODE_ENV=production).
RUN node ace docs:generate && \
    node ace build && \
    cp swagger.yml swagger.json build/

# ---------------------------------------------------------------------------
# Image finale : le JavaScript compilé et les seules dépendances de production.
# Auparavant l'image lançait `node ace serve` (serveur de dev) sur les sources
# TypeScript, transpilées à la volée par ts-exec.
# ---------------------------------------------------------------------------
FROM base AS production

ENV NODE_ENV=production

COPY --from=builder /home/node/app/build ./
# `.yarnrc.yml` porte `nodeLinker: node-modules` (sans lui, Yarn passerait en PnP) ;
# les patches sont référencés par le lockfile.
COPY .yarnrc.yml ./
COPY .yarn/patches ./.yarn/patches
RUN yarn workspaces focus --production && yarn cache clean --all

CMD ["node", "bin/server.js"]
