import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

export default class UploadsController {
  /**
   * Upload an image for blog posts
   * Accepts: image/jpeg, image/png, image/webp
   * Returns: URL to the uploaded image
   */
  async uploadImage({ request, response }: HttpContext) {
    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    })

    if (!image) {
      return response.badRequest({ error: 'No image provided' })
    }

    if (!image.isValid) {
      return response.badRequest({ error: image.errors })
    }

    // Generate unique filename
    const fileName = `${cuid()}.webp`
    const uploadsPath = app.makePath('public/images/blog')
    const filePath = path.join(uploadsPath, fileName)

    // Ensure directory exists
    await fs.mkdir(uploadsPath, { recursive: true })

    try {
      // Read the uploaded file
      const imageBuffer = await fs.readFile(image.tmpPath!)

      // Convert to WebP and optimize
      await sharp(imageBuffer)
        .webp({ quality: 85 })
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(filePath)

      // Delete temporary file
      await image.move(app.tmpPath())

      // Return the URL
      const imageUrl = `/images/blog/${fileName}`

      return response.ok({ url: imageUrl })
    } catch (error) {
      return response.internalServerError({
        error: 'Failed to process image',
        details: error.message,
      })
    }
  }
}
