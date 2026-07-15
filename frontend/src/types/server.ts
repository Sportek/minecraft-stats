import { User } from "./auth";

export interface Language {
  id: number;
  code: string;
  name: string;
  flag: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ServerType = "java" | "bedrock";

export interface Server {
  id: number;
  name: string;
  address: string;
  port: number;
  type: ServerType;
  version: string | null;
  website: string | null;
  imageUrl: string;
  // null pour un serveur orphelin (propriétaire ayant supprimé son compte).
  user: User | null;
  createdAt: Date;
  lastOnlineAt: Date | null;
  lastStatsAt: Date | null;
  lastPlayerCount: number | null;
  lastMaxCount: number | null;
  peakPlayerCount: number | null;
  peakPlayerAt: Date | null;
  languages: Language[];
  // Total cumulatif de votes (all-time). Le classement mensuel est calculé côté API.
  voteCount: number;
  // Preuve de propriété : non-null = un propriétaire a été confirmé (DNS ou revue admin).
  ownerVerifiedAt: Date | null;
  ownerVerifiedMethod: OwnershipMethod | null;
}

export type OwnershipMethod = "motd" | "dns" | "manual";

export type OwnershipClaimStatus = "pending" | "verified" | "rejected" | "expired";

/** Dossier de réclamation de propriété de l'utilisateur courant pour un serveur. */
export interface ServerOwnershipClaim {
  method: OwnershipMethod;
  status: OwnershipClaimStatus;
  evidence: string | null;
  evidenceUrl: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

/** Enregistrement DNS à publier pour prouver la propriété. */
export interface DnsInstructions {
  recordType: "TXT";
  recordName: string | null;
  recordValue: string;
  acceptedHosts: string[];
}

/** Chaîne à insérer dans la MOTD du serveur pour prouver la propriété. */
export interface MotdInstructions {
  value: string;
}

/** État de propriété d'un serveur pour l'utilisateur courant (GET /servers/:id/claim). */
export interface ClaimStatus {
  verified: boolean;
  isOwner: boolean;
  methods: { motd: boolean; dns: boolean; manual: boolean };
  claim: ServerOwnershipClaim | null;
}

/** Demande manuelle vue côté admin, serveur + demandeur préchargés. */
export interface AdminOwnershipClaim {
  id: number;
  method: OwnershipMethod;
  status: OwnershipClaimStatus;
  evidence: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  server: Server;
  user: { id: number; username: string; email: string; avatarUrl: string | null };
}

/**
 * A server as listed under a user in the admin user-detail view. Same shape as
 * `Server` minus the owner relation (the owner is already the page's subject).
 */
export type AdminUserServer = Omit<Server, "user">;

export interface ServerStat {
  id: number;
  serverId: number;
  playerCount: number;
  maxCount: number;
  createdAt: Date;
}

export interface ServerGrowthStat {
  serverId: number;
  weeklyGrowth: number | null;
  monthlyGrowth: number | null;
  lastWeekAverage: number;
  previousWeekAverage: number;
  lastMonthAverage: number;
  lastUpdated: Date;
}

export interface Category {
  id: number;
  name: string;
  createdAt: Date;
}
