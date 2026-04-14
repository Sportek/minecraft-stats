import Language from '#models/language'
import { type HttpContext } from '@adonisjs/core/http'

export default class LanguagesController {
  async index({ response }: HttpContext) {
    const languages = await Language.all()
    return response.json(languages)
  }
}
