import vine from '@vinejs/vine'
import { LanguageCode } from '../constants/languages.js'
import { SERVER_TYPES } from '../constants/server_type.js'
import { publicHostField } from './helpers.js'

export enum ServerCategory {
  SURVIVAL = 'survival',
  CREATIVE = 'creative',
  MINIGAMES = 'minigames',
  PVPFACTION = 'pvpfaction',
  ROLEPLAY = 'roleplay',
  SKYBLOCK = 'skyblock',
  PRISON = 'prison',
  MMORPG = 'mmorpg',
  ONEBLOCK = 'oneblock',
  BOXED = 'boxed',
  OTHER = 'other',
}

export const CreateServerValidator = vine.compile(
  vine.object({
    name: vine.string(),
    address: publicHostField(),
    port: vine.number().max(65535).min(1),
    type: vine.enum(SERVER_TYPES).optional(),
    imageUrl: vine.string().optional(),
    categories: vine.array(vine.string()),
    version: vine.string().optional(),
    website: vine.string().optional(),
    motd: vine.string().optional(),
    languages: vine.array(vine.enum(Object.values(LanguageCode))),
  })
)

export const UpdateServerValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    address: publicHostField().optional(),
    port: vine.number().max(65535).min(1).optional(),
    type: vine.enum(SERVER_TYPES).optional(),
    imageUrl: vine.string().optional(),
    categories: vine.array(vine.string()).optional(),
    version: vine.string().optional(),
    website: vine.string().optional(),
    motd: vine.string().optional(),
    languages: vine.array(vine.enum(Object.values(LanguageCode))).optional(),
  })
)
