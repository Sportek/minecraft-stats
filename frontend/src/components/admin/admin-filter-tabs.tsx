import { cn } from "@/lib/utils";

export interface AdminFilterTab<T extends string> {
  value: T;
  label: string;
}

/** Segmented filter tabs (active = accent, inactive = muted) shared by admin list pages. */
export function AdminFilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: AdminFilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
