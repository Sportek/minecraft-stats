import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { serverPath } from "@/lib/server-url";
import { Server } from "@/types/server";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

/** Ce que voit un propriétaire non vérifié à la place de l'éditeur. La revendication se lance depuis la fiche. */
const CustomizationLocked = ({ server }: { server: Server }) => {
  const t = useTranslations("Servers.customization.locked");

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        {t("description")}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href={serverPath(server.id, server.name)}>{t("cta")}</Link>
      </Button>
    </div>
  );
};

export default CustomizationLocked;
