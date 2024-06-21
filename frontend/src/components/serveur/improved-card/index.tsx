import { Category, Server, ServerStat } from "@/types/server"
import StatCard from "../stat-card";
import { Icon } from "@iconify/react/dist/iconify.js";

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


  
  return isLoading ? null : (
    <div className="p-2 shadow-md rounded-md bg-white dark:bg-zinc-800 flex flex-col gap-4">
      <div className="flex flex-row gap-2 items-center">
        <Icon icon="material-symbols:info" className="text-zinc-500 dark:text-zinc-300 w-4 h-4" />
        <div>
          Based on the interval that you selected with currently {stats.length} data points
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          title="Record of players"
          value={stats.reduce((acc, curr) => Math.max(acc, curr.playerCount), 0).toString()}
          icon={<Icon icon="mdi:crown" className="text-yellow-600 dark:text-yellow-300 w-6 h-6" />}
        />
        <StatCard
          title="Negative record of players"
          value={stats.reduce((acc, curr) => Math.min(acc, curr.playerCount), Number.MAX_SAFE_INTEGER).toString()}
          icon={<Icon icon="mdi:crown" className="text-red-700 dark:text-red-300 w-6 h-6" />}
        />
        <StatCard
          title="Number of connected on average"
          value={Math.round(stats.reduce((acc, curr) => acc + curr.playerCount, 0) / stats.length).toString()}
          icon={<Icon icon="mdi:account-multiple" className="text-blue-700 dark:text-blue-300 w-6 h-6" />}
        />
        <StatCard
          title="Median number of players"
          value={Math.round(calculateMedian(stats.map((stat) => stat.playerCount))).toString()}
          icon={<Icon icon="mdi:chart-bar" className="text-pink-700 dark:text-pink-300 w-6 h-6" />}
        />
        <StatCard
          title="Data registered since"
          value={new Date(server.createdAt).toLocaleDateString()}
          icon={<Icon icon="mdi:calendar" className="text-green-700 dark:text-green-300 w-6 h-6" />}
        />
        <StatCard
          title="Registered by"
          value={server.user?.username.toUpperCase()}
          icon={<Icon icon="mdi:account" className="text-violet-700 dark:text-violet-300 w-6 h-6" />}
        />
      </div>
    </div>
  );
}

export default ImprovedCard