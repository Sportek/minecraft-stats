import type { HostServerStats, HostStatsProvider } from './types.js'

/**
 * Endpoints publics, aucun token requis (le login Minehut ne donne accès qu'à
 * l'administration de ses propres serveurs, pas aux compteurs des autres).
 *
 * `/servers` ne liste que les serveurs EN LIGNE (~760 sur ~1470) et pèse ~540 Ko :
 * un seul appel couvre tous les serveurs d'un cycle de ping, mais il n'expose
 * aucun favicon. `?byName=true` coûte un appel par serveur (~10 Ko) et ramène en
 * plus l'icône et la MOTD réelle — d'où le mode `detailed` (cf. types.ts).
 */
const SERVERS_API = 'https://api.minehut.com/servers'
const SERVER_API = 'https://api.minehut.com/server/'

const FETCH_TIMEOUT_MS = 5000

/**
 * Durée de vie de l'instantané. Le pinger balaie ses serveurs dus en quelques
 * secondes : une minute suffit pour qu'un cycle entier ne coûte qu'un seul appel
 * à Minehut, tout en restant frais pour les ajouts/éditions interactifs.
 */
const SNAPSHOT_TTL_MS = 60_000

/** Suffixe des hôtes servis par le proxy Minehut. */
const HOST_SUFFIX = '.minehut.gg'

interface MinehutServersResponse {
  servers?: {
    name?: string
    motd?: string | null
    maxPlayers?: number | null
    playerData?: { playerCount?: number | null } | null
    versionMin?: string | null
    versionMax?: string | null
  }[]
}

interface MinehutServerResponse {
  server?: {
    online?: boolean
    playerCount?: number | null
    maxPlayers?: number | null
    motd?: string | null
    server_list_favicon?: string | null
  } | null
}

let snapshot: { fetchedAt: number; stats: Map<string, HostServerStats> } | null = null
let inFlight: Promise<Map<string, HostServerStats>> | null = null

/** Minehut expose une plage de versions, le plus souvent vide des deux côtés. */
function formatVersion(min?: string | null, max?: string | null): string | null {
  if (!min) return max ?? null
  if (!max || min === max) return min
  return `${min}-${max}`
}

async function fetchSnapshot(): Promise<Map<string, HostServerStats>> {
  const res = await fetch(SERVERS_API, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Minehut API responded ${res.status}`)

  const body = (await res.json()) as MinehutServersResponse

  const stats = new Map<string, HostServerStats>()
  for (const entry of body.servers ?? []) {
    if (!entry.name) continue
    stats.set(entry.name.toLowerCase(), {
      players: { online: entry.playerData?.playerCount ?? 0, max: entry.maxPlayers ?? 0 },
      motd: entry.motd ?? null,
      version: formatVersion(entry.versionMin, entry.versionMax),
      favicon: null,
    })
  }

  snapshot = { fetchedAt: Date.now(), stats }
  return stats
}

/**
 * Une clé absente de l'instantané = serveur hors-ligne. Une erreur réseau se
 * propage volontairement : mieux vaut un ping en échec (player_count NULL) qu'un
 * compteur inventé.
 */
async function loadSnapshot(): Promise<Map<string, HostServerStats>> {
  if (snapshot && Date.now() - snapshot.fetchedAt < SNAPSHOT_TTL_MS) return snapshot.stats

  // Un cycle de ping démarre 20 pings en parallèle : on partage le même appel.
  if (inFlight) return inFlight

  inFlight = fetchSnapshot()
  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

/** Fiche complète d'un serveur — seule source du favicon. Un appel par serveur. */
async function fetchDetails(key: string): Promise<HostServerStats | null> {
  const url = `${SERVER_API}${encodeURIComponent(key)}?byName=true`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Minehut API responded ${res.status}`)

  // Un nom inconnu renvoie `{"server": null}` en HTTP 200.
  const { server } = (await res.json()) as MinehutServerResponse
  if (!server?.online) return null

  return {
    players: { online: server.playerCount ?? 0, max: server.maxPlayers ?? 0 },
    // Le même champ que l'instantané, délibérément : la fiche expose aussi
    // `server_list_motd` (la MOTD réelle du serveur, en composant Chat), mais s'en
    // servir ici ferait osciller `motd_hash` entre deux valeurs selon le chemin de
    // ping. `motd` est en prime le champ que le propriétaire édite depuis le panel
    // Minehut, donc celui où chercher un jeton de vérification de propriété.
    motd: server.motd ?? null,
    // Cette fiche n'expose pas la version ; l'instantané `/servers` la couvre.
    version: null,
    favicon: server.server_list_favicon ?? null,
  }
}

const minehutProvider: HostStatsProvider = {
  id: 'minehut',

  resolveKey(address) {
    const host = address.trim().toLowerCase()
    if (!host.endsWith(HOST_SUFFIX)) return null

    // Le nom du serveur est le premier label — `thatbox.minehut.gg`, ou la
    // variante Bedrock `thatbox.bedrock.minehut.gg`. `minehut.gg` nu n'est le
    // sous-domaine de personne et reste donc pingué normalement.
    const [key] = host.slice(0, -HOST_SUFFIX.length).split('.')
    return key || null
  },

  async fetchStats(key, options) {
    if (options?.detailed) return fetchDetails(key)

    const stats = await loadSnapshot()
    return stats.get(key) ?? null
  },
}

export default minehutProvider
