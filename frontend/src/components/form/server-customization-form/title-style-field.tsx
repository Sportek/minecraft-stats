"use client";

import ServerTitle from "@/components/serveur/server-title";
import { Button } from "@/components/ui/button";
import { TITLE_FONTS } from "@/lib/server-customization";
import { cn } from "@/lib/utils";
import { TitleFont } from "@/types/server";
import { useTranslations } from "next-intl";
import type { CustomizationDraft } from "./index";

// Couleurs proposées à la première activation : l'accent du site, puis un violet
// qui s'en éloigne assez pour que le dégradé se voie tout de suite.
const DEFAULT_COLOR = "#0099ff";
const DEFAULT_GRADIENT_END = "#a855f7";

const COLOR_INPUT_CLASS = "h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-0.5";

interface TitleStyleFieldProps {
  name: string;
  value: CustomizationDraft;
  onChange: (changes: Partial<CustomizationDraft>) => void;
}

const TitleStyleField = ({ name, value, onChange }: TitleStyleFieldProps) => {
  const t = useTranslations("Servers.customization.titleStyle");
  const fonts: (TitleFont | null)[] = [null, ...TITLE_FONTS];
  const hasGradient = value.titleColorEnd !== null;

  const toggleGradient = () =>
    onChange(
      hasGradient
        ? { titleColorEnd: null }
        : { titleColor: value.titleColor ?? DEFAULT_COLOR, titleColorEnd: DEFAULT_GRADIENT_END }
    );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("heading")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div role="radiogroup" aria-label={t("fontLabel")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {fonts.map((font) => {
          const selected = value.titleFont === font;
          return (
            <button
              key={font ?? "default"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ titleFont: font })}
              className={cn(
                "flex min-w-0 flex-col gap-0.5 rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-accent/50",
                selected && "border-accent ring-2 ring-accent/30"
              )}
            >
              <ServerTitle
                name={name}
                style={{ titleFont: font, titleColor: value.titleColor, titleColorEnd: value.titleColorEnd }}
                className="text-base"
              />
              <span className="text-xs text-muted-foreground">{t(`fonts.${font ?? "default"}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="color"
            value={value.titleColor ?? DEFAULT_COLOR}
            onChange={(event) => onChange({ titleColor: event.target.value })}
            className={COLOR_INPUT_CLASS}
          />
          {hasGradient ? t("colorStart") : t("color")}
        </label>
        {value.titleColorEnd !== null && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="color"
              value={value.titleColorEnd}
              onChange={(event) => onChange({ titleColorEnd: event.target.value })}
              className={COLOR_INPUT_CLASS}
            />
            {t("colorEnd")}
          </label>
        )}
        <Button type="button" variant="outline" size="sm" onClick={toggleGradient}>
          {hasGradient ? t("removeGradient") : t("addGradient")}
        </Button>
        {value.titleColor !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ titleColor: null, titleColorEnd: null })}
          >
            {t("resetColor")}
          </Button>
        )}
      </div>
      {value.titleColor === null && <p className="text-xs text-muted-foreground">{t("themeColorHint")}</p>}
    </section>
  );
};

export default TitleStyleField;
