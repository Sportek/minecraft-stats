import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import ServerPolicy from '#policies/server_policy'
import ImageStorageService from '#services/image_storage_service'
import { readUploadedImage } from '#utils/uploaded_image'

export default class ServerImagesController {
  /**
   * @update
   * @operationId updateServerImage
   * @tag SERVERS
   * @summary Upload a custom image for a server
   * @description Replaces the server image with an uploaded one (multipart field `image`, max 5 MB, `jpg`, `jpeg`, `png`, `webp` or `gif`). The image is cropped to a 256x256 square and stored as WebP and PNG; the periodic ping then stops replacing it with the server favicon. Requires authentication as the verified owner of the server, or as an admin.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestFormDataBody {"image": {"type": "string", "format": "binary"}}
   * @responseBody 200 - {"server": {"id": 134, "name": "Hypixel", "imageUrl": "/images/servers/custom/134-3f1c2c5e-8b7d-4f1a-9b6e-1d8a0c2e3f44", "hasCustomImage": true}}
   * @responseBody 400 - {"error": "No image provided"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 403 - {"message": "Verify ownership of this server before you can change its image."}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async update({ params, request, response, auth, bouncer, i18n }: HttpContext) {
    const server = await this.findServer(params.id)
    if (!server) {
      return response.notFound({ message: i18n.t('messages.servers.notFound') })
    }
    if (await bouncer.with(ServerPolicy).denies('updateImage', server)) {
      return response.forbidden({ message: this.forbiddenMessage(server, auth.user?.id, i18n) })
    }

    const upload = await readUploadedImage(
      request.file('image', { size: '5mb', extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'] })
    )
    if (!upload.ok) {
      if (upload.reason === 'missing') {
        return response.badRequest({ error: i18n.t('messages.servers.noImageProvided') })
      }
      if (upload.reason === 'invalid') {
        return response.badRequest({ error: upload.errors })
      }
      return response.badRequest({ error: i18n.t('messages.servers.invalidUpload') })
    }

    const previousCustomImage = server.hasCustomImage ? server.imageUrl : null
    server.imageUrl = await ImageStorageService.storeServerCustomImage(server.id, upload.buffer)
    server.hasCustomImage = true
    await server.save()

    if (previousCustomImage) {
      await ImageStorageService.deleteServerCustomImage(previousCustomImage)
    }

    return response.ok({ server: this.imageFields(server) })
  }

  /**
   * @destroy
   * @operationId resetServerImage
   * @tag SERVERS
   * @summary Remove the custom image of a server
   * @description Deletes the custom image and goes back to the server favicon: the stored favicon is shown again right away when there is one, and the next ping refreshes it. Requires authentication as the verified owner of the server, or as an admin.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @responseBody 200 - {"server": {"id": 134, "name": "Hypixel", "imageUrl": "/images/servers/134", "hasCustomImage": false}}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 403 - {"message": "Verify ownership of this server before you can change its image."}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async destroy({ params, response, auth, bouncer, i18n }: HttpContext) {
    const server = await this.findServer(params.id)
    if (!server) {
      return response.notFound({ message: i18n.t('messages.servers.notFound') })
    }
    if (await bouncer.with(ServerPolicy).denies('updateImage', server)) {
      return response.forbidden({ message: this.forbiddenMessage(server, auth.user?.id, i18n) })
    }
    if (!server.hasCustomImage) {
      return response.ok({ server: this.imageFields(server) })
    }

    const customImage = server.imageUrl
    server.imageUrl = await ImageStorageService.existingServerFavicon(server.id)
    server.hasCustomImage = false
    server.faviconHash = null // force le prochain ping à réécrire le favicon
    await server.save()

    if (customImage) {
      await ImageStorageService.deleteServerCustomImage(customImage)
    }

    return response.ok({ server: this.imageFields(server) })
  }

  private findServer(id: string) {
    return Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', id)
      .first()
  }

  private forbiddenMessage(server: Server, userId: number | undefined, i18n: HttpContext['i18n']) {
    const key =
      server.userId === userId
        ? 'messages.servers.imageRequiresVerification'
        : 'messages.servers.unauthorized'
    return i18n.t(key)
  }

  private imageFields(server: Server) {
    return {
      id: server.id,
      name: server.name,
      imageUrl: server.imageUrl,
      hasCustomImage: server.hasCustomImage,
    }
  }
}
