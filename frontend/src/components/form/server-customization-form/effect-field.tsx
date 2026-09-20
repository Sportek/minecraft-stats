"use client";

import { CARD_EFFECTS } from "@/lib/server-customization";
import { cn } from "@/lib/utils";
import { CardEffect } from "@/types/server";
import { useTranslations } from "next-intl";

interface EffectFieldProps {
  value: CardEffect | null;
  onChange: (effect: CardEffect | null) => void;
}

const EffectField = ({ value, onChange }: EffectFieldProps) => {
  const t = useTranslations("Servers.customization.effect");
  const effects: (CardEffect | null)[] = [null, ...CARD_EFFECTS];

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("heading")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div role="radiogroup" aria-label={t("heading")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {effects.map((effect) => {
          const key = effect ?? "none";
          const selected = value === effect;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(effect)}
              className={cn(
                "flex flex-col gap-0.5 rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-accent/50",
                selected && "border-accent ring-2 ring-accent/30"
              )}
            >
              <span className="text-sm font-medium text-foreground">{t(`options.${key}.label`)}</span>
              <span className="text-xs text-muted-foreground">{t(`options.${key}.description`)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default EffectField;
