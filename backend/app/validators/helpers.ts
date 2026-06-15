import vine from '@vinejs/vine'
import { isIP } from 'node:net'

const PRIVATE_V4_RANGES = [
  /^127\./, // loopback
  /^10\./, // RFC1918
  /^192\.168\./, // RFC1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC1918 172.16/12
  /^169\.254\./, // link-local / cloud metadata (169.254.169.254)
  /^0\./, // "this" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64/10
]

/**
 * Indique si `host` est une IP littérale dans une plage privée/loopback/
 * link-local/réservée. Les noms d'hôte (non-littéraux) renvoient `false` —
 * la résolution DNS au moment de la connexion sort du périmètre de ce garde.
 */
function isPrivateOrReservedIp(host: string): boolean {
  const version = isIP(host)
  if (version === 4) {
    return PRIVATE_V4_RANGES.some((re) => re.test(host))
  }
  if (version === 6) {
    const h = host.toLowerCase()
    // IPv4-mapped (::ffff:a.b.c.d) → on teste la partie IPv4 embarquée.
    const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateOrReservedIp(mapped[1])
    return (
      h === '::1' || // loopback
      h === '::' || // unspecified
      h.startsWith('fe80:') || // link-local
      h.startsWith('fc') || // unique-local fc00::/7
      h.startsWith('fd')
    )
  }
  return false
}

/**
 * Champ "hôte public" : une chaîne qui ne doit pas désigner une IP littérale
 * interne. Bloque le SSRF/scan réseau le plus évident (adresse de serveur
 * pointée sur 127.0.0.1, 169.254.169.254, 10.x, etc.) sans impacter les
 * serveurs Minecraft publics légitimes.
 */
const publicHostRule = vine.createRule((value: unknown, _options: undefined, field) => {
  if (typeof value !== 'string') return
  if (isPrivateOrReservedIp(value.trim())) {
    field.report(
      'The {{ field }} field must not point to a private or reserved IP address',
      'publicHost',
      field
    )
  }
})

export const publicHostField = () => vine.string().use(publicHostRule())

/**
 * Champ epoch milliseconds. Accepte aussi la chaîne littérale `"now"`, convertie
 * en `Date.now()` avant validation — pratique pour les bornes `toDate` que les
 * clients veulent ancrer à "maintenant" sans re-générer un timestamp à chaque requête.
 */
export const epochMsField = () =>
  vine.number().parse((value) => (value === 'now' ? Date.now() : value))

/**
 * Équivalent de `epochMsField()` pour les endpoints qui lisent `request.input(...)`
 * directement (sans validator Vine). Renvoie `null` si la valeur n'est ni un
 * epoch ms valide ni la chaîne `"now"`.
 */
export function parseEpochMs(value: unknown): number | null {
  if (value === 'now') return Date.now()
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}
