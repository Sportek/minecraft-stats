import type Server from '#models/server'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import ImageStorageService from '#services/image_storage_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Empreinte du favicon : sert à la fois à la détection de doublon et à décider
 * s'il faut réécrire l'image. On ne réuploade sur le stockage (S3 en prod) que si
 * le favicon a réellement changé — ou s'il n'existe pas encore. Réécrire des
 * octets identiques à chaque ping ne ferait que générer des PUT S3 inutiles (les
 * favicons ne changent quasi jamais), ce qui a dominé la facture AWS. Le hash
 * suffit donc à détecter les vrais changements.
 *
 * Mute le serveur sans le sauvegarder — l'appelant persiste.
 */
export async function storeFaviconIfChanged(server: Server, favicon?: string): Promise<void> {
  if (!favicon) return

  const faviconHash = DuplicateDetectionService.hashFavicon(favicon)

  // L'empreinte sert aussi à la détection de doublon : on la garde à jour.
  if (server.hasCustomImage) {
    server.faviconHash = faviconHash
    return
  }

  if (server.imageUrl && faviconHash === server.faviconHash) return

  try {
    server.imageUrl = await ImageStorageService.storeServerFavicon(server.id, favicon)
    server.faviconHash = faviconHash
  } catch (error) {
    // On n'avance pas faviconHash : le prochain ping retentera l'upload.
    logger.warn(
      { serverId: server.id, err: (error as Error).message },
      'SCHEDULER: image processing failed'
    )
  }
}
