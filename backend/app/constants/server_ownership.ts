/**
 * Méthodes de preuve de propriété d'un serveur :
 *  - 'dns'    : self-service. Le propriétaire publie un enregistrement TXT contenant
 *               un jeton unique ; le backend le résout et transfère la propriété.
 *  - 'manual' : filet de sécurité pour ceux qui ne contrôlent pas le DNS (IP nue,
 *               sous-domaine d'hébergeur mutualisé). L'utilisateur soumet une preuve
 *               (tag Discord, lien…) qu'un admin valide à la main.
 */
export type OwnershipMethod = 'dns' | 'manual'

export const OWNERSHIP_METHODS: OwnershipMethod[] = ['dns', 'manual']

export type OwnershipClaimStatus = 'pending' | 'verified' | 'rejected' | 'expired'

/** Préfixe de la valeur TXT à publier : `minecraft-stats-verify=<token>`. */
export const DNS_TXT_PREFIX = 'minecraft-stats-verify'

/**
 * Durée de validité d'un jeton DNS. Volontairement large : la propagation DNS peut
 * prendre plusieurs heures selon le TTL de la zone et le fournisseur.
 */
export const DNS_TOKEN_TTL_DAYS = 7
