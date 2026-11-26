# Sécurité

## Signaler une faille

Ne signale **pas** une faille dans une issue publique, une PR ou sur Discord.

Utilise le signalement privé de GitHub :
[**Report a vulnerability**](https://github.com/Sportek/minecraft-stats/security/advisories/new)
(onglet *Security* du dépôt). Seuls les mainteneurs voient le rapport.

Indique si possible :
- ce qui est touché (page, endpoint de l'API, serveur MCP) ;
- comment reproduire, avec une preuve de concept minimale ;
- l'impact que tu envisages.

Tu recevras une réponse sous 7 jours. Merci de laisser le temps de corriger avant
toute publication.

## Périmètre

- Le site : minecraft-stats.fr et minecraft-stats.com
- L'API : api.minecraft-stats.fr et api.minecraft-stats.com
- Le serveur MCP : mcp.minecraft-stats.fr et mcp.minecraft-stats.com
- Le code de ce dépôt

Hors périmètre : les attaques par déni de service ou par volume, l'ingénierie sociale,
et les serveurs Minecraft référencés (ils appartiennent à des tiers).

Pour tester, lance le projet en local ([CONTRIBUTING.md](CONTRIBUTING.md)) plutôt
que de viser la production.
