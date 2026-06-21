import Link from "next/link";
import { Category, Server, ServerGrowthStat, ServerStat } from "@/types/server";
import ServerImage from "./server-image";
import ServerInfo from "./server-info";
import ServerStatus from "./server-status";
import ServerCategories from "./server-category";
import ServerActions from "./server-action";
import ServerChart from "./server-chart";
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
      href={`/servers/${server.id}/${server.name}`}
      className="group relative flex h-full w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
    >
      <ServerActions server={server} />

      {/* Ligne 1 : avatar · identité (nom, drapeaux, adresse, site) · métriques */}
      <div className="flex w-full items-start gap-3">
        <ServerImage imageUrl={server.imageUrl} name={server.name} />
        <div className="min-w-0 flex-1">
          <ServerInfo
            name={server.name}
            address={server.address}
            website={server.website}
            languages={server.languages}
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

      {/* Ligne 2 : sparkline pleine largeur */}
      {showChart && <ServerChart stats={stats} />}

      {/* Ligne 3 : badges (édition, version, catégories) · favori */}
      <div className="mt-auto flex w-full items-center justify-between gap-2">
        <ServerCategories categories={categories} version={server.version ?? undefined} type={server.type} isFull={isFull} />
        <FavoriteButton serverId={server.id} serverName={server.name} />
      </div>
    </Link>
  );
};

export default ServerCard;
