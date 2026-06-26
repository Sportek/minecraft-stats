import { Icon } from "@iconify/react/dist/iconify.js";
import { useFormatter, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ServerGrowthStat, ServerStat } from "@/types/server";
import { getLastStat } from "@/utils/stats";

interface ServerStatusProps {
  stats: ServerStat[];
  growthStat: ServerGrowthStat | null;
  lastOnlineAt?: string | null;
}

const formatGrowth = (growth: number) => `${growth >= 0 ? "+" : ""}${Math.round(growth * 100)}%`;

const StatusReading = ({ online, label }: { online: boolean; label: string }) => (
  <div className="flex flex-row items-center gap-2">
    <span
      className={cn(
        "h-2.5 w-2.5 rounded-full ring-2",
        online ? "bg-success ring-success/20" : "bg-muted-foreground/50 ring-muted-foreground/10"
      )}
    />
    <span className="font-semibold tabular-nums">{label}</span>
  </div>
);

const ServerStatus = ({ stats, growthStat }: ServerStatusProps) => {
  const format = useFormatter();
  const t = useTranslations("Servers");
  const lastStat = stats.length > 0 ? getLastStat(stats) : null;
  const playerCount = lastStat?.playerCount;

  if (playerCount == null) {
    return (
      <div className="flex flex-col items-end">
        <StatusReading online={false} label="N/A" />
      </div>
    );
  }

  const monthlyGrowth = growthStat?.monthlyGrowth;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <StatusReading online label={format.number(playerCount)} />
      {monthlyGrowth != null && (
        <div className="flex flex-row items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Icon icon="material-symbols:info-outline" className="text-muted-foreground w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">{t("card.status.growthTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className={cn("text-xs font-medium", monthlyGrowth >= 0 ? "text-success" : "text-destructive")}>
            {formatGrowth(monthlyGrowth)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
