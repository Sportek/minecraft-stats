---
name: pinger-egress-host
description: Le scheduler de ping tourne sur wyvern (IP de sortie 72.61.195.6) — méthode pour diagnostiquer un serveur « injoignable »
metadata:
  type: project
---

Le scheduler qui ping les serveurs Minecraft (`stats-scheduler-prod` sur l'hôte SSH **wyvern**,
`srv1153686`) sort avec l'IP publique **72.61.195.6** — le conteneur partage l'IP de l'hôte, pas de
NAT/VPN intermédiaire. C'est cette IP que voient les serveurs pingés, et donc celle à faire
whitelister quand un réseau nous bloque.

**Playbook « un serveur ne répond plus depuis une date précise »** : ne pas chercher un bug dans
`minecraft-ping/` en premier. Comparer les points de sortie — les autres hôtes du tailnet
(`golem`, `gremlin`, `publicvm`) et la machine locale servent de témoins :

```
ssh wyvern 'timeout 8 bash -c "cat < /dev/null > /dev/tcp/<ip>/<port>" && echo OK || echo FAIL'
```

Si ça passe partout sauf depuis wyvern, **ne pas conclure trop vite à un ban côté serveur distant** :
wyvern est un VPS **Hostinger (AS47583, `srv1153686.hstgr.cloud`)**, et Hostinger pose des
null-routes ciblées sur certaines IP de destination. Le trafic meurt alors *dans leur réseau*, sans
jamais atteindre la cible — le serveur distant ne voit rien et n'a rien bloqué.

Test décisif : comparer le traceroute TCP vers la cible KO et vers une IP voisine qui marche.

```
ssh wyvern 'mtr -T -P <port> -n -c 2 -r -m 30 <ip>'
```

Chemin normal depuis wyvern : `169.254.0.1 → 172.17.1.145 → 2.25.25.11 → 2.25.25.1/.2 → transit`.
Une cible null-routée part vers `2.25.25.12` et meurt au hop suivant, de façon **déterministe**
(rejouer 5-6 fois : si c'est toujours le même hop 3 et toujours mort, ce n'est pas un aléa d'ECMP).
Dans ce cas la seule issue est un ticket Hostinger, ou faire sortir le ping par un autre hôte.

⚠️ Deux faux positifs classiques dans ce diagnostic :
- **Tester un port fermé pour tout le monde** (80/443 sur un hôte Minecraft) ne prouve rien — il
  faut comparer le *même* port depuis un hôte témoin.
- **ICMP est filtré partout** (OVH & co) : 100 % de perte au `ping` n'indique jamais un blocage.
- Un domaine sans record A mais avec un SRV (ex. `mc-central.net`) échoue en `/dev/tcp` alors que
  le pinger, lui, résout le SRV correctement.

Voir [[deployment-setup]].
