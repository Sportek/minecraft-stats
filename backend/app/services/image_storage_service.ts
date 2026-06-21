import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

/**
 * Taille max d'un favicon accepté. Un favicon Minecraft légitime est un PNG
 * 64x64 de quelques Ko ; les octets proviennent d'un serveur distant
 * (attaquant-contrôlé), donc on borne pour éviter le décodage d'un blob géant.
 */
const MAX_FAVICON_BYTES = 128 * 1024

/**
 * Taille max d'un avatar rapatrié depuis une URL distante (provider OAuth). Les
 * octets viennent d'une source externe, donc on borne avant de décoder.
 */
const MAX_REMOTE_AVATAR_BYTES = 5 * 1024 * 1024

/**
 * Centralise tout le stockage d'images (favicons, blog, avatars) : conversion
 * Sharp + écriture via Drive. Le driver effectif (disque local en dev, S3 en
 * prod) est choisi par la config `config/drive.ts` ; ce service ignore où les
 * octets atterrissent et renvoie toujours un chemin relatif host-agnostique
 * (`/images/...`) que le frontend résout via son URL d'assets (CDN/S3 ou backend).
 */
class ImageStorageService {
  private get disk() {
    return drive.use()
  }

  /**
   * Stocke le favicon d'un serveur (base64 issu du ping) en PNG brut + WebP
   * optimisé 64x64. Lève si le base64 décodé dépasse MAX_FAVICON_BYTES.
   * Retourne le chemin relatif sans extension (le frontend ajoute `.webp`/`.png`).
   */
  async storeServerFavicon(serverId: number, faviconBase64: string): Promise<string> {
    const base64Data = faviconBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.byteLength > MAX_FAVICON_BYTES) {
      throw new Error(`favicon too large: ${buffer.byteLength} bytes (max ${MAX_FAVICON_BYTES})`)
    }

    const webp = await sharp(buffer, { limitInputPixels: 16_384 * 16_384, failOn: 'error' })
      .resize(64, 64, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp')
      .toBuffer()

    const cacheControl = 'public, max-age=3600'
    await Promise.all([
      this.disk.put(`images/servers/${serverId}.png`, buffer, {
        contentType: 'image/png',
        cacheControl,
      }),
      this.disk.put(`images/servers/${serverId}.webp`, webp, {
        contentType: 'image/webp',
        cacheControl,
      }),
    ])

    return `/images/servers/${serverId}`
  }

  /**
   * Stocke une image de blog (upload multipart) en WebP optimisé, redimensionnée
   * pour tenir dans 1920x1080. Retourne le chemin relatif (`/images/blog/<uuid>.webp`).
   */
  async storeBlogImage(buffer: Buffer): Promise<string> {
    const key = `images/blog/${randomUUID()}.webp`
    const webp = await sharp(buffer)
      .webp({ quality: 85 })
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    await this.disk.put(key, webp, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    })

    return `/${key}`
  }

  /**
   * Stocke l'avatar d'un utilisateur en WebP carré 256x256. La clé est stable
   * (écrasée à chaque upload) ; un cache court évite de servir un ancien avatar.
   * Retourne le chemin relatif (`/images/avatars/<userId>.webp`).
   */
  async storeUserAvatar(userId: number, buffer: Buffer): Promise<string> {
    const key = `images/avatars/${userId}.webp`
    const webp = await sharp(buffer)
      .webp({ quality: 90 })
      .resize(256, 256, { fit: 'cover' })
      .toBuffer()

    await this.disk.put(key, webp, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=300',
    })

    return `/${key}`
  }

  /**
   * Rapatrie l'avatar d'un provider OAuth (URL distante) vers notre stockage et
   * renvoie le chemin relatif. Renvoie `null` si le téléchargement échoue ou si
   * l'image dépasse MAX_REMOTE_AVATAR_BYTES — l'appelant conserve alors l'URL
   * d'origine plutôt que de bloquer la connexion.
   */
  async storeUserAvatarFromUrl(userId: number, url: string): Promise<string | null> {
    try {
      const res = await fetch(url)
      if (!res.ok) return null

      const arrayBuffer = await res.arrayBuffer()
      if (arrayBuffer.byteLength > MAX_REMOTE_AVATAR_BYTES) return null

      return await this.storeUserAvatar(userId, Buffer.from(arrayBuffer))
    } catch (error) {
      logger.warn(
        { userId, err: error instanceof Error ? error.message : String(error) },
        'AVATAR: failed to fetch provider avatar, keeping external URL'
      )
      return null
    }
  }
}

export default new ImageStorageService()
