"use client";

import ServerBanner from "@/components/serveur/server-banner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { deleteServerBanner, uploadServerBanner } from "@/http/server";
import { BANNER_HEIGHT, BANNER_WIDTH } from "@/lib/server-customization";
import { Server } from "@/types/server";
import { ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

interface BannerFieldProps {
  server: Server;
  onUpdated: () => void;
}

/** Envoi et suppression de la bannière : chaque action est immédiate, hors du bouton « Enregistrer ». */
const BannerField = ({ server, onUpdated }: BannerFieldProps) => {
  const t = useTranslations("Servers.customization.banner");
  const { getToken } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, successTitle: string) => {
    setIsBusy(true);
    try {
      await action();
      toast({ title: successTitle, variant: "success" });
      onUpdated();
    } catch (error) {
      toast({
        title: t("errorTitle"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Vidé pour pouvoir renvoyer le même fichier après un refus.
    event.target.value = "";
    if (file) run(() => uploadServerBanner(server.id, file, getToken() ?? ""), t("uploaded"));
  };

  const pickLabel = server.bannerUrl ? t("replace") : t("upload");

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("description", { width: BANNER_WIDTH, height: BANNER_HEIGHT })}
        </p>
      </div>

      {server.bannerUrl ? (
        <ServerBanner
          url={server.bannerUrl}
          alt={t("alt", { name: server.name })}
          className="h-auto w-[468px] max-w-full rounded-md border border-border"
        />
      ) : (
        <div className="flex aspect-[468/60] w-[468px] max-w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {isBusy ? t("working") : pickLabel}
        </Button>
        {server.bannerUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => run(() => deleteServerBanner(server.id, getToken() ?? ""), t("removed"))}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("remove")}
          </Button>
        )}
      </div>
    </section>
  );
};

export default BannerField;
