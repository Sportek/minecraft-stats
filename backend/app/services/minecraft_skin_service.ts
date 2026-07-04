import MinecraftPlayer from '#models/minecraft_player'
import ImageStorageService from '#services/image_storage_service'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

const MOJANG_PROFILE_API = 'https://api.mojang.com/users/profiles/minecraft/'
const SESSION_PROFILE_API = 'https://sessionserver.mojang.com/session/minecraft/profile/'

// Timeouts serrés : la résolution est best-effort et ne doit jamais faire traîner
// un vote si Mojang est lent ou indisponible.
const PROFILE_TIMEOUT_MS = 2500
const SKIN_TIMEOUT_MS = 2500

interface ResolvedPlayer {
  uuid: string | null
  username: string
  headPath: string | null
}

interface MojangTextures {
  textures?: { SKIN?: { url?: string } }
}

/**
 * Résolution best-effort d'un pseudo Minecraft via l'API publique Mojang, et
 * rendu/hébergement maison de la tête du joueur (skin → visage + chapeau, cf.
 * `ImageStorageService.storePlayerHead`). Aucune dépendance à un service tiers de
 * rendu de têtes ; on ne bloque jamais un vote si Mojang échoue.
 */
export default class MinecraftSkinService {
  /**
   * Résout un pseudo en `{ uuid, name }` officiel. Renvoie `null` si le pseudo
   * n'existe pas ou si Mojang est injoignable — le vote reste alors valide, sans
   * enrichissement.
   */
  static async resolveProfile(username: string): Promise<{ uuid: string; name: string } | null> {
    try {
      const res = await fetch(`${MOJANG_PROFILE_API}${encodeURIComponent(username)}`, {
        signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
      })
      if (res.status !== 200) return null

      const body = (await res.json()) as { id?: string; name?: string }
      if (!body.id || !body.name) return null

      return { uuid: body.id, name: body.name }
    } catch (error) {
      logger.warn(
        { username, err: error instanceof Error ? error.message : String(error) },
        'MOJANG: failed to resolve profile'
      )
      return null
    }
  }

  /**
   * Récupère l'URL du skin (session server) et rend la tête si elle a changé.
   * Best-effort : toute erreur est loggée sans se propager. Mute
   * `head_path`/`texture_hash` sans sauvegarder — l'appelant persiste.
   */
  static async ensureHead(player: MinecraftPlayer): Promise<void> {
    try {
      const skinUrl = await this.fetchSkinUrl(player.uuid)
      if (!skinUrl) return

      // Le dernier segment de l'URL est le hash de texture : URL stable ⇒ skin
      // inchangé ⇒ pas de re-rendu.
      const textureHash = skinUrl.split('/').pop() ?? null
      if (textureHash && textureHash === player.textureHash && player.headPath) return

      const res = await fetch(skinUrl, { signal: AbortSignal.timeout(SKIN_TIMEOUT_MS) })
      if (!res.ok) return

      const buffer = Buffer.from(await res.arrayBuffer())
      player.headPath = await ImageStorageService.storePlayerHead(player.uuid, buffer)
      player.textureHash = textureHash
    } catch (error) {
      logger.warn(
        { uuid: player.uuid, err: error instanceof Error ? error.message : String(error) },
        'MOJANG: failed to render player head'
      )
    }
  }

  /**
   * Résout le pseudo, met à jour/insère la ligne `minecraft_players`, rend la tête
   * si nécessaire et renvoie l'UUID + le chemin de la tête. Renvoie `headPath:
   * null` si Mojang ne connaît pas le pseudo (le front affiche alors un repli).
   */
  static async resolveAndCache(username: string): Promise<ResolvedPlayer> {
    const profile = await this.resolveProfile(username)
    if (!profile) return { uuid: null, username, headPath: null }

    const player = await MinecraftPlayer.updateOrCreate(
      { uuid: profile.uuid },
      { uuid: profile.uuid, username: profile.name }
    )

    // On ne re-sollicite Mojang pour le skin que si la tête manque ou date de plus
    // de 6 h : évite un appel réseau (et sa latence) à chaque vote d'un habitué.
    const stale =
      !player.headPath ||
      player.resolvedAt === null ||
      player.resolvedAt < DateTime.now().minus({ hours: 6 })
    if (stale) {
      await this.ensureHead(player)
      // Dater la tentative même sans skin custom ou sur échec Mojang : sinon
      // chaque vote de ce joueur relancerait l'appel session server (jusqu'à
      // 2,5 s de latence) au lieu d'une fois par 6 h.
      player.resolvedAt = DateTime.now()
      await player.save()
    }

    return { uuid: profile.uuid, username: profile.name, headPath: player.headPath }
  }

  /**
   * Décode la propriété `textures` (base64 JSON) du session profile et en extrait
   * l'URL du skin. `null` si le joueur n'a pas de skin custom ou en cas d'erreur.
   */
  private static async fetchSkinUrl(uuid: string): Promise<string | null> {
    const res = await fetch(`${SESSION_PROFILE_API}${uuid}`, {
      signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
    })
    if (!res.ok) return null

    const body = (await res.json()) as { properties?: { name: string; value: string }[] }
    const texturesProp = body.properties?.find((p) => p.name === 'textures')
    if (!texturesProp) return null

    const decoded = JSON.parse(Buffer.from(texturesProp.value, 'base64').toString('utf8'))
    return (decoded as MojangTextures).textures?.SKIN?.url ?? null
  }
}
