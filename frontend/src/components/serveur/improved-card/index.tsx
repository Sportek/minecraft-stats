import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useFormatter, useTranslations } from "next-intl";
import StatCard from "../stat-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ImprovedCardProps {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  isLoading: boolean;
}

const ImprovedCard = ({ server, stats, isLoading }: ImprovedCardProps) => {
  const format = useFormatter();
  const t = useTranslations("Servers");
  const calculateMedian = (numbers: number[]) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  };

  // Pic all-time persisté côté serveur. Repli sur le max de l'intervalle affiché
  // tant qu'aucun ping n'a renseigné la colonne (nouveau serveur).
  const windowedPeak = stats.reduce((acc, curr) => Math.max(acc, curr.playerCount), 0);
  const allTimePeak = server.peakPlayerCount ?? windowedPeak;

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon icon="material-symbols:info-outline" className="h-4 w-4" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon icon="material-symbols:info-outline" className="h-4 w-4" />
        <span>{t("stats.intervalNote", { count: stats.length })}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("stats.peakPlayers")}
          value={format.number(allTimePeak)}
          icon={<Icon icon="mdi:crown" className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.lowestPlayers")}
          value={format.number(
            stats.reduce((acc, curr) => Math.min(acc, curr.playerCount), Number.MAX_SAFE_INTEGER)
          )}
          icon={<Icon icon="mdi:trending-down" className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.averagePlayers")}
          value={format.number(
            Math.round(stats.reduce((acc, curr) => acc + curr.playerCount, 0) / stats.length)
          )}
          icon={<Icon icon="mdi:account-multiple" className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.medianPlayers")}
          value={format.number(Math.round(calculateMedian(stats.map((stat) => stat.playerCount))))}
          icon={<Icon icon="mdi:chart-bar" className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.dataSince")}
          value={format.dateTime(new Date(server.createdAt), { dateStyle: "medium" })}
          icon={<Icon icon="mdi:calendar" className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.trackedBy")}
          value={server.user?.username?.toUpperCase() ?? "—"}
          icon={<Icon icon="mdi:account" className="h-5 w-5" />}
        />
      </div>
    </section>
  );
};

export default ImprovedCard;
