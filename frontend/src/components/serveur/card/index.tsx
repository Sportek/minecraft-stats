import { Link } from "@/i18n/navigation";
import { cardEffectVars } from "@/lib/server-customization";
import { serverPath } from "@/lib/server-url";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import ServerBanner from "../server-banner";
import ServerImage from "./server-image";
import ServerInfo from "./server-info";
import ServerStatus from "./server-status";
import ServerCategories from "./server-category";
import ServerActions from "./server-action";
import ServerChart from "./server-chart";
import CardEffectLayers from "./card-effect-layers";
import FavoriteButton from "./favorite-button";

interface ServerCardProps {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  growthStat: ServerGrowthStat | null;
  isFull?: boolean;
  showChart?: boolean;
}

const ServerCard = ({ server, stats, categories, growthStat, isFull, showChart = true }: ServerCardProps) => {
  return (
    <Link
      href={serverPath(server.id, server.name)}
      data-card-effect={server.cardEffect ?? undefined}
      style={cardEffectVars(server)}
      className="group relative flex h-full w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs transition-all duration-150 ease-in-out hover:z-20 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md focus-within:z-20"
    >
      {/* `hover:z-20` : l'info-bulle et le popup des drapeaux vivent dans la carte (pas de portail) et
          dépassent sur les voisines ; sans ça, les cartes suivantes dans le DOM les recouvrent. */}
      {server.cardEffect && <CardEffectLayers />}
      <ServerActions server={server} />

      {/* Bannière : en couverture, pleine largeur (on annule le padding de la carte) et au même
          arrondi que ses coins. Toujours visible : c'est l'identité visuelle de l'owner. */}
      {server.bannerUrl && (
        <div className="-mx-4 -mt-4 overflow-hidden rounded-t-[calc(var(--radius)-1px)]">
          <ServerBanner url={server.bannerUrl} alt="" className="block h-auto w-full" />
        </div>
      )}

      {/* Row 1: avatar · identity (name, flags, address, website) · metrics */}
      <div className="flex w-full items-start gap-3">
        <ServerImage imageUrl={server.imageUrl} name={server.name} />
        <div className="min-w-0 flex-1">
          <ServerInfo
            name={server.name}
            address={server.address}
            website={server.website}
            languages={server.languages}
            titleStyle={server}
          />
        </div>
        <div className="shrink-0">
          <ServerStatus
            stats={stats}
            growthStat={growthStat}
            lastOnlineAt={server.lastOnlineAt ? new Date(server.lastOnlineAt).toISOString() : null}
          />
        </div>
      </div>

      {/* Row 2: full-width sparkline */}
      {showChart && <ServerChart stats={stats} />}

      {/* Row 3: badges (edition, version, categories) · favorite */}
      <div className="mt-auto flex w-full items-center justify-between gap-2">
        <ServerCategories categories={categories} version={server.version ?? undefined} type={server.type} isFull={isFull} />
        <FavoriteButton serverId={server.id} serverName={server.name} />
      </div>
    </Link>
  );
};

export default ServerCard;
