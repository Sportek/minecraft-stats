import type { MultipartFile } from '@adonisjs/core/bodyparser'
import fs from 'node:fs/promises'

/**
 * Résultat de validation d'une image uploadée en multipart. Discrimine les trois
 * cas d'échec que les controllers traduisaient chacun de leur côté (fichier absent,
 * invalide, sans chemin temporaire) pour qu'ils mappent leur propre message i18n.
 */
export type UploadedImageResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; reason: 'missing' | 'invalid' | 'noTmpPath'; errors?: unknown }

/**
 * Valide un `request.file(...)` image et renvoie son contenu en Buffer, ou la
 * raison de l'échec. Mutualise le pattern « présence → isValid → tmpPath →
 * readFile » dupliqué entre l'upload d'images de blog et l'upload d'avatar.
 */
export async function readUploadedImage(image: MultipartFile | null): Promise<UploadedImageResult> {
  if (!image) return { ok: false, reason: 'missing' }
  if (!image.isValid) return { ok: false, reason: 'invalid', errors: image.errors }
  if (!image.tmpPath) return { ok: false, reason: 'noTmpPath' }
  return { ok: true, buffer: await fs.readFile(image.tmpPath) }
}
