"use client";

import ServerCard from "@/components/serveur/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { updateServerCustomization } from "@/http/server";
import { CardEffect, Category, Server, ServerStat, TitleFont } from "@/types/server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import BannerField from "./banner-field";
import EffectField from "./effect-field";
import TitleStyleField from "./title-style-field";

export interface CustomizationDraft {
  titleFont: TitleFont | null;
  titleColor: string | null;
  titleColorEnd: string | null;
  cardEffect: CardEffect | null;
}

interface ServerCustomizationFormProps {
  server: Server;
  stats: ServerStat[];
  categories: Category[];
  onUpdated: () => void;
}

/**
 * Éditeur de personnalisation de la fiche. La bannière s'envoie à part (multipart,
 * action immédiate) ; le style du titre et l'effet de carte forment un brouillon
 * enregistré d'un coup. L'aperçu est la vraie carte de la home, alimentée par le brouillon.
 */
const ServerCustomizationForm = ({ server, stats, categories, onUpdated }: ServerCustomizationFormProps) => {
  const t = useTranslations("Servers.customization");
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<CustomizationDraft>({
    titleFont: server.titleFont,
    titleColor: server.titleColor,
    titleColorEnd: server.titleColorEnd,
    cardEffect: server.cardEffect,
  });

  const patch = (changes: Partial<CustomizationDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const save = async () => {
    setIsSaving(true);
    try {
      await updateServerCustomization(server.id, draft, getToken() ?? "");
      toast({ title: t("saved"), variant: "success" });
      onUpdated();
    } catch (error) {
      toast({
        title: t("saveError"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t("preview.heading")}</h3>
        <p className="text-sm text-muted-foreground">{t("preview.hint")}</p>
        {/* La carte est un lien vers la fiche : on neutralise le clic pour ne pas perdre le brouillon. */}
        <div className="max-w-md" onClickCapture={(event) => event.preventDefault()}>
          <ServerCard server={{ ...server, ...draft }} stats={stats} categories={categories} growthStat={null} />
        </div>
      </section>

      <BannerField server={server} onUpdated={onUpdated} />
      <TitleStyleField name={server.name} value={draft} onChange={patch} />
      <EffectField value={draft.cardEffect} onChange={(cardEffect) => patch({ cardEffect })} />

      <Button type="button" onClick={save} disabled={isSaving}>
        {isSaving ? t("saving") : t("save")}
      </Button>
    </div>
  );
};

export default ServerCustomizationForm;
