import Language from '#models/language'
import CacheService from '#services/cache_service'
import { type HttpContext } from '@adonisjs/core/http'

export default class LanguagesController {
  async index({ response }: HttpContext) {
    const languages = await CacheService.cacheOrFetch('languages:all', 3600, () => Language.all())
    return response.json(languages)
  }
}
