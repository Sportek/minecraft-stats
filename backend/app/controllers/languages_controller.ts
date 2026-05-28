import Language from '#models/language'
import CacheService from '#services/cache_service'
import { type HttpContext } from '@adonisjs/core/http'

export default class LanguagesController {
  /**
   * @listLanguages
   * @operationId listLanguages
   * @tag LANGUAGES
   * @summary List all languages
   * @description Returns every language tag available for servers (e.g. FR, EN). The result is cached for one hour under the `languages:all` cache key. Publicly accessible.
   * @responseBody 200 - <Language[]>
   */
  async index({ response }: HttpContext) {
    const languages = await CacheService.cacheOrFetch('languages:all', 3600, () => Language.all())
    return response.json(languages)
  }
}
