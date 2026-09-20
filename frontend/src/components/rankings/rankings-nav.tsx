"use client";

import { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface RankingsNavProps {
  label: string;
  items: { sort: string; label: string; icon: ReactNode }[];
}

/**
 * Onglets vers chaque page de classement, montés une seule fois dans le layout
 * de /rankings : ils survivent au changement d'onglet et seul leur style actif
 * bouge. Les liens restent rendus côté serveur (crawlables) ; le seul JS client
 * sert à lire le segment actif.
 */
const RankingsNav = ({ label, items }: RankingsNavProps) => {
  const activeSort = useSelectedLayoutSegment();

  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.sort}
          href={`/rankings/${item.sort}`}
          aria-current={item.sort === activeSort ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-xs transition-colors",
            item.sort === activeSort
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-accent",
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default RankingsNav;
