import { User } from "./auth";

export interface Server {
  id: string;
  name: string;
  address: string;
  port: number;
  imageUrl: string;
  user: User;
}
