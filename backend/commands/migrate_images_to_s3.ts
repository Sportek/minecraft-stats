import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import { readdir, readFile } from 'node:fs/promises'
import { join, posix, relative, sep, extname } from 'node:path'

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
}

/**
 * One-shot migration of the locally-stored images (`public/images/**`) to the S3
 * disk. Idempotent: re-running re-uploads (overwrites) the same keys. Use
 * `--dry-run` to list what would be uploaded without touching S3.
 */
export default class MigrateImagesToS3 extends BaseCommand {
  static commandName = 'migrate:images-to-s3'
  static description = 'Upload the local public/images files to the S3 drive disk'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'List files without uploading them' })
  declare dryRun: boolean

  private async collectFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      entries.map((entry) => {
        const full = join(dir, entry.name)
        return entry.isDirectory() ? this.collectFiles(full) : Promise.resolve([full])
      })
    )
    return files.flat()
  }

  async run() {
    const root = app.publicPath('images')
    const publicRoot = app.publicPath()
    const disk = drive.use('s3')

    let files: string[]
    try {
      files = await this.collectFiles(root)
    } catch {
      this.logger.warning(`No images directory found at ${root} — nothing to migrate`)
      return
    }

    this.logger.info(`Found ${files.length} file(s) under ${root}`)

    let uploaded = 0
    for (const file of files) {
      // Key relative to the public root, normalised to forward slashes so it
      // matches the keys used at runtime (e.g. `images/servers/42.webp`).
      const key = relative(publicRoot, file).split(sep).join(posix.sep)
      const contentType = CONTENT_TYPES[extname(file).toLowerCase()]

      if (this.dryRun) {
        this.logger.info(`[dry-run] ${key}`)
        continue
      }

      const buffer = await readFile(file)
      await disk.put(key, buffer, {
        contentType,
        visibility: 'public',
        cacheControl: 'public, max-age=31536000, immutable',
      })
      uploaded++
      this.logger.success(`uploaded ${key}`)
    }

    if (this.dryRun) {
      this.logger.info(`Dry run complete — ${files.length} file(s) would be uploaded`)
    } else {
      this.logger.info(`Migration complete — ${uploaded}/${files.length} file(s) uploaded to S3`)
    }
  }
}
