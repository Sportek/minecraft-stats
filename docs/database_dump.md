## Sauvegarde régulière des données

Effectuée par une cron job sur le serveur (toutes les semaines le dimanche à minuit).
Accessible avec la commande `crontab -e`

```bash
0 0 * * 0 /home/minecraft-stats/backup.sh
```

Le script `backup.sh` est accessible depuis le repo.


### Restauration des données

```bash
psql -h <host> -U <username> -d <dbname> -f /path/to/your/dump.sql
```

Avec le fichier de sauvegarde dans le répertoire `/home/minecraft-stats/backups`
