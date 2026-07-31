"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LockIcon, useUnlock } from "@/components/upsell/unlock";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Allowance,
  Availability,
  bucketCount,
  earliestSelectable,
  effectiveResolution,
  Period,
  presetAvailability,
  PRESETS,
  RESOLUTIONS,
  Resolution,
  resolutionAvailability,
  shiftPeriod,
} from "./period";

interface PeriodPickerProps {
  value: Period;
  onChange: (period: Period) => void;
  disabled: boolean;
  allowance: Allowance;
}

/** `YYYY-MM-DD` en heure locale, format attendu par `<input type="date">`. */
const toDateInputValue = (epochMs: number) => {
  const date = new Date(epochMs);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(epochMs - offset).toISOString().slice(0, 10);
};

const fromDateInputValue = (value: string, endOfDay: boolean) => {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return date.getTime();
};

export const PeriodPicker = ({ value, onChange, disabled, allowance }: PeriodPickerProps) => {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  // « Maintenant » est figé à l'ouverture du panneau : le lire pendant le rendu
  // donnerait une valeur différente à chaque frame (et entre serveur et client).
  const [now, setNow] = useState(0);

  const resolution = effectiveResolution(value);
  const points = bucketCount(value, resolution);

  const rangeLabel =
    value.kind === "preset"
      ? t(`period.presets.${value.preset}`)
      : t("period.customRange", {
          from: format.dateTime(new Date(value.from), { dateStyle: "medium" }),
          to: format.dateTime(new Date(value.to), { dateStyle: "medium" }),
        });

  const selectPreset = (preset: (typeof PRESETS)[number]) => {
    onChange({ kind: "preset", preset, resolution: value.resolution });
  };

  const selectCustom = () => {
    if (value.kind === "custom") return;
    const to = Date.now();
    onChange({ kind: "custom", from: to - 30 * 24 * 60 * 60 * 1000, to, resolution: value.resolution });
  };

  const setResolution = (next: Resolution | "auto") => {
    onChange({ ...value, resolution: next });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setNow(Date.now());
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          className="h-9 justify-between gap-2 font-normal"
          aria-label={t("period.ariaLabel")}
        >
          <Icon icon="material-symbols:date-range-outline" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {rangeLabel}
            <span className="text-muted-foreground"> · {t(`period.resolutions.${resolution}`)}</span>
          </span>
          <Icon icon="material-symbols:keyboard-arrow-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <div className="flex gap-1 border-b border-border p-2">
          <TabButton active={value.kind === "preset"} onClick={() => selectPreset("7d")}>
            {t("period.tabs.presets")}
          </TabButton>
          <TabButton active={value.kind === "custom"} onClick={selectCustom}>
            {t("period.tabs.custom")}
          </TabButton>
        </div>

        <div className="p-3">
          {value.kind === "preset" ? (
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((preset) => (
                <GuardedChip
                  key={preset}
                  active={value.preset === preset}
                  availability={presetAvailability(preset, allowance)}
                  feature="statsHistory"
                  onSelect={() => selectPreset(preset)}
                >
                  {t(`period.presets.${preset}`)}
                </GuardedChip>
              ))}
            </div>
          ) : (
            <CustomRangeFields period={value} onChange={onChange} now={now} allowance={allowance} />
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-medium text-foreground">{t("period.resolution")}</span>
            <span className="text-xs text-muted-foreground">
              {points === null ? t("period.wholeHistory") : t("period.points", { count: points })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Chip active={value.resolution === "auto"} onClick={() => setResolution("auto")}>
              {t("period.auto", { resolution: t(`period.resolutions.${resolution}`) })}
            </Chip>
            {RESOLUTIONS.map((option) => (
              <GuardedChip
                key={option}
                active={value.resolution === option}
                availability={resolutionAvailability(value, option, allowance)}
                feature="statsResolution"
                onSelect={() => setResolution(option)}
              >
                {t(`period.resolutions.${option}`)}
              </GuardedChip>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const Chip = ({
  active,
  disabled,
  locked,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  locked?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-pressed={active}
    className={cn(
      "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-40",
      active
        ? "border-accent bg-accent text-accent-foreground"
        : "border-border bg-background text-muted-foreground hover:border-input hover:text-foreground",
      locked && "border-dashed hover:border-accent hover:text-accent"
    )}
  >
    {locked && <LockIcon />}
    {children}
  </button>
);

/**
 * Pastille dont l'état découle de la disponibilité : proposable, hors de portée
 * (grisée et inerte), ou réservée aux membres — auquel cas elle reste cliquable
 * et emmène vers l'inscription. Un choix qu'on ne peut pas faire doit dire
 * pourquoi ; une pastille grise muette, elle, ne dit rien à personne.
 */
const GuardedChip = ({
  active,
  availability,
  feature,
  onSelect,
  children,
}: {
  active: boolean;
  availability: Availability;
  feature: string;
  onSelect: () => void;
  children: React.ReactNode;
}) => {
  const t = useTranslations("Stats");
  const unlock = useUnlock();
  const locked = !availability.available && availability.reason === "needsAccount";

  return (
    <Chip
      active={active}
      disabled={!availability.available && !locked}
      locked={locked}
      title={availability.available ? undefined : t(`period.unavailable.${availability.reason}`)}
      onClick={locked ? () => unlock(feature) : onSelect}
    >
      {children}
    </Chip>
  );
};

const CustomRangeFields = ({
  period,
  onChange,
  now,
  allowance,
}: {
  period: Extract<Period, { kind: "custom" }>;
  onChange: (period: Period) => void;
  now: number;
  allowance: Allowance;
}) => {
  const t = useTranslations("Stats");
  const today = toDateInputValue(now);
  // Borner le champ vaut mieux que laisser choisir une date que l'API refusera.
  const earliest = earliestSelectable(allowance, now);

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {t("period.from")}
        <input
          type="date"
          min={earliest === null ? undefined : toDateInputValue(earliest)}
          max={toDateInputValue(period.to)}
          value={toDateInputValue(period.from)}
          onChange={(event) => onChange({ ...period, from: fromDateInputValue(event.target.value, false) })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {t("period.to")}
        <input
          type="date"
          max={today}
          min={toDateInputValue(period.from)}
          value={toDateInputValue(period.to)}
          onChange={(event) => onChange({ ...period, to: fromDateInputValue(event.target.value, true) })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex gap-1.5 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 flex-1 px-2 text-xs"
          onClick={() => onChange(shiftPeriod(period, -1, now))}
        >
          <Icon icon="material-symbols:chevron-left" className="h-4 w-4" />
          {t("period.previous")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 flex-1 px-2 text-xs"
          disabled={period.to >= now}
          onClick={() => onChange(shiftPeriod(period, 1, now))}
        >
          {t("period.next")}
          <Icon icon="material-symbols:chevron-right" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
