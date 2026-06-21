import { cn } from "@/lib/utils";

/** Stable hue derived from a name — used as the gradient background for letter tiles. */
export const hueFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

interface LetterTileProps {
  name: string;
  className?: string;
}

/**
 * Initial-on-gradient avatar tile. Shared fallback for servers (no favicon) and
 * users (no avatar). Size and radius are controlled by the caller via `className`.
 */
export const LetterTile = ({ name, className }: LetterTileProps) => {
  const hue = hueFromName(name);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center font-extrabold text-white",
        className
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${hue + 26} 70% 26%))` }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
};
