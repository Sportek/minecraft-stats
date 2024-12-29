Pour du développement en local, vous pouvez utiliser le fichier `docker-compose.override.yml`.

```yml
services:
  pgsql:
    ports:
      - '5432:5432'  # Expose le port PostgreSQL pour un accès local

  adonis_app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
    env_file:
      - .env.development
    volumes:
      - ./backend:/home/node/app  # Monte le code source local
      - /home/node/app/node_modules  # Empêche les conflits entre les dépendances locales et du conteneur
    command: npm run dev  # Commande pour exécuter le serveur en mode développement
    ports:
      - '9000:9000'
    depends_on:
      - pgsql

  adonis_scheduler:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
    env_file:
      - .env.development
    command: 'node ace scheduler:run'
    depends_on:
      - pgsql
      - adonis_app
    volumes:
      - ./backend:/home/node/app  # Monte le code source local
      - /home/node/app/node_modules
```

Vous pouvez utiliser la commande suivante :

```bash
docker compose --env-file ./.env.development up -d
```
