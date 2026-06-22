import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

/**
 * Stockage de fichiers (favicons de serveurs, images de blog, avatars).
 *
 * - `fs`  : utilisé en dev/test. Écrit dans `public/`, donc les fichiers restent
 *           servis par le middleware static existant à `/images/...` (comportement
 *           historique inchangé). `serveFiles: false` car on ne veut pas une route
 *           supplémentaire en doublon du static.
 * - `s3`  : utilisé en prod/staging. `supportsACL: false` car les buckets S3
 *           récents désactivent les ACL (« Bucket owner enforced ») ; l'accès
 *           public passe alors par une bucket policy, pas par des ACL par objet.
 *           `S3_CDN_URL` (CloudFront) est optionnel et sert à construire les URLs.
 *
 * Le disk par défaut est piloté par `DRIVE_DISK` (défaut `fs`).
 */
const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK', 'fs'),

  services: {
    fs: services.fs({
      location: app.publicPath(),
      visibility: 'public',
      serveFiles: false,
    }),

    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('AWS_REGION', 'us-east-1'),
      bucket: env.get('S3_BUCKET', ''),
      cdnUrl: env.get('S3_CDN_URL'),
      supportsACL: false,
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
