Commande pour lancer le backend en production :
`docker run --env-file .\backend\.env  -p 3333:3333 sportek/minecraft-stats-backend:production`

Commande pour lancer le frontend en production :
`docker run --env-file .\frontend\.env  -p 3000:3000 sportek/minecraft-stats-frontend:production`
