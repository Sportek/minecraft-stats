#!/bin/bash

# Variables
CONTAINER_NAME="stats-pgsql-prod"          # Nom du conteneur Docker
DB_HOST="localhost"                        # Hôte de la base de données (généralement localhost pour Docker)
DB_PORT="5432"                             # Port PostgreSQL
DB_USER=$DB_USER                           # Utilisateur de la base
DB_PASSWORD=$DB_PASSWORD                   # Mot de passe de la base
DB_NAME=$DB_NAME                           # Nom de la base de données
BACKUP_DIR="/home/minecraft-stats/backups" # Répertoire pour les sauvegardes
DATE=$(date +%Y-%m-%d_%H-%M-%S)            # Date et heure actuelles
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql" # Nom du fichier de sauvegarde

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Configurer le fichier .pgpass pour gérer le mot de passe
PGPASS_FILE="/root/.pgpass"
echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD" > $PGPASS_FILE
chmod 600 $PGPASS_FILE

# Effectuer le dump de la base de données
docker exec -t $CONTAINER_NAME pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

# Vérifier si la sauvegarde a réussi
if [ $? -eq 0 ]; then
  echo "Sauvegarde réussie : $BACKUP_FILE"
else
  echo "Erreur lors de la sauvegarde."
  rm -f $BACKUP_FILE # Supprimer le fichier si la sauvegarde a échoué
fi

# Nettoyer le fichier .pgpass pour des raisons de sécurité
rm -f $PGPASS_FILE
