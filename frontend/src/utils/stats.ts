import { ServerStat } from "@/types/server";

export const getLastStat = (stats: ServerStat[]) => {
  return stats.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};
