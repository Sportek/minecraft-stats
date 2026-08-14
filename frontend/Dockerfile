# syntax=docker.io/docker/dockerfile:1

FROM node:26-alpine AS base
# node:26 ne fournit plus yarn ni corepack : on installe corepack via npm puis
# on l'active pour obtenir le yarn épinglé (packageManager). Fait dans `base`
# pour que les étapes `deps` et `builder` en héritent.
RUN npm install -g corepack@latest && corepack enable

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* .yarnrc.yml* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --immutable; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for NEXT_PUBLIC_* variables
# These MUST be available at build time for Next.js to embed them in the client bundle
#
# TURNSTILE_SITE_KEY et ASSETS_URL manquaient ici. Ils fonctionnaient malgré tout
# parce que Dokploy buildait l'image lui-même : son option « create .env file »
# dépose un `.env` dans le contexte de build, que `.dockerignore` ne filtre pas
# (il n'exclut que `.env*.local`, `.env.development` et `.env.test`), et que le
# `COPY . .` ci-dessus embarque — Next le lit alors au build.
#
# Ce `.env` n'existe plus dès que l'image est construite ailleurs. Sans ces deux
# ARG, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` devient `undefined` dans un composant
# client (`components/form/turnstile.tsx` est en "use client"), donc le captcha
# casse — et le build reste vert.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_TAG_MANAGER
ARG NEXT_PUBLIC_MICROSOFT_CLARITY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_ASSETS_URL

# Convert build args to environment variables for the build process
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_TAG_MANAGER=$NEXT_PUBLIC_GOOGLE_TAG_MANAGER
ENV NEXT_PUBLIC_MICROSOFT_CLARITY=$NEXT_PUBLIC_MICROSOFT_CLARITY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_ASSETS_URL=$NEXT_PUBLIC_ASSETS_URL

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Copy standalone output (includes server.js and minimal dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static files (client-side assets)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]