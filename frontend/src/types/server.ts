import { User } from "./auth";

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
  stats: ServerStat[];
  categories: Category[];
}

export interface ServerStat {
  id: number;
  serverId: number;
  playerCount: number;
  maxCount: number;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  createdAt: Date;
}
