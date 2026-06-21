import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  /** When provided, a square avatar tile floats over the gradient band. */
  avatar?: { fallback: string; src?: string | null };
}

/**
 * Gradient banner used at the top of every dashboard page. With `avatar` it
 * renders the floating profile tile; without it, a plain title + action header.
 */
const DashboardHero = ({ title, subtitle, badge, action, avatar }: DashboardHeroProps) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
    <div className="relative h-20 bg-[linear-gradient(110deg,hsl(204_100%_32%),hsl(214_90%_22%))]">
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
    </div>
    <div
      className={cn(
        "relative flex flex-col gap-3 px-6 pb-5 sm:flex-row sm:items-end sm:justify-between",
        avatar ? "pt-3" : "pt-5"
      )}
    >
      <div className={cn("flex items-end gap-4", avatar && "-mt-12")}>
        {avatar &&
          (avatar.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar.src}
              alt=""
              className="h-[72px] w-[72px] rounded-2xl border-4 border-card object-cover shadow-md"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-card bg-accent text-2xl font-extrabold text-accent-foreground shadow-md">
              {avatar.fallback}
            </div>
          ))}
        <div className={cn("min-w-0", avatar && "pb-1")}>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {badge && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

export default DashboardHero;
