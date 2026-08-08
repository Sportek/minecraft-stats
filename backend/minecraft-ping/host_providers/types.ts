/** Stats live d'un serveur telles que rapportées par l'API de son hébergeur. */
export interface HostServerStats {
  players: { online: number; max: number }
  /** MOTD brute ou composant Chat déjà parsé — `flattenMotd` accepte les deux. */
  motd: unknown
  /** null quand l'hébergeur ne l'expose pas — l'appelant garde la version connue. */
  version: string | null
  /** Data URI base64 de l'icône du serveur. Renseigné en mode `detailed` seulement. */
  favicon: string | null
}

/**
 * Source de stats alternative pour les hébergeurs à proxy mutualisé.
 *
 * Problème : chez un hébergeur de ce type (Minehut…), le ping Minecraft direct ne
 * parle jamais au serveur visé — c'est le proxy du réseau qui répond, avec les
 * compteurs du réseau ENTIER. `thatboxsrver.minehut.gg` remonte ainsi ~4600
 * joueurs alors qu'il en a 0, `max` vaut le nombre de serveurs du réseau, et
 * n'importe quel sous-domaine inexistant répond exactement la même chose (donc
 * un serveur fantôme passerait la validation à l'ajout). Le seul chiffre
 * exploitable vient de l'API de l'hébergeur, interrogée par nom de serveur.
 *
 * Un provider par hébergeur, enregistré dans `./index.ts`.
 */
export interface HostStatsProvider {
  readonly id: string

  /**
   * Identifiant du serveur chez l'hébergeur, extrait de l'adresse
   * (`thatboxsrver.minehut.gg` -> `thatboxsrver`), ou null si l'adresse ne relève
   * pas de cet hébergeur.
   */
  resolveKey(address: string): string | null

  /**
   * Stats live du serveur, ou null s'il est hors-ligne ou inexistant chez
   * l'hébergeur — les deux se traduisent par un ping en échec côté appelant.
   *
   * `detailed` autorise le provider à dépenser un appel réseau dédié à ce seul
   * serveur pour ramener aussi le favicon : c'est le mode des chemins qui ne
   * traitent qu'un serveur à la fois (ajout, vérification de propriété, balayage
   * 6 h). Hors de ce mode, libre au provider de mutualiser un appel entre toutes
   * les clés du cycle.
   */
  fetchStats(key: string, options?: { detailed?: boolean }): Promise<HostServerStats | null>
}
