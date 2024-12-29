FROM node:20

WORKDIR /home/node/app

# On copie le package.json et on installe les dépendances
COPY package.json ./
RUN npm install

# On copie le reste du code
COPY . .