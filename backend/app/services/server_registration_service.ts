import Server from '#models/server'
import type User from '#models/user'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import { type CreateServerValidator, type UpdateServerValidator } from '#validators/server'
import { deriveServerWebsite } from '#utils/server_website'
import {
  INTERACTIVE_PING_TIMEOUT,
  isPingPossible,
  pingMinecraftServer,
} from '../../minecraft-ping/minecraft_ping.js'
import type { NormalizedPing } from '../../minecraft-ping/minecraft_ping.js'

type CreateServerData = Awaited<ReturnType<typeof CreateServerValidator.validate>>
type UpdateServerData = Awaited<ReturnType<typeof UpdateServerValidator.validate>>
type Duplicate = NonNullable<Awaited<ReturnType<typeof DuplicateDetectionService.findDuplicate>>>

export type ServerRegisterResult =
  | { status: 'unreachable' }
  | { status: 'duplicate'; duplicate: Duplicate }
  | { status: 'created'; server: Server }

export type ServerUpdateResult = { status: 'unreachable' } | { status: 'updated'; server: Server }

/**
 * Orchestration de l'inscription et de la mise à jour d'un serveur — extraite du
 * controller pour être testable sans `HttpContext`. Regroupe au même endroit le
 * ping, le fingerprinting, la détection de doublon et la synchronisation de la
 * taxonomie (catégories / langues).
 *
 * NB : la création fait un ping complet (source des empreintes de doublon), tandis
 * que la mise à jour se contente d'un test de joignabilité booléen (`isPingPossible`).
 * Cette asymétrie est volontairement préservée à l'identique du comportement
 * historique — refaire un fingerprint à l'update rouvrirait la question de
 * l'auto-détection de doublon (un serveur détecté comme doublon de lui-même).
 */
export default class ServerRegistrationService {
  static async register(data: CreateServerData, user: User): Promise<ServerRegisterResult> {
    const type = data.type ?? 'java'

    // Ping interactif : test de joignabilité ET source des empreintes de doublon.
    let pingData: NormalizedPing | null = null
    try {
      // `detailed` : un seul serveur à traiter, on peut dépenser l'appel dédié qui
      // ramène le favicon d'un hébergeur mutualisé — c'est ici que l'icône et les
      // empreintes de doublon sont établies (cf. host_providers).
      pingData = await pingMinecraftServer(
        type,
        data.address,
        data.port,
        INTERACTIVE_PING_TIMEOUT,
        {
          detailed: true,
        }
      )
    } catch {
      pingData = null
    }
    if (!pingData) return { status: 'unreachable' }

    const fingerprint = await DuplicateDetectionService.fingerprint(
      data.address,
      data.port,
      pingData
    )
    const duplicate = await DuplicateDetectionService.findDuplicate(fingerprint)
    if (duplicate) return { status: 'duplicate', duplicate }

    const { categories, languages, ...dataToCreate } = data

    // Website : fourni par le propriétaire, sinon dérivé de l'adresse.
    const website = dataToCreate.website ?? deriveServerWebsite(data.address)

    const server = await Server.create({
      ...dataToCreate,
      type,
      website,
      version: fingerprint.version,
      faviconHash: fingerprint.faviconHash,
      resolvedEndpoint: fingerprint.resolvedEndpoint,
      motdHash: fingerprint.motdHash,
    })

    await server.related('categories').attach(await Server.resolveCategoryIds(categories))
    await server.related('languages').attach(await Server.resolveLanguageIds(languages))
    await server.related('user').associate(user)

    return { status: 'created', server }
  }

  static async update(server: Server, data: UpdateServerData): Promise<ServerUpdateResult> {
    const { categories, languages, ...dataToUpdate } = data

    // Si l'adresse change sans website explicite, on le re-dérive.
    if (dataToUpdate.website === undefined && data.address) {
      const derived = deriveServerWebsite(data.address)
      if (derived) dataToUpdate.website = derived
    }

    const successPing = await isPingPossible(
      data.type ?? server.type,
      data.address ?? server.address,
      data.port ?? server.port
    )
    if (!successPing) return { status: 'unreachable' }

    if (categories) {
      await server.related('categories').sync(await Server.resolveCategoryIds(categories))
    }
    if (languages) {
      await server.related('languages').sync(await Server.resolveLanguageIds(languages))
    }

    const saved = await server.merge(dataToUpdate).save()
    return { status: 'updated', server: saved }
  }
}
