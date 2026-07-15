import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { DateTime } from 'luxon'

export interface DuplicateAccountSignals {
  sameDevice: boolean
  sameIp: boolean
}

export interface DuplicateAccount {
  id: number
  username: string
  email: string
  role: User['role']
  createdAt: DateTime
  signals: DuplicateAccountSignals
}

/**
 * Détection de multi-comptes — pendant, côté utilisateurs, de
 * `DuplicateDetectionService` (côté serveurs). Extraite du controller pour être
 * testable et pour que l'accès aux tables analytics (`visitor_accounts`,
 * `visitors`) reste concentré ici plutôt que dispersé dans un handler HTTP.
 */
export default class DuplicateAccountService {
  /**
   * Trouve les autres comptes qui partagent un appareil (même visiteur anonyme)
   * ou un réseau (même IP hashée) avec l'utilisateur donné — les signaux les plus
   * forts pour repérer le multi-comptes, issus des tables visiteurs de l'analytics.
   */
  static async forUser(userId: number): Promise<DuplicateAccount[]> {
    const ownLinks = await db.from('visitor_accounts').where('user_id', userId).select('visitor_id')
    const visitorIds = ownLinks.map((row) => row.visitor_id)
    if (visitorIds.length === 0) return []

    const ipHashRows = await db
      .from('visitors')
      .whereIn('id', visitorIds)
      .whereNotNull('ip_hash')
      .select('ip_hash')
    const ipHashes = ipHashRows.map((row) => row.ip_hash)

    let sharedIpVisitorIds: number[] = []
    if (ipHashes.length > 0) {
      const ipVisitorRows = await db.from('visitors').whereIn('ip_hash', ipHashes).select('id')
      sharedIpVisitorIds = ipVisitorRows.map((row) => row.id)
    }

    // candidate userId → which signals tie them back to the target user.
    const signals = new Map<number, DuplicateAccountSignals>()
    const flag = (rows: { user_id: number }[], key: 'sameDevice' | 'sameIp') => {
      for (const { user_id: candidateId } of rows) {
        if (candidateId === userId) continue
        const entry = signals.get(candidateId) ?? { sameDevice: false, sameIp: false }
        entry[key] = true
        signals.set(candidateId, entry)
      }
    }

    const deviceRows = await db
      .from('visitor_accounts')
      .whereIn('visitor_id', visitorIds)
      .select('user_id')
    flag(deviceRows, 'sameDevice')

    if (sharedIpVisitorIds.length > 0) {
      const ipRows = await db
        .from('visitor_accounts')
        .whereIn('visitor_id', sharedIpVisitorIds)
        .select('user_id')
      flag(ipRows, 'sameIp')
    }

    if (signals.size === 0) return []

    const candidates = await User.query().whereIn('id', [...signals.keys()])
    return candidates
      .map((candidate) => ({
        id: candidate.id,
        username: candidate.username,
        email: candidate.email,
        role: candidate.role,
        createdAt: candidate.createdAt,
        signals: signals.get(candidate.id)!,
      }))
      .sort((a, b) => Number(b.signals.sameDevice) - Number(a.signals.sameDevice))
  }
}
