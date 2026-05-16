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
