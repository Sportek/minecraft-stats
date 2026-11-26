"use client";

import { Input } from "@/components/ui/input";
import { useModerationVerdict } from "@/hooks/use-moderation-verdict";
import { searchServersForModeration } from "@/http/server";
import type { ModerationVerdict, Server } from "@/types/server";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ServerRow from "./server-row";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

const ModerationSearch = ({ token }: { token: string }) => {
  const t = useTranslations("Admin.serversPending");
  const { submitVerdict, actingId } = useModerationVerdict();
  const [search, setSearch] = useState("");
  const [found, setFound] = useState<{ term: string; servers: Server[] } | null>(null);

  const term = search.trim();
  const isActive = term.length >= MIN_SEARCH_LENGTH;
  const searching = isActive && found?.term !== term;
  const results = found?.term === term ? found.servers : [];

  useEffect(() => {
    if (!isActive) return;
    const debounce = setTimeout(() => {
      searchServersForModeration(term, token)
        .then((servers) => setFound({ term, servers }))
        .catch(() => setFound({ term, servers: [] }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounce);
  }, [token, term, isActive]);

  const handleVerdict = async (server: Server, verdict: ModerationVerdict) => {
    const saved = await submitVerdict({ id: server.id, name: server.name }, verdict);
    if (!saved) return;
    setFound((current) =>
      current && {
        ...current,
        servers: current.servers.map((s) =>
          s.id === server.id ? { ...s, moderationStatus: verdict } : s
        ),
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="border-b border-border p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("searchTitle")}</p>
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>
      {isActive && (
        <ul className="divide-y divide-border">
          {searching ? (
            <li className="px-6 py-8 text-center text-sm text-muted-foreground">{t("loadingList")}</li>
          ) : results.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-muted-foreground">{t("searchEmpty")}</li>
          ) : (
            results.map((server) => (
              <ServerRow
                key={server.id}
                server={server}
                acting={actingId === server.id}
                onVerdict={(verdict) => handleVerdict(server, verdict)}
              />
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ModerationSearch;
