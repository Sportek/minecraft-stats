import { Category, Server, ServerStat } from "@/types/server"

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

  const getFirstStat = () => {
    if (stats.length === 0) {
      return new Date()
    }
    return stats[0]
  }


  
  return (
    isLoading ? null : (
      <div className="bg-zinc-200 rounded-md p-4 flex flex-col shadow-sm w-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-row items-center gap-4">
          <div>Connected record</div>
          <div className="text-sm font-semibold">{stats.reduce((acc, curr) => Math.max(acc, curr.playerCount), 0)}</div>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div>Number of connected on average</div>
          <div className="text-sm font-semibold">{Math.round(stats.reduce((acc, curr) => acc + curr.playerCount, 0) / stats.length)}</div>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div>Median number of players</div>
          <div className="text-sm font-semibold">{Math.round(calculateMedian(stats.map((stat) => stat.playerCount)))}</div>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div>Data registered since</div>
          <div className="text-sm font-semibold">{new Date(getFirstStat()?.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
    )
  );
}

export default ImprovedCard