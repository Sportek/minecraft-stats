FROM node:20

WORKDIR /home/node/app

# On copie le package.json et on installe les dépendances
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

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