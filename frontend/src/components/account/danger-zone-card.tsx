import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface DangerZoneCardProps {
  title: string;
  description: string;
  /** Destructive action node (button) wired by the caller. */
  action: React.ReactNode;
}

/**
 * Card with a destructive accent for irreversible actions. The action node is
 * supplied by the caller so handlers and loading state stay on the page.
 */
const DangerZoneCard = ({ title, description, action }: DangerZoneCardProps) => {
  const t = useTranslations("Account");

  return (
    <section className="overflow-hidden rounded-xl border border-destructive/40 bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-3 border-b border-destructive/40 bg-destructive/5 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{t("dangerZone.heading")}</h2>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </section>
  );
};

export default DangerZoneCard;
