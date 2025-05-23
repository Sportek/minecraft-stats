import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import StatCard from "../stat-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ImprovedCardProps {
  server: Server,
  stats: ServerStat[],
  categories: Category[],
  isLoading: boolean,
}

const ImprovedCard = ({ server, stats, categories, isLoading }: ImprovedCardProps) => {
  const calculateMedian = (numbers: number[]) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-2 items-center">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-2 items-center">
        <Icon icon="material-symbols:info" className="text-zinc-500 dark:text-zinc-300 w-4 h-4" />
        <div>Based on the interval that you selected with currently {stats.length} data points</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          title="Peak Players"
          value={new Intl.NumberFormat("en-US").format(stats.reduce((acc, curr) => Math.max(acc, curr.playerCount), 0))}
          icon={<Icon icon="mdi:crown" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
        <StatCard
          title="Lowest Players"
          value={new Intl.NumberFormat("en-US").format(
            stats.reduce((acc, curr) => Math.min(acc, curr.playerCount), Number.MAX_SAFE_INTEGER)
          )}
          icon={<Icon icon="mdi:crown" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
        <StatCard
          title="Average Players"
          value={new Intl.NumberFormat("en-US").format(
            Math.round(stats.reduce((acc, curr) => acc + curr.playerCount, 0) / stats.length)
          )}
          icon={<Icon icon="mdi:account-multiple" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
        <StatCard
          title="Median Players"
          value={new Intl.NumberFormat("en-US").format(
            Math.round(calculateMedian(stats.map((stat) => stat.playerCount)))
          )}
          icon={<Icon icon="mdi:chart-bar" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
        <StatCard
          title="Data Since"
          value={new Date(server.createdAt).toLocaleDateString()}
          icon={<Icon icon="mdi:calendar" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
        <StatCard
          title="Tracked By"
          value={server.user?.username.toUpperCase()}
          icon={<Icon icon="mdi:account" className="text-stats-blue-600 dark:text-stats-blue-400 w-6 h-6" />}
        />
      </div>
    </div>
  );
}

export default ImprovedCard