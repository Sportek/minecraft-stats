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
  user: User;
  createdAt: Date;
  lastOnlineAt: Date | null;
  lastPlayerCount: number | null;
  lastMaxCount: number | null;
  peakPlayerCount: number | null;
  peakPlayerAt: Date | null;
  languages: Language[];
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
