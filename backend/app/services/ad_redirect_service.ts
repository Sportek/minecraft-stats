/**
 * Défense anti open-redirect / header-injection pour les liens de publicité.
 *
 * Extraite du controller pour être testable en isolation : la redirection de clic
 * n'est autorisée que vers une URL `http(s)` qui apparaît littéralement comme un
 * `href` dans le HTML stocké de la publicité. Toute la logique de normalisation
 * (entités HTML, caractères de contrôle) et l'allow-list vivent ici.
 */
export default class AdRedirectService {
  /**
   * Décode les entités HTML les plus courantes (le navigateur les décode côté
   * client, il faut donc comparer sur la même base). Décodage en une seule passe :
   * la sortie n'est jamais re-traitée, donc aucun risque de double-décodage
   * (ex. "&amp;#38;" reste "&#38;").
   */
  private static decodeHtmlEntities(value: string): string {
    return value.replace(/&(?:amp|#38|#x26);/gi, '&')
  }

  /**
   * Retire les caractères de contrôle (saut de ligne, tabulation, etc.) d'une URL.
   * Les navigateurs les retirent des URLs ; ils sont surtout interdits dans un
   * en-tête HTTP `Location` et provoqueraient un crash s'ils étaient renvoyés tels
   * quels.
   */
  static sanitizeUrl(value: string): string {
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\x00-\x1F\x7F]/g, '').trim()
  }

  /**
   * Extrait les URLs des attributs `href` présents dans le HTML d'une publicité.
   * Sert de liste blanche pour la redirection de clic.
   */
  static extractHrefs(html: string): Set<string> {
    const urls = new Set<string>()
    const regex = /href\s*=\s*["']([^"']+)["']/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      const href = this.sanitizeUrl(match[1])
      urls.add(href)
      urls.add(this.sanitizeUrl(this.decodeHtmlEntities(href)))
    }
    return urls
  }

  /**
   * Résout une cible de redirection sûre depuis le `to` demandé et le HTML de la
   * publicité. Renvoie l'URL normalisée (`URL.href`, sûre pour un en-tête HTTP)
   * si `to`, une fois nettoyé, est un lien `http(s)` présent dans l'allow-list des
   * href de la pub ; sinon `null`.
   */
  static resolveTarget(htmlContent: string, to: string): string | null {
    const sanitized = this.sanitizeUrl(to)
    if (!sanitized || !this.extractHrefs(htmlContent).has(sanitized)) return null

    try {
      const parsed = new URL(sanitized)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href
      }
    } catch {
      return null
    }
    return null
  }
}
