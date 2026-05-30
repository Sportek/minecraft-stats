# Minecraft Stats — Serveur MCP

Serveur [MCP (Model Context Protocol)](https://modelcontextprotocol.io) qui expose les
données **publiques en lecture seule** de Minecraft Stats à des agents IA (Claude,
ChatGPT, Cursor, VS Code, etc.).

Les tools sont **générés automatiquement depuis le spec OpenAPI** du backend : au
démarrage, le serveur récupère `GET ${API_BASE_URL}/swagger`, filtre les endpoints via
une allowlist publique, et crée un tool MCP par endpoint autorisé. Aucune duplication —
quand le backend évolue (`node ace docs:generate`), il suffit de redémarrer le MCP pour
que les tools se mettent à jour.

## Architecture

```
Client IA (Claude, etc.)
      │  MCP / Streamable HTTP
      ▼
┌─────────────────────┐   GET /swagger (au démarrage)
│  Serveur MCP (ce     │ ───────────────────────────────►┐
│  service, port 3334) │   proxy GET /api/v1/... (par appel) │
└─────────────────────┘ ◄───────────────────────────────┘
      ▲                          Backend AdonisJS
      │
  POST /mcp (stateless, JSON)
```

- **Transport** : Streamable HTTP (standard MCP actuel ; SSE est déprécié), mode
  **stateless** — un serveur + transport éphémères par requête, donc scalable sans état
  partagé.
- **Sécurité** : seuls les endpoints de [`PUBLIC_ENDPOINTS`](src/config.ts) (GET publics)
  deviennent des tools. Tout endpoint d'auth / admin / écriture du spec est ignoré, même
  ajouté plus tard. Le MCP n'a aucun accès à la base ni aux secrets — il relaie
  uniquement des requêtes HTTP de lecture vers le backend.

## Tools exposés

Générés depuis l'allowlist (12 actuellement) : `getServers`, `getServersPaginate`,
`getServersById`, `getServersByServerIdCategories`, `getServerStats`, `getGlobalStats`,
`getWebsiteStats`, `getCategories`, `getCategoriesById`, `getLanguages`, `getPosts`,
`getPostsBySlug`.

Les noms, descriptions et schémas de paramètres proviennent directement des annotations
OpenAPI du backend (`@summary`, `@description`, `@paramQuery`…), donc enrichir ces
annotations améliore aussi la qualité des tools MCP.

## Développement

```bash
yarn install
cp .env.example .env          # ajuster API_BASE_URL si besoin
yarn dev                       # tsx watch, nécessite le backend joignable
```

Vérifier la santé : `curl http://localhost:3334/health`

### Test sans base de données

Le dossier [`smoke/`](smoke/) contient un backend mock et un client MCP de test :

```bash
node smoke/mock-backend.mjs &           # sert le vrai swagger.json + endpoints stub sur :3399
API_BASE_URL=http://localhost:3399 yarn dev &
node smoke/test-client.mjs              # liste les tools et en appelle quelques-uns
```

### Inspecter avec l'outil officiel

```bash
yarn inspect                            # MCP Inspector → pointer sur http://localhost:3334/mcp
```

## Production

Build et image Docker :

```bash
yarn build                              # compile vers build/
yarn build:docker && yarn push:docker   # image sportek/minecraft-stats-mcp:latest
```

Le service est déclaré dans [`../backend/compose.yaml`](../backend/compose.yaml)
(`mcp`) et démarre après le backend. Variables d'environnement clés :

| Variable           | Rôle                                                        | Défaut                  |
| ------------------ | ----------------------------------------------------------- | ----------------------- |
| `API_BASE_URL`     | Backend à interroger                                        | `http://localhost:3333` |
| `OPENAPI_URL`      | Spec OpenAPI à charger                                      | `${API_BASE_URL}/swagger` |
| `PORT` / `HOST`    | Écoute du MCP                                               | `3334` / `0.0.0.0`      |
| `MCP_PATH`         | Chemin du endpoint MCP                                      | `/mcp`                  |
| `ALLOWED_HOSTS`    | Hôtes autorisés (protection DNS rebinding, prod)            | _(vide)_                |
| `ALLOWED_ORIGINS`  | Origines autorisées (protection DNS rebinding, prod)        | _(vide)_                |

En production, renseigner `ALLOWED_HOSTS` (ex. `mcp.minecraft-stats.fr`) active la
protection contre le DNS rebinding.

## Connecter un client (ex. Claude Code)

```bash
claude mcp add --transport http minecraft-stats https://mcp.minecraft-stats.fr/mcp
```

ou dans une config MCP JSON :

```json
{
  "mcpServers": {
    "minecraft-stats": {
      "type": "streamable-http",
      "url": "https://mcp.minecraft-stats.fr/mcp"
    }
  }
}
```

## Étendre l'allowlist

Pour exposer un nouvel endpoint public en lecture seule, ajouter sa clé
`get /api/v1/...` dans `PUBLIC_ENDPOINTS` ([src/config.ts](src/config.ts)) et
redémarrer. Le tool est généré automatiquement à partir de ses annotations OpenAPI.
