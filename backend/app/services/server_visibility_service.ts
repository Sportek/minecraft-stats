import Server from '#models/server'
import CacheService from '#services/cache_service'
import { DateTime } from 'luxon'

/**
 * Masquage d'un serveur par son propriétaire vérifié.
 *
 * Masquer retire le serveur de toutes les lectures publiques (scope `Server.visible`)
 * et coupe ses pings ; démasquer le remet dans la file de ping immédiatement. La ligne
 * n'est jamais supprimée : ses empreintes bloquent un nouvel ajout par un tiers.
 */
export default class ServerVisibilityService {
  static async setHidden(server: Server, hidden: boolean): Promise<Server> {
    if (hidden === (server.hiddenAt !== null)) return server

    server.hiddenAt = hidden ? DateTime.now() : null
    // Au démasquage, `next_ping_at = NULL` = « ASAP » : le prochain tick du scheduler
    // le repingue, sans attendre la fin d'une cadence calculée avant le masquage.
    if (!hidden) server.nextPingAt = null
    await server.save()

    // Le classement est caché 60 s : on purge pour que le changement soit immédiat
    // plutôt que de laisser le serveur apparaître (ou manquer) jusqu'à expiration.
    await CacheService.invalidatePattern('paginate:*')
    return server
  }

  /**
   * Le serveur existe-t-il et est-il masqué ? Lecture par clé primaire, utilisée par
   * les endpoints publics qui ne chargent pas le modèle (stats, rythme, export).
   */
  static async isHidden(serverId: number): Promise<boolean> {
    const server = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', serverId)
      .select('hidden_at')
      .first()
    return Boolean(server?.hiddenAt)
  }
}
