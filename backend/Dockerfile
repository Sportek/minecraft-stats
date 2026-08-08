# Version épinglée volontairement. `node:26` est un tag flottant : le 08/08/2026 il
# est passé à 26.7.0, où `node ace docs:generate` casse au boot d'Ace avec
# « Invalid command exported from "archive_old_partitions.js". Invalid URL » (Node
# 26.7 déprécie `module.register()`, utilisé par le loader TS d'AdonisJS). Le
# déploiement s'est mis à échouer sans le moindre changement de code — vérifié en
# rebuildant un commit antérieur, qui échoue aussi. 26.6.0 est la dernière version
# saine. À relever après une mise à jour d'AdonisJS qui gère les nouveaux hooks.
FROM node:26.6.0

WORKDIR /home/node/app

# Les images node:26 ne fournissent plus yarn ni corepack : on installe
# corepack via npm puis on l'active pour obtenir le yarn épinglé (packageManager).
RUN npm install -g corepack@latest && corepack enable

# On copie le package.json et on installe les dépendances
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
RUN yarn install --immutable

# On copie le reste du code
COPY . .

# Étape pour générer un fichier .env temporaire (peu importe les valeurs ici)
# La seule valeur qui importe, c'est NODE_ENV=production
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
    echo "LIMITER_STORE=database" >> .env && \
    echo "REDIS_HOST=redis" >> .env && \
    echo "REDIS_PORT=6379" >> .env && \
    echo "REDIS_PASSWORD=temporary_password" >> .env

# Générer la documentation
RUN mkdir -p build && \
    node ace docs:generate && \
    cp swagger.yml build/

# Nettoyer le fichier .env temporaire
RUN rm .env