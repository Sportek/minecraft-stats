import { Icon } from "@iconify/react/dist/iconify.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ServerGrowthStat, ServerStat } from "@/types/server";
import { getLastStat } from "@/utils/stats";

interface ServerStatusProps {
  stats: ServerStat[];
  growthStat: ServerGrowthStat | null;
  lastOnlineAt?: string | null;
}

const ServerStatus = ({ stats, growthStat, lastOnlineAt }: ServerStatusProps) => {
  const getFormattedTimeSinceLastOnline = () => {
    if (lastOnlineAt) {
      const millisecondsInADay = 1000 * 60 * 60 * 24;
      const millisecondsInAWeek = millisecondsInADay * 7;
      const millisecondsInAMonth = millisecondsInADay * 30;

      const elapsedTime = Date.now() - new Date(lastOnlineAt).getTime();

      if (elapsedTime >= millisecondsInAMonth) {
        const months = Math.floor(elapsedTime / millisecondsInAMonth);
        return `${months} months`;
      } else if (elapsedTime >= millisecondsInAWeek) {
        const weeks = Math.floor(elapsedTime / millisecondsInAWeek);
        return `${weeks} weeks`;
      } else {
        const days = Math.floor(elapsedTime / millisecondsInADay);
        return `${days} days`;
      }
    }
    return "never";
  };

  const getFormattedGrowth = (growth: number | null) => {
    if (growth == null) {
      return null;
    }
    if (growth >= 0) {
      return `+${Math.round(growth * 100)}%`;
    }
    return `${Math.round((growth * 100))}%`;
  };

  if (!stats || stats.length === 0) {
    return (
      <div className="flex flex-col items-end">
        <div className="flex flex-row items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-500 rounded-full" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <div>N/A</div>
          </div>
        </div>
      </div>
    );
  }

  const lastStat = getLastStat(stats);

  if (!lastStat || lastStat.playerCount == null) {
    return (
      <div className="flex flex-col items-end">
        <div className="flex flex-row items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-500 rounded-full" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <div>N/A</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-row items-center gap-2">
        <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-500 rounded-full" />
        </div>
        <div className="flex flex-col justify-center items-center">
          <div>{new Intl.NumberFormat("en-US").format(lastStat.playerCount)}</div>
        </div>
      </div>
      {growthStat?.monthlyGrowth != null && (
        <div className="flex flex-row items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Icon
                    icon="material-symbols:info-outline"
                    className="text-zinc-700 dark:text-zinc-300 w-3 h-3"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">
                <div>
                  This shows how the average player count this week compares to the average for the past 30
                  days. Positive values indicate growth.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div
            className={cn(
              growthStat.monthlyGrowth != null && growthStat.monthlyGrowth >= 0
                ? "text-green-500"
                : "text-red-500",
              "text-xs"
            )}
          >
            {getFormattedGrowth(growthStat.monthlyGrowth)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatus; 