---
name: mcp-server
description: Serveur MCP (Model Context Protocol) — service mcp/, URLs live, gotchas de déploiement
metadata:
  type: reference
---

Le dossier `mcp/` est un service Node/TypeScript autonome exposant l'API publique en
lecture seule aux agents IA via MCP (transport Streamable HTTP, mode stateless). Les
tools sont générés au démarrage depuis le spec OpenAPI live du backend (`/swagger`),
filtrés par l'allowlist `PUBLIC_ENDPOINTS` dans `mcp/src/config.ts`. CI : `deploy-mcp.yml`
(calque de `deploy-backend.yml`).

**URLs live (staging)** : `https://mcp-staging.minecraft-stats.fr/mcp` et `.com/mcp`
(health : `/health`). Exposé via Dokploy → service `mcp` port 3334.

**Deux gotchas rencontrés (corrigés, mais à retenir) :**
- L'endpoint `/swagger` d'AutoSwagger sert du **YAML**, pas du JSON → parser avec `yaml`.
- Healthcheck Docker : viser **127.0.0.1**, pas `localhost` (qui résout en IPv6 `::1`
  dans Alpine alors que le serveur écoute en IPv4 `0.0.0.0` → unhealthy → 404 Traefik).

Voir [[deployment-setup]].
