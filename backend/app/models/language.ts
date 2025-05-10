import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { LanguageCode, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../constants/languages.js'

export default class Language extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: LanguageCode

  @column()
  declare name: string

  @column()
  declare flag: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static async getOrCreate(code: LanguageCode) {
    const language = await this.firstOrCreate(
      { code },
      { code, name: LANGUAGE_NAMES[code], flag: LANGUAGE_FLAGS[code] }
    )
    return language
  }
}
