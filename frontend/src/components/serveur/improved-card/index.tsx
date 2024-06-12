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
    <div className="grid sm:grid-cols-2 gap-4">
      <StatCard
        title="Record of players"
        value={stats.reduce((acc, curr) => Math.max(acc, curr.playerCount), 0).toString()}
        icon={<Icon icon="mdi:crown" className="text-yellow-600 w-6 h-6" />}
      />
      <StatCard
        title="Negative record of players"
        value={stats.reduce((acc, curr) => Math.min(acc, curr.playerCount), Number.MAX_SAFE_INTEGER).toString()}
        icon={<Icon icon="mdi:crown" className="text-red-700 w-6 h-6" />}
      />
      <StatCard
        title="Number of connected on average"
        value={Math.round(stats.reduce((acc, curr) => acc + curr.playerCount, 0) / stats.length).toString()}
        icon={<Icon icon="mdi:account-multiple" className="text-blue-700 w-6 h-6" />}
      />
      <StatCard
        title="Median number of players"
        value={Math.round(calculateMedian(stats.map((stat) => stat.playerCount))).toString()}
        icon={<Icon icon="mdi:chart-bar" className="text-pink-700 w-6 h-6" />}
      />
      <StatCard
        title="Data registered since"
        value={new Date(server.createdAt).toLocaleDateString()}
        icon={<Icon icon="mdi:calendar" className="text-green-700 w-6 h-6" />}
      />
      <StatCard
        title="Registered by"
        value={server.user?.username.toUpperCase()}
        icon={<Icon icon="mdi:account" className="text-violet-700 w-6 h-6" />}
      />
    </div>
  );
}

export default ImprovedCard