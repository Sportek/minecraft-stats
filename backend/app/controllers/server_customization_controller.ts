import ServerPolicy from '#policies/server_policy'
import ImageStorageService from '#services/image_storage_service'
import { readUploadedImage } from '#utils/uploaded_image'
import { UpdateServerCustomizationValidator } from '#validators/server_customization'
import type { HttpContext } from '@adonisjs/core/http'
import { MAX_BANNER_BYTES } from '../constants/server_customization.js'
import Server from '../models/server.js'

export default class ServerCustomizationController {
  /**
   * @updateServerCustomization
   * @operationId updateServerCustomization
   * @tag SERVERS
   * @summary Update a server's title style and card effect
   * @description Replaces the visual customization of a server: title font, title color (plus an optional second color for a gradient) and card animation effect. All four fields are required; `null` resets a field to the default rendering. Fonts and effects are keys from a fixed allowlist, colors are `#rrggbb`. A gradient end color without a title color is discarded. Requires authentication and a verified ownership of the server (admins bypass).
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestBody {"titleFont": "pixel", "titleColor": "#ff8800", "titleColorEnd": "#ffcc00", "cardEffect": "frost"}
   * @responseBody 200 - <Server>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "titleColor"}]}
   */
  async update({ params, request, response, bouncer, i18n }: HttpContext) {
    const server = await Server.findOrFail(params.id)
    if (await bouncer.with(ServerPolicy).denies('customize', server)) {
      return response.forbidden({ message: i18n.t('messages.servers.unauthorized') })
    }

    const data = await request.validateUsing(UpdateServerCustomizationValidator)
    server.merge({
      ...data,
      titleColorEnd: data.titleColor ? data.titleColorEnd : null,
    })
    await server.save()
    return server
  }

  /**
   * @storeServerBanner
   * @operationId storeServerBanner
   * @tag SERVERS
   * @summary Upload a server banner
   * @description Accepts a multipart upload under the form field `banner` (max 1 MB; jpg, jpeg, png, webp, gif). The image must be exactly 468x60 pixels, the standard server-list banner size. Animated GIFs are kept animated (stored as animated WebP). Replaces and deletes any previous banner. Requires authentication and a verified ownership of the server (admins bypass).
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestFormDataBody {"banner": {"type": "string", "format": "binary"}}
   * @responseBody 200 - <Server>
   * @responseBody 400 - {"message": "No banner provided."}
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   * @responseBody 422 - {"message": "The banner must be exactly 468×60 pixels."}
   */
  async storeBanner({ params, request, response, bouncer, i18n }: HttpContext) {
    const server = await Server.findOrFail(params.id)
    if (await bouncer.with(ServerPolicy).denies('customize', server)) {
      return response.forbidden({ message: i18n.t('messages.servers.unauthorized') })
    }

    const upload = await readUploadedImage(
      request.file('banner', {
        size: MAX_BANNER_BYTES,
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
    )
    if (!upload.ok) {
      const key = upload.reason === 'missing' ? 'noImageProvided' : 'invalidUpload'
      return response.badRequest({ message: i18n.t(`messages.serverCustomization.${key}`) })
    }

    const stored = await ImageStorageService.storeServerBanner(server.id, upload.buffer)
    if (!stored.ok) {
      return response.unprocessableEntity({
        message: i18n.t(`messages.serverCustomization.${stored.reason}`),
      })
    }

    const previous = server.bannerUrl
    server.bannerUrl = stored.url
    await server.save()
    if (previous) await ImageStorageService.deletePublicAsset(previous)
    return server
  }

  /**
   * @destroyServerBanner
   * @operationId destroyServerBanner
   * @tag SERVERS
   * @summary Remove a server banner
   * @description Removes the banner of a server and deletes the stored file. Idempotent. Allowed to the server's owner (verified or not) and to admins, so an abusive banner can always be taken down. Requires authentication.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @responseBody 200 - <Server>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async destroyBanner({ params, response, bouncer, i18n }: HttpContext) {
    const server = await Server.findOrFail(params.id)
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden({ message: i18n.t('messages.servers.unauthorized') })
    }

    const { bannerUrl } = server
    if (bannerUrl) {
      server.bannerUrl = null
      await server.save()
      await ImageStorageService.deletePublicAsset(bannerUrl)
    }
    return server
  }
}
