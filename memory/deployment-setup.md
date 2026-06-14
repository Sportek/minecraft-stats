---
name: deployment-setup
description: How the Minecraft Stats frontend and backend are deployed (Dokploy)
metadata:
  type: project
---

Le projet est déployé via **Dokploy** (instance auto-hébergée sur `dokploy.gablandry.com`).

- **Backend** : workflow `.github/workflows/deploy-backend.yml` → build l'image `sportek/minecraft-stats-back`, push sur Docker Hub, puis déclenche un déploiement Dokploy via `compose.deploy` API.
- **Frontend** : pas de workflow GitHub dédié — déployé directement par Dokploy à partir du repo + `frontend/Dockerfile`.

⚠️ Les variables `NEXT_PUBLIC_*` sont injectées **au moment du build** (ARG → ENV dans le Dockerfile). Elles doivent être configurées dans l'onglet **Environment** de l'application frontend dans Dokploy, et un **rebuild/redéploiement** est requis pour qu'un changement prenne effet — un simple restart ne suffit pas. `.env.local` est gitignored et ne sert qu'au dev local.

**Réseau / Cloudflare :** tout le trafic prod passe **exclusivement par un tunnel `cloudflared`** — l'origine n'expose aucun port entrant public (cloudflared ouvre une connexion sortante vers Cloudflare). Conséquence sécurité : l'en-tête `CF-Connecting-IP` (clé de rate-limit dans `backend/start/limiter.ts` + `logger_middleware.ts`) **n'est pas spoofable** (réécrit par l'edge Cloudflare, origine injoignable en direct) — ne pas re-signaler comme faille (finding M5 de l'audit, classé « non applicable »). Hypothèse à préserver : le `80/443` de l'hôte ne doit pas être exposé publiquement, sinon on contournerait le tunnel. Voir l'audit de sécurité dans `code/docs/security-audit-2026-06-14.md`.
