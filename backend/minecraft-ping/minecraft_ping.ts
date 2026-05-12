import { pingJava } from '@minescope/mineping'

/**
 * Timeout par défaut pour les pings périodiques. Court (3s) car un serveur Minecraft
 * sain répond en quelques centaines de ms. Si ça ne répond pas en 3s, on le marque
 * down et on passe au suivant — le prochain cycle réessaiera (cf. P.5.1 Niveau 1.2).
 */
export const DEFAULT_PING_TIMEOUT = 3000

/**
 * Timeout plus long pour les pings synchrones initiés par un utilisateur (création de
 * serveur, edit). Tolérant pour donner une chance à un serveur lent de répondre.
 */
export const INTERACTIVE_PING_TIMEOUT = 5000

export const pingMinecraftJava = async (
  address: string,
  port: number = 25565,
  timeout: number = DEFAULT_PING_TIMEOUT
) => {
  try {
    const data = await pingJava(address, { port, timeout })
    return data
  } catch (error) {
    throw new Error(error)
  }
}

export const isPingPossible = async (address: string, port: number = 25565) => {
  try {
    const data = await pingMinecraftJava(address, port, INTERACTIVE_PING_TIMEOUT)
    return !!data
  } catch (error) {
    console.error(error)
    return false
  }
}
