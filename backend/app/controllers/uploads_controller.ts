import type { HttpContext } from '@adonisjs/core/http'
import ImageStorageService from '#services/image_storage_service'
import PostPolicy from '#policies/post_policy'
import { readUploadedImage } from '#utils/uploaded_image'
import { requireAbility } from '#utils/require_ability'

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
  async uploadImage(ctx: HttpContext) {
    const { request, response, i18n } = ctx
    const authorized = await requireAbility(
      ctx,
      () => ctx.bouncer.with(PostPolicy).denies('manage'),
      {
        unauthorized: 'messages.uploads.unauthorized',
        forbidden: 'messages.uploads.writerRequired',
      }
    )
    if (!authorized) return

    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    })

    const upload = await readUploadedImage(image)
    if (!upload.ok) {
      if (upload.reason === 'missing') {
        return response.badRequest({ error: i18n.t('messages.uploads.noImageProvided') })
      }
      if (upload.reason === 'invalid') {
        return response.badRequest({ error: upload.errors })
      }
      return response.badRequest({ error: i18n.t('messages.uploads.invalidUpload') })
    }

    try {
      const url = await ImageStorageService.storeBlogImage(upload.buffer)
      return response.ok({ url })
    } catch (error) {
      return response.internalServerError({
        error: i18n.t('messages.uploads.processFailed'),
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
