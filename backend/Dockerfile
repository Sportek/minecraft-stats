FROM node:20

WORKDIR /home/node/app

COPY package*.json ./
RUN npm install

COPY . .

# Installer supervisor
RUN apt-get update && apt-get install -y supervisor && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copier le fichier de configuration supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3333

CMD ["/usr/bin/supervisord"]