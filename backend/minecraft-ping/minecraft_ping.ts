import { pingBedrock, pingJava } from '@minescope/mineping'
import type { ServerType } from '../app/constants/server_type.js'

/**
 * Timeout par défaut pour les pings périodiques. 5s : laisse une chance aux serveurs
 * géographiquement lointains (Asie, Amérique du Sud) ou derrière Cloudflare/anti-DDoS.
 * Si ça ne répond pas en 5s, on le marque down et le prochain cycle réessaiera
 * (cf. P.5.1 — la cadence différentielle finira par classer les morts en "dead" 6h).
 */
export const DEFAULT_PING_TIMEOUT = 5000

/**
 * Timeout plus long pour les pings synchrones initiés par un utilisateur (création de
 * serveur, edit). Tolérant pour donner une chance à un serveur lent de répondre.
 */
export const INTERACTIVE_PING_TIMEOUT = 5000

/**
 * Forme de ping normalisée commune aux deux éditions. Les réponses brutes de
 * `@minescope/mineping` diffèrent (Java expose `version.name`, `description`, un
 * favicon ; Bedrock expose `version.minecraft`, `name`, et aucun favicon). Les
 * appelants (scheduler, controller, détection de doublon) ne dépendent que de ces
 * champs, donc on aplatit les deux protocoles vers cette structure unique.
 */
export interface NormalizedPing {
  players: { online: number; max: number }
  version: { name: string }
  // Absent en Bedrock : le pong RakNet ne contient pas d'icône de serveur.
  favicon?: string
  description?: unknown
}

/**
 * Ping un serveur Minecraft de l'édition donnée et renvoie une réponse normalisée.
 * Rejette si le serveur est injoignable (timeout, refus de connexion…).
 */
export const pingMinecraftServer = async (
  type: ServerType,
  address: string,
  port: number,
  timeout: number = DEFAULT_PING_TIMEOUT
): Promise<NormalizedPing> => {
  if (type === 'bedrock') {
    const data = await pingBedrock(address, { port, timeout })
    return {
      players: { online: data.players.online, max: data.players.max },
      version: { name: data.version.minecraft },
      // Pas de favicon en Bedrock ; le nom du MOTD sert d'empreinte de doublon.
      description: data.name,
    }
  }

  const data = await pingJava(address, { port, timeout })
  return {
    players: { online: data.players?.online ?? 0, max: data.players?.max ?? 0 },
    version: { name: data.version.name },
    favicon: data.favicon,
    description: data.description,
  }
}

export const isPingPossible = async (
  type: ServerType,
  address: string,
  port: number
): Promise<boolean> => {
  try {
    await pingMinecraftServer(type, address, port, INTERACTIVE_PING_TIMEOUT)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
