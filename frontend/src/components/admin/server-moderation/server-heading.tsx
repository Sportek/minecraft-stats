import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Server } from "@/types/server";
import ModerationStatusBadge from "./moderation-status-badge";

interface ServerHeadingProps {
  server: Pick<Server, "id" | "name" | "address" | "moderationStatus">;
  meta: string;
}

const ServerHeading = ({ server, meta }: ServerHeadingProps) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/servers/${server.id}`} className="font-medium text-foreground hover:text-accent">
        {server.name}
      </Link>
      <Badge variant="secondary">{server.address}</Badge>
      <ModerationStatusBadge status={server.moderationStatus} />
    </div>
    <p className="text-xs text-muted-foreground">{meta}</p>
  </div>
);

export default ServerHeading;
