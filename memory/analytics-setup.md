---
name: analytics-setup
description: Comment l'analytics (GA4, GTM, Clarity, Umami) est branché sur Minecraft Stats
metadata:
  type: project
---

Le tracking du site est branché ainsi :

- **GTM** : conteneur `GTM-TK8SWP7K`, chargé sur `minecraft-stats.fr` ET `.com` via `<GoogleTagManager>` dans `frontend/src/app/layout.tsx`. Variable `NEXT_PUBLIC_GOOGLE_TAG_MANAGER` (build arg Dokploy — voir [[deployment-setup]]).
- **GA4** : piloté depuis GTM (balise « GA4 - Google tag »). ⚠️ Le bon ID de mesure est **`G-MV3LTQ1TF6`**. `G-V88FF5BD5J` est un mauvais ID (renvoie 404 sur `gtag/js`) — ne plus jamais l'utiliser.
- `NEXT_PUBLIC_GOOGLE_ANALYTICS` dans le `.env` = variable **morte**, aucun code ne l'utilise (le `<GoogleAnalytics>` a été retiré du code il y a des mois).
- **TarteAuCitron** : était une balise HTML dans GTM (consentement + AdSense `pub-8187816142581559`) ; mise **en pause** dans GTM.
- **Microsoft Clarity** (`microsoft-clarity.tsx`) et **Umami** (`umami-script.tsx`) sont chargés en direct dans le code, hors GTM.

Objectif en cours : séparer les stats `.fr` vs `.com` dans GA4 via la dimension `Hostname` (1 flux unique, comparaisons enregistrées).
