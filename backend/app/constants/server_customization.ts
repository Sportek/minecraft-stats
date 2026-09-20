/**
 * Polices proposées pour le titre d'un serveur. Le backend ne stocke que la clé ; le
 * frontend la résout en police réelle (cf. `lib/server-customization.ts`). Ajouter une
 * police = l'ajouter ici ET côté frontend.
 */
export const TITLE_FONTS = [
  'minecraft',
  'pixel',
  'medieval',
  'fantasy',
  'bungee',
  'rounded',
  'script',
  'future',
  'marker',
] as const
export type TitleFont = (typeof TITLE_FONTS)[number]

/** Effets d'animation de la carte. Même contrat que les polices : clés uniquement. */
export const CARD_EFFECTS = ['frost', 'enchanted', 'embers', 'neon'] as const
export type CardEffect = (typeof CARD_EFFECTS)[number]

/** Couleur du titre : hex 6 chiffres, seule forme injectée dans un style côté client. */
export const HEX_COLOR = /^#[0-9a-f]{6}$/i

/**
 * Bannière : 468x60 est le format standard des sites de vote, donc les owners en ont
 * déjà une. Dimensions exactes exigées plutôt que recadrage automatique, qui
 * dégraderait leur visuel sans qu'ils le voient venir.
 */
export const BANNER_WIDTH = 468
export const BANNER_HEIGHT = 60
export const MAX_BANNER_BYTES = 1024 * 1024

/** Plafond d'images d'un GIF animé, pour borner le décodage (`limitInputPixels`). */
export const MAX_BANNER_FRAMES = 200
