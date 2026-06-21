import { ReactNode } from "react";

interface AuthCardProps {
  /** Neutral icon tile rendered in the card header. */
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Shared shell for the authentication screens: a centered card with a neutral
 * icon tile, a bold title and a muted subtitle, followed by the body.
 */
const AuthCard = ({ icon, title, subtitle, children }: AuthCardProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="px-7 pt-7">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            {icon}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h1>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>

      <div className="px-7 pb-7 pt-6">{children}</div>
    </div>
  );
};

export default AuthCard;
