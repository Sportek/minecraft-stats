FROM node:20

# On se déplace dans le /home/node/app
WORKDIR /home/node/app

# On copie le package.json et on installe les dépendances
COPY package.json ./
RUN npm install

# On copie le reste du code
COPY . .

# On expose le port 3333
EXPOSE 3333
