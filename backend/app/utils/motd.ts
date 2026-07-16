/**
 * Aplatit un MOTD Minecraft — string brute ou composant Chat imbriqué
 * (`{ text, extra: [...] }`) — en texte simple. Mutualisé entre la détection de
 * doublon (empreinte MOTD) et la vérification de propriété (jeton dans la MOTD).
 */
export function flattenMotd(node: unknown): string {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map((n) => flattenMotd(n)).join('')
  if (typeof node === 'object') {
    const obj = node as { text?: unknown; extra?: unknown }
    let text = typeof obj.text === 'string' ? obj.text : ''
    if (obj.extra) text += flattenMotd(obj.extra)
    return text
  }
  return ''
}
