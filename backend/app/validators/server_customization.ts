import vine from '@vinejs/vine'
import { CARD_EFFECTS, HEX_COLOR, TITLE_FONTS } from '../constants/server_customization.js'

const hexColor = () => vine.string().regex(HEX_COLOR).toLowerCase().nullable()

/**
 * Remplacement complet du style : les quatre champs sont toujours envoyés, `null`
 * remet la valeur par défaut. La bannière passe par son propre endpoint (multipart).
 */
export const UpdateServerCustomizationValidator = vine.compile(
  vine.object({
    titleFont: vine.enum([...TITLE_FONTS]).nullable(),
    titleColor: hexColor(),
    titleColorEnd: hexColor(),
    cardEffect: vine.enum([...CARD_EFFECTS]).nullable(),
  })
)
