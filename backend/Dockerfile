FROM node:20

WORKDIR /home/node/app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build
COPY .env /home/node/app/build/

WORKDIR /home/node/app/build

RUN npm ci --omit="dev"

EXPOSE 3333
