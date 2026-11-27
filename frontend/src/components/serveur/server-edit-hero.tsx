"use client";

import DashboardHero, { HERO_TILE_CLASSES } from "@/components/account/dashboard-hero";
import ClaimServerDialog from "@/components/serveur/claim-server-dialog";
import ServerImage from "@/components/serveur/card/server-image";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { resetServerImage, uploadServerImage } from "@/http/server";
import { cn } from "@/lib/utils";
import { Server } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Camera, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ServerEditHeroProps {
  server: Server;
  onChange: () => void;
}

export const ServerEditHero = ({ server, onChange }: ServerEditHeroProps) => {
  const t = useTranslations("Servers.edit");
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  const isOwner = user !== null && server.user?.id === user.id;
  const canEdit = user?.role === "admin" || (isOwner && server.ownerVerifiedAt !== null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast({ title: t("image.tooLargeTitle"), description: t("image.tooLargeDescription"), variant: "error" });
      return;
    }
    setPendingFile(file);
  };

  const upload = async (cropped: File) => {
    setIsBusy(true);
    try {
      await uploadServerImage(server.id, cropped, getToken() ?? "");
      setPendingFile(null);
      onChange();
      toast({ title: t("image.updated"), variant: "success" });
    } catch (error) {
      toast({
        title: t("image.uploadFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const reset = async () => {
    setIsBusy(true);
    try {
      await resetServerImage(server.id, getToken() ?? "");
      onChange();
      toast({ title: t("image.resetDone"), variant: "success" });
    } catch (error) {
      toast({
        title: t("image.resetFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const tile = (
    <div className={cn("group relative overflow-hidden bg-card", HERO_TILE_CLASSES)}>
      <ServerImage
        key={server.imageUrl}
        imageUrl={server.imageUrl}
        name={server.name}
        className="h-full w-full rounded-[inherit]"
      />
      {canEdit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          aria-label={t("image.change")}
          title={t("image.change")}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
            isBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </button>
      )}
    </div>
  );

  const action =
    (canEdit && server.hasCustomImage && (
      <Button variant="outline" size="sm" onClick={reset} disabled={isBusy}>
        <Icon icon="material-symbols:restart-alt" className="h-4 w-4" />
        {t("image.reset")}
      </Button>
    )) ||
    (!canEdit && isOwner && (
      <Button variant="outline" size="sm" onClick={() => setIsClaimOpen(true)} title={t("image.requiresVerification")}>
        <Icon icon="material-symbols:verified-outline" className="h-4 w-4" />
        {t("image.verify")}
      </Button>
    )) ||
    undefined;

  return (
    <>
      <DashboardHero
        title={t("heroTitle")}
        badge={t("heroBadge")}
        subtitle={canEdit ? t("image.hint") : t("heroSubtitle")}
        tile={tile}
        action={action}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      <ImageCropDialog
        file={pendingFile}
        title={t("image.cropTitle")}
        description={t("image.cropDescription")}
        onCancel={() => setPendingFile(null)}
        onConfirm={upload}
      />
      {isOwner && (
        <ClaimServerDialog
          serverId={server.id}
          serverName={server.name}
          open={isClaimOpen}
          onOpenChange={setIsClaimOpen}
          onVerified={onChange}
        />
      )}
    </>
  );
};

export default ServerEditHero;
