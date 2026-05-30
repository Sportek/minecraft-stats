/*
|--------------------------------------------------------------------------
| Configuration du serveur MCP
|--------------------------------------------------------------------------
|
| Toute la configuration provient de variables d'environnement, avec des
| valeurs par défaut adaptées au développement local.
|
*/

function env(key: string, fallback?: string): string {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (fallback === undefined) {
      throw new Error(`Variable d'environnement manquante : ${key}`)
    }
    return fallback
  }
  return value
}

/**
 * URL de base de l'API Minecraft Stats (sans slash final).
 * En production / Docker, pointe vers le service backend (ex: http://adonis_app:3333).
 */
export const API_BASE_URL = env('API_BASE_URL', 'http://localhost:3333').replace(/\/+$/, '')

/**
 * URL du spec OpenAPI à charger au démarrage. Par défaut l'endpoint /swagger du backend,
 * ce qui garantit que les tools MCP restent toujours synchronisés avec l'API réelle.
 */
export const OPENAPI_URL = env('OPENAPI_URL', `${API_BASE_URL}/swagger`)

/** Port d'écoute du serveur MCP. */
export const PORT = Number.parseInt(env('PORT', '3334'), 10)

/** Interface d'écoute. */
export const HOST = env('HOST', '0.0.0.0')

/** Chemin HTTP du endpoint MCP (transport Streamable HTTP). */
export const MCP_PATH = env('MCP_PATH', '/mcp')

/** Timeout (ms) pour les appels en proxy vers le backend. */
export const PROXY_TIMEOUT_MS = Number.parseInt(env('PROXY_TIMEOUT_MS', '15000'), 10)

/**
 * Protection contre le DNS rebinding. En production, renseigne les hôtes/origines
 * autorisés (séparés par des virgules) pour rejeter les requêtes usurpées.
 * Laisser vide désactive la protection (utile en dev local).
 */
const allowedHostsRaw = env('ALLOWED_HOSTS', '')
const allowedOriginsRaw = env('ALLOWED_ORIGINS', '')
export const ALLOWED_HOSTS = allowedHostsRaw ? allowedHostsRaw.split(',').map((s) => s.trim()) : []
export const ALLOWED_ORIGINS = allowedOriginsRaw
  ? allowedOriginsRaw.split(',').map((s) => s.trim())
  : []
export const ENABLE_DNS_REBINDING_PROTECTION = ALLOWED_HOSTS.length > 0 || ALLOWED_ORIGINS.length > 0

/**
 * Allowlist explicite des endpoints exposés en tant que tools MCP.
 *
 * C'est la frontière de sécurité du serveur : SEULS ces endpoints (publics, en
 * lecture seule) sont transformés en tools. Tout endpoint d'authentification,
 * d'administration ou d'écriture présent dans le spec OpenAPI est ignoré, même
 * s'il est ajouté plus tard au backend.
 *
 * Format des clés : `${method} ${path}` (méthode en minuscules, chemin tel quel
 * dans le spec OpenAPI, avec les paramètres entre accolades).
 */
export const PUBLIC_ENDPOINTS: ReadonlySet<string> = new Set([
  'get /api/v1/servers',
  'get /api/v1/servers/paginate',
  'get /api/v1/servers/{id}',
  'get /api/v1/servers/{server_id}/categories',
  'get /api/v1/servers/{server_id}/stats',
  'get /api/v1/global-stats',
  'get /api/v1/website-stats',
  'get /api/v1/categories',
  'get /api/v1/categories/{id}',
  'get /api/v1/languages',
  'get /api/v1/posts',
  'get /api/v1/posts/{slug}',
])

/** Métadonnées du serveur MCP exposées aux clients. */
export const SERVER_INFO = {
  name: 'minecraft-stats',
  version: '1.0.0',
} as const
