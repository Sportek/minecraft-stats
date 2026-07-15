import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import { getLastStat } from "@/utils/stats";
import { formatGrowth } from "@/lib/format";
import ServerImage from "./card/server-image";
import ServerInfo from "./card/server-info";
import ServerCategories from "./card/server-category";
import VoteButton from "./vote-button";
import ClaimServerButton from "./claim-server-button";

interface ServerDetailHeaderProps {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
}


/**
 * Server detail page header card. Composes the existing card subcomponents
 * (image, info, categories) and adds a right-aligned "Players online" block.
 */
const ServerDetailHeader = ({ server, stats, categories, growthStat }: ServerDetailHeaderProps) => {
  const format = useFormatter();
  const t = useTranslations("Servers");
  const lastStat = stats.length > 0 ? getLastStat(stats) : null;
  const playerCount = lastStat?.playerCount ?? server.lastPlayerCount;
  const monthlyGrowth = growthStat?.monthlyGrowth;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      {/* Subtle accent radial glow in the top-left corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,hsl(var(--accent)/0.06),transparent_55%)]"
      />

      <div className="relative flex flex-col gap-4 p-4 sm:p-6">
        {/* Row 1: avatar + name/address/website · players online */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ServerImage
              imageUrl={server.imageUrl}
              name={server.name}
              className="h-[60px] w-[60px] rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <ServerInfo
                name={server.name}
                address={server.address}
                website={server.website}
                languages={server.languages}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-0.5 sm:flex-col sm:items-end">
            <span className="text-xs text-muted-foreground">{t("detail.playersOnline")}</span>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success ring-2 ring-success/20" />
              <span className="text-3xl font-extrabold leading-none tabular-nums text-foreground">
                {playerCount != null ? format.number(playerCount) : "N/A"}
              </span>
              {monthlyGrowth != null && (
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    monthlyGrowth >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {formatGrowth(monthlyGrowth)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: badges · vote — the vote control fills the dead space beside
            the categories instead of stretching the right column. */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <ServerCategories
            categories={categories}
            version={server.version ?? undefined}
            type={server.type}
            isFull
          />
          <VoteButton
            serverId={server.id}
            serverName={server.name}
            initialVoteCount={server.voteCount}
          />
        </div>

        {/* Row 3: revendication de propriété (badge vérifié ou bouton "Revendiquer"). */}
        <div className="flex justify-end">
          <ClaimServerButton
            serverId={server.id}
            serverName={server.name}
            verified={server.ownerVerifiedAt !== null}
          />
        </div>
      </div>
    </section>
  );
};

export default ServerDetailHeader;
