# syntax=docker/dockerfile:1

##########################################################################
# Étape 1 — build (compilation TypeScript)
##########################################################################
FROM node:26-alpine AS builder

WORKDIR /app

# node:26 ne fournit plus corepack : on l'installe via npm avant de l'activer.
RUN npm install -g corepack@latest && corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

##########################################################################
# Étape 2 — runtime (dépendances de production uniquement)
##########################################################################
FROM node:26-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# node:26 ne fournit plus corepack : on l'installe via npm avant de l'activer.
RUN npm install -g corepack@latest && corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
# Yarn 4 a retiré `--production` : on utilise `workspaces focus --production`
# (plugin workspace-tools intégré) pour n'installer que les deps de prod.
RUN yarn workspaces focus --production && yarn cache clean

COPY --from=builder /app/build ./build

# Tourne en utilisateur non-root (présent dans les images node officielles).
USER node

EXPOSE 3334

CMD ["node", "build/server.js"]
