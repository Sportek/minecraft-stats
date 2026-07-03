import { ReactNode } from "react";

interface RankingsNavProps {
  items: { id: string; label: string; icon: ReactNode }[];
}

/**
 * Onglets d'ancrage vers chaque section de classement. Simples liens `#hash`
 * (aucun JS) : fonctionnent sans hydratation et restent crawlables.
 */
const RankingsNav = ({ items }: RankingsNavProps) => {
  return (
    <nav aria-label="Rankings" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:border-accent/50 hover:text-accent"
        >
          {item.icon}
          {item.label}
        </a>
      ))}
    </nav>
  );
};

export default RankingsNav;
