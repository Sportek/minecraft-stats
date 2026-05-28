import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import PostPolicy from '#policies/post_policy'

export default class UploadsController {
  /**
   * @uploadImage
   * @operationId uploadImage
   * @tag UPLOADS
   * @summary Upload a blog image
   * @description Accepts a multipart upload under the form field `image`. The file is validated (max 5 MB, extensions `jpg`, `jpeg`, `png`, `webp`, `gif`), converted to WebP at quality 85, resized to fit within 1920x1080 without enlargement, and stored in `public/images/blog/`. Returns the relative URL of the stored image. Requires authentication and `manage` ability on the Post policy.
   * @requestFormDataBody {"image": {"type": "string", "format": "binary"}}
   * @responseBody 200 - {"url": "/images/blog/3f1c2c5e-8b7d-4f1a-9b6e-1d8a0c2e3f44.webp"}
   * @responseBody 400 - {"error": "No image provided"}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   * @responseBody 500 - {"error": "Failed to process image", "details": "<sharp error message>"}
   */
  async uploadImage({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Writer privileges required.' })
    }
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
    const fileName = `${randomUUID()}.webp`
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
