import { User } from "./auth";

export interface Server {
  id: number;
  name: string;
  address: string;
  port: number;
  imageUrl: string;
  user: User;
  createdAt: Date;
}

export interface ServerStat {
  id: number;
  serverId: number;
  playerCount: number;
  maxCount: number;
  createdAt: Date;
}
