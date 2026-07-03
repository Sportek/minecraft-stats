import { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface RankingsNavProps {
  items: { href: string; label: string; icon: ReactNode; active?: boolean }[];
}

/**
 * Onglets vers chaque page de classement. Simples liens server-rendered
 * (aucun JS client) : fonctionnent sans hydratation et restent crawlables.
 */
const RankingsNav = ({ items }: RankingsNavProps) => {
  return (
    <nav aria-label="Rankings" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-xs transition-colors",
            item.active
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
