/**
 * Méthodes de preuve de propriété d'un serveur :
 *  - 'motd'   : self-service, couverture maximale. Le propriétaire insère un jeton
 *               dans la MOTD du serveur ; le backend le lit via un ping (Java + Bedrock,
 *               IP ou domaine). C'est le standard des listes Minecraft.
 *  - 'dns'    : self-service, sans coupure pour les joueurs. Le propriétaire publie un
 *               enregistrement TXT contenant le jeton. Nécessite le contrôle du DNS.
 *  - 'manual' : filet pour les cas où ni MOTD ni DNS ne sont possibles. L'utilisateur
 *               soumet une preuve (tag Discord, lien…) qu'un admin valide à la main.
 */
export type OwnershipMethod = 'motd' | 'dns' | 'manual'

export const OWNERSHIP_METHODS: OwnershipMethod[] = ['motd', 'dns', 'manual']

export type OwnershipClaimStatus = 'pending' | 'verified' | 'rejected' | 'expired'

/**
 * Marqueur commun aux preuves MOTD et DNS : la chaîne à publier est
 * `minecraft-stats-verify=<token>`. Court pour tenir dans une ligne de MOTD.
 */
export const VERIFY_PREFIX = 'minecraft-stats-verify'

/**
 * Durée de validité d'un jeton. Large pour le DNS (propagation parfois lente) ; la
 * MOTD est instantanée mais on garde la même fenêtre par simplicité.
 */
export const TOKEN_TTL_DAYS = 7
