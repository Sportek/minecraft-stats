import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // `bg-foreground/10` stays visible on any surface (canvas, card) in both themes —
  // unlike `bg-muted`, which blends into the light background.
  return <div className={cn("animate-pulse rounded-md bg-foreground/10", className)} {...props} />;
}

export { Skeleton };
