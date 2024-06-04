FROM node:20

WORKDIR /home/node/app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3333
