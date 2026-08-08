import minehutProvider from './minehut_provider.js'
import type { HostStatsProvider } from './types.js'

/**
 * Hébergeurs dont les stats se lisent via API plutôt que par ping direct (cf.
 * `./types.ts` pour le pourquoi). Ajouter un hébergeur = un fichier provider +
 * une entrée ici.
 */
const PROVIDERS: HostStatsProvider[] = [minehutProvider]

/** Le premier provider qui reconnaît l'adresse, avec la clé qu'il en a extraite. */
export function resolveHostProvider(
  address: string
): { provider: HostStatsProvider; key: string } | null {
  for (const provider of PROVIDERS) {
    const key = provider.resolveKey(address)
    if (key) return { provider, key }
  }
  return null
}

export type { HostServerStats, HostStatsProvider } from './types.js'
