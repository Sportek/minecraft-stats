---
name: monitoring-argus
description: Le monitoring de minecraft-stats vit dans le dépôt argus (Desktop/Kubot/argus), plus dans le compose ; /metrics protégé par jeton
metadata:
  type: project
---

Depuis 2026-11 (PR #306), Grafana/Prometheus/Loki/Promtail ne sont plus dans `backend/compose.yaml`.
Tout passe par **Argus** : dépôt `Sportek/argus`, en local `C:\Users\Gabriel\Desktop\Kubot\argus`
(pas sur le bureau directement), stack Dokploy « Monitoring » (projet Argus) qui tourne sur publicvm,
Grafana sur `grafana.gablandry.com`, dashboard `monitoring/grafana/dashboards/minecraft-stats-api.json`.

- Argus scrape `api-prod` / `api-staging.minecraft-stats.fr:80` via le Traefik de wyvern **par
  Tailscale** (`extra_hosts` → 100.123.114.53), pas via Cloudflare.
- `GET /metrics` exige `Authorization: Bearer $METRICS_TOKEN` (middleware `metrics_auth_middleware`) ;
  la valeur doit correspondre à `MCSTATS_{PROD,STAGING}_METRICS_TOKEN` dans l'env de la stack Argus.
- Préfixe des métriques = `APP_NAME` (`prod_`, `dev_`), noms actuels `http_requests_total` + label `status`.
- Les logs des conteneurs minecraft-stats ne sont plus dans Loki (Loki d'Argus ne voit que publicvm).

**Why:** le Grafana embarqué était devenu injoignable (526) et dupliquait Argus.
**How to apply:** pour tout dashboard/alerte/scrape minecraft-stats, modifier le dépôt argus. Voir
[[deployment-setup]] et [[pinger-egress-host]].
