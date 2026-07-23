"use client";

import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * Sélecteur segmenté des en-têtes de graphique. Il n'existe que pour tenir
 * ensemble les commandes qui cohabitent dans la même carte : dès qu'il y en a
 * deux, un écart de padding ou de focus se voit immédiatement.
 */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className="inline-flex h-9 items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5"
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={cn(
          "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          value === option.value
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);
