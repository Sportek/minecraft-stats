"use client";

import { useModerationVerdict } from "@/hooks/use-moderation-verdict";
import type { ModerationVerdict, Server } from "@/types/server";
import { ClipboardCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import ServerRow from "./server-row";

interface PendingQueueProps {
  servers: Server[];
  loading: boolean;
  onReviewed: (serverId: number) => void;
}

const PendingQueue = ({ servers, loading, onReviewed }: PendingQueueProps) => {
  const t = useTranslations("Admin.serversPending");
  const { submitVerdict, actingId } = useModerationVerdict();

  const handleVerdict = async (server: Server, verdict: ModerationVerdict) => {
    const saved = await submitVerdict({ id: server.id, name: server.name }, verdict);
    if (saved) onReviewed(server.id);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      {loading ? (
        <div className="px-6 py-12 text-center text-muted-foreground">{t("loadingList")}</div>
      ) : servers.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {servers.map((server) => (
            <ServerRow
              key={server.id}
              server={server}
              acting={actingId === server.id}
              onVerdict={(verdict) => handleVerdict(server, verdict)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingQueue;
