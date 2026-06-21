import { cn } from "@/lib/utils";
import { LetterTile } from "@/components/ui/letter-tile";

interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  /** When provided, a square avatar tile floats over the gradient band. */
  avatar?: { name: string; src?: string | null };
}

/**
 * Gradient banner used at the top of every dashboard page. With `avatar` it
 * renders the floating profile tile (image, or a name-hashed letter tile shared
 * with the server cards); without it, a plain title + action header. The title
 * always sits on the card surface — never over the dark gradient — for contrast.
 */
const DashboardHero = ({ title, subtitle, badge, action, avatar }: DashboardHeroProps) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
    <div className="relative h-20 bg-[linear-gradient(110deg,hsl(204_100%_32%),hsl(214_90%_22%))]">
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
    </div>
    <div className="px-6 pb-5">
      {avatar &&
        (avatar.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar.src}
            alt=""
            className="-mt-10 h-[72px] w-[72px] rounded-2xl border-4 border-card object-cover shadow-md"
          />
        ) : (
          <LetterTile
            name={avatar.name}
            className="-mt-10 h-[72px] w-[72px] rounded-2xl border-4 border-card text-2xl shadow-md"
          />
        ))}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          avatar ? "mt-3" : "mt-5"
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {badge && (
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  </div>
);

export default DashboardHero;
