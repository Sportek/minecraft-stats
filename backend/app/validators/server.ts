import vine from '@vinejs/vine'

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
    address: vine.string(),
    port: vine.number().max(65535).min(1),
    imageUrl: vine.string().optional(),
    categories: vine.array(vine.string()),
    version: vine.string().optional(),
    motd: vine.string().optional(),
  })
)

export const UpdateServerValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    address: vine.string().optional(),
    port: vine.number().max(65535).min(1).optional(),
    imageUrl: vine.string().optional(),
    categories: vine.array(vine.string()).optional(),
    version: vine.string().optional(),
    motd: vine.string().optional(),
  })
)
