import { User } from "./auth";

export interface Language {
  id: number;
  code: string;
  name: string;
  flag: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Server {
  id: number;
  name: string;
  address: string;
  port: number;
  version: string | null;
  imageUrl: string;
  user: User;
  createdAt: Date;
  lastOnlineAt: Date | null;
  languages: Language[];
}

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
