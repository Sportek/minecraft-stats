import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { LanguageCode, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../../app/constants/languages.js'
import Language from '#models/language'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const now = DateTime.now()

    const languages = Object.values(LanguageCode)
      .reverse()
      .map((code) => ({
        code,
        name: LANGUAGE_NAMES[code],
        flag: LANGUAGE_FLAGS[code],
        created_at: now,
        updated_at: now,
      }))

    await Language.createMany(languages)
  }
}
