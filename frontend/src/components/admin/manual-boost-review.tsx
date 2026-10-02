"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { searchServersForBoostReview } from "@/http/server";
import { Link } from "@/i18n/navigation";
import type { BoostStatus, Server } from "@/types/server";
import { Check, HelpCircle, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** Serveur visé par un verdict : seul ce dont l'appelant a besoin pour confirmer. */
export interface BoostVerdictTarget {
  id: number;
  name: string;
}

export const BoostStatusBadge = ({ status }: { status: BoostStatus }) => {
  const t = useTranslations("Admin.boostReports");
  const labels: Record<BoostStatus, string> = {
    boosting: t("statusBoosting"),
    clean: t("statusClean"),
    inconclusive: t("statusInconclusive"),
  };
  return (
    <Badge variant={status === "boosting" ? "destructive" : "outline"}>{labels[status]}</Badge>
  );
};

interface ManualBoostReviewProps {
  token: string;
  actingId: number | null;
  /** Renvoie `true` si le verdict a été enregistré (l'admin peut annuler la confirmation). */
  onVerdict: (target: BoostVerdictTarget, verdict: BoostStatus) => Promise<boolean>;
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Verdict manuel sur un serveur que la détection n'a pas remonté.
 *
 * La file ne couvre que les serveurs ayant assez de relevés pour être scorés, et un
 * tricheur discret peut rester sous le seuil : l'admin doit pouvoir trancher sur
 * n'importe quel serveur. Le verdict passe par le même endpoint que la file, donc il
 * atterrit dans le même journal — avec le score du moment (ou 0 sans score), ce qui
 * en fait justement un faux négatif utile pour recalibrer.
 */
const ManualBoostReview = ({ token, actingId, onVerdict }: ManualBoostReviewProps) => {
  const t = useTranslations("Admin.boostReports.manual");
  const tVerdict = useTranslations("Admin.boostReports");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);
  // Résultats étiquetés par la requête qui les a produits : tant qu'ils ne
  // correspondent pas à la saisie courante, la recherche est en cours.
  const [found, setFound] = useState<{ query: string; servers: Server[] } | null>(null);

  const active = debouncedQuery.length >= MIN_SEARCH_LENGTH;
  const searching = active && found?.query !== debouncedQuery;
  const results = active && found?.query === debouncedQuery ? found.servers : [];

  useEffect(() => {
    if (debouncedQuery.length < MIN_SEARCH_LENGTH) return;
    let cancelled = false;
    searchServersForBoostReview(debouncedQuery, token)
      .catch(() => [])
      .then((servers) => {
        if (!cancelled) setFound({ query: debouncedQuery, servers });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, token]);

  const handleVerdict = async (server: Server, verdict: BoostStatus) => {
    const saved = await onVerdict({ id: server.id, name: server.name }, verdict);
    if (!saved) return;
    setFound((current) =>
      current && {
        ...current,
        servers: current.servers.map((s) =>
          s.id === server.id ? { ...s, boostStatus: verdict } : s
        ),
      }
    );
  };

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {searching ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("searching")}</p>
      ) : active && results.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        results.length > 0 && (
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {results.map((server) => {
              const busy = actingId === server.id;
              return (
                <li
                  key={server.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/servers/${server.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {server.name}
                    </Link>
                    <Badge variant="secondary">{server.address}</Badge>
                    {server.boostStatus && <BoostStatusBadge status={server.boostStatus} />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleVerdict(server, "boosting")}
                      disabled={busy || server.boostStatus === "boosting"}
                      className="gap-1.5"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {tVerdict("verdictBoosting")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleVerdict(server, "clean")}
                      disabled={busy || server.boostStatus === "clean"}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      {tVerdict("verdictClean")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerdict(server, "inconclusive")}
                      disabled={busy || server.boostStatus === "inconclusive"}
                      className="gap-1.5"
                    >
                      <HelpCircle className="h-4 w-4" />
                      {tVerdict("verdictInconclusive")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </section>
  );
};

export default ManualBoostReview;
