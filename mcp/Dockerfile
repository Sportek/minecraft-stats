# syntax=docker/dockerfile:1

##########################################################################
# Étape 1 — build (compilation TypeScript)
##########################################################################
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

##########################################################################
# Étape 2 — runtime (dépendances de production uniquement)
##########################################################################
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /app/build ./build

# Tourne en utilisateur non-root (présent dans les images node officielles).
USER node

EXPOSE 3334

CMD ["node", "build/server.js"]
