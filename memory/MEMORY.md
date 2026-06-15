# Memory Index

- [Deployment setup](deployment-setup.md) — déployé via Dokploy ; NEXT_PUBLIC_* = build args (rebuild requis) ; trafic via tunnel cloudflared → CF-Connecting-IP non spoofable
- [Analytics setup](analytics-setup.md) — GA4 via GTM ; bon ID de mesure = G-MV3LTQ1TF6 (G-V88FF5BD5J est invalide)
- [Plan système de publicités](advertising-feature-plan.md) — feature pubs maison + panel admin + stats, phasée
- [Créer une publicité](advertising-ad-creation-steps.md) — étapes + conventions HTML/CSS pour ajouter une pub dans le panel admin
- [Serveur MCP](mcp-server.md) — service mcp/ auto-généré depuis OpenAPI ; live sur mcp-staging.minecraft-stats.fr ; gotchas YAML + healthcheck IPv6
