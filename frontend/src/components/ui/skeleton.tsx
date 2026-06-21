import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // `bg-foreground/10` reste visible sur n'importe quelle surface (canvas, card)
  // dans les deux thèmes — contrairement à `bg-muted` qui se confond avec le fond clair.
  return <div className={cn("animate-pulse rounded-md bg-foreground/10", className)} {...props} />;
}

export { Skeleton };
