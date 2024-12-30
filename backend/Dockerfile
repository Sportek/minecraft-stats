FROM node:20

WORKDIR /home/node/app

# On copie le package.json et on installe les dépendances
COPY package.json ./
RUN npm ci

# On copie le reste du code
COPY . .

# On génère la documentation Swagger
RUN node ace docs:generate && \
    cp swagger.yml build/