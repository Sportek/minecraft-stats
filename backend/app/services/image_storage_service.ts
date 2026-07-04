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
 * Taille max d'un skin Minecraft rapatrié depuis textures.minecraft.net. Un skin
 * légitime est un PNG 64x64 de quelques Ko ; on borne avant décodage Sharp.
 */
const MAX_SKIN_BYTES = 1 * 1024 * 1024

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

    // TTL 6h (navigateur + edge CDN). L'URL du favicon est stable (pas versionnée
    // par un hash), donc un TTL long = image périmée jusqu'à expiration si le
    // favicon change. 6h est un bon compromis : cosmétique et rarissime pour un
    // favicon, mais suffisant pour effondrer l'egress derrière un CDN. On évite
    // `immutable`/1 an ici, réservé aux assets à URL unique (blog, avatars).
    const cacheControl = 'public, max-age=21600'
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
   * Stocke l'avatar d'un utilisateur en WebP carré 256x256. La clé inclut un UUID
   * aléatoire : chaque upload produit une URL différente, donc aucun cache
   * (navigateur, CDN, Next) ne sert l'ancienne image. L'appelant doit supprimer
   * l'ancien fichier via `deletePublicAsset` pour éviter les orphelins.
   * Retourne le chemin relatif (`/images/avatars/<userId>-<uuid>.webp`).
   */
  async storeUserAvatar(userId: number, buffer: Buffer): Promise<string> {
    const key = `images/avatars/${userId}-${randomUUID()}.webp`
    const webp = await sharp(buffer)
      .webp({ quality: 90 })
      .resize(256, 256, { fit: 'cover' })
      .toBuffer()

    await this.disk.put(key, webp, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    })

    return `/${key}`
  }

  /**
   * Rend et stocke la tête d'un joueur à partir des octets bruts de son skin
   * Minecraft (PNG 64x64 ou legacy 64x32). Extrait le visage (8x8 en 8,8) puis y
   * superpose le calque chapeau (8x8 en 40,8), et agrandit en 128x128 au plus
   * proche (`nearest`) pour garder le pixel-art net. Clé `images/heads/<uuid>.webp`.
   * TTL 6h comme les favicons : l'URL n'est pas versionnée mais le skin change
   * rarement. Retourne le chemin relatif sans extension (`/images/heads/<uuid>`).
   */
  async storePlayerHead(uuid: string, skinBuffer: Buffer): Promise<string> {
    if (skinBuffer.byteLength > MAX_SKIN_BYTES) {
      throw new Error(`skin too large: ${skinBuffer.byteLength} bytes (max ${MAX_SKIN_BYTES})`)
    }

    const source = () => sharp(skinBuffer, { limitInputPixels: 16_384 * 16_384, failOn: 'error' })
    const face = await source().extract({ left: 8, top: 8, width: 8, height: 8 }).png().toBuffer()
    const hat = await source().extract({ left: 40, top: 8, width: 8, height: 8 }).png().toBuffer()

    // Deux instances Sharp distinctes : dans une même chaîne, composite() est
    // appliqué après resize(), le chapeau resterait un patch 8x8 centré sur le
    // visage 128x128 au lieu de le recouvrir.
    const head = await sharp(face)
      .composite([{ input: hat }])
      .png()
      .toBuffer()
    const webp = await sharp(head)
      .resize(128, 128, { kernel: 'nearest' })
      .toFormat('webp')
      .toBuffer()

    await this.disk.put(`images/heads/${uuid}.webp`, webp, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=21600',
    })

    return `/images/heads/${uuid}`
  }

  /**
   * Supprime un asset à partir de son chemin public (`/images/...`). Best-effort :
   * on log et on continue si l'objet n'existe pas ou si la suppression échoue.
   */
  async deletePublicAsset(publicPath: string): Promise<void> {
    const key = publicPath.replace(/^\//, '')
    try {
      await this.disk.delete(key)
    } catch (error) {
      logger.warn(
        { key, err: error instanceof Error ? error.message : String(error) },
        'STORAGE: failed to delete asset'
      )
    }
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
