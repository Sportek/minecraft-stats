"use client";

import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServerDailyRhythm } from "@/http/server";
import { cn } from "@/lib/utils";
import { DayType, ISO_WEEKDAYS } from "@/types/server";
import { DateTimeFormatOptions, useFormatter, useTranslations } from "next-intl";
import { KeyboardEvent, ReactNode, useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import { extremes, MIN_RHYTHM_DAYS, primeSegments, primeWindow, densify } from "./rhythm";
import { SeriesMode } from "./series-mode-toggle";

const MINUTES_PER_DAY = 24 * 60;
const RULER_HOURS = [0, 6, 12, 18, 24];
const CURSOR_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

/**
 * Fenêtres d'observation, indépendantes de la période du graphe chronologique.
 * Les étiquettes reprennent le vocabulaire des raccourcis de période, mais une
 * fenêtre courte convient mal à un jour de semaine isolé (peu d'occurrences) :
 * l'un se règle donc sans l'autre. Le pas de créneau (30 ou 60 min) en découle
 * côté backend, on ne le choisit pas ici.
 */
const WINDOWS = [
  { days: 7, preset: "7d" },
  { days: 30, preset: "30d" },
  { days: 90, preset: "3mo" },
  { days: 365, preset: "1y" },
] as const;

const DEFAULT_WINDOW_DAYS = 30;

/** Les bornes du cadran tombent sur les bords de la bande : elles s'alignent dessus. */
const TICK_OFFSET: Record<number, string> = { 0: "", 24: "-translate-x-full" };

/** Position — ou largeur — exprimée en part de journée, pour la bande comme pour la règle. */
const atMinute = (minute: number) => `${(minute / MINUTES_PER_DAY) * 100}%`;

/*
 * Fuseau du lecteur et heure courante sont deux états extérieurs à React, et tous
 * deux absents du rendu serveur — d'où l'instantané `null` côté serveur, qui évite
 * de faire diverger le HTML de l'hydratation.
 */
const subscribeNever = () => () => {};
const readTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const readNothing = () => null;

const subscribeToMinute = (onChange: () => void) => {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
};
const readNowMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

interface DailyRhythmProps {
  serverId: number;
  seriesMode: SeriesMode;
}

/**
 * L'historique du serveur replié sur 24 h : chaque créneau porte la moyenne des
 * relevés tombés à cette heure-là. La chronologie du dessus dit comment le serveur
 * évolue ; cette bande dit *quand* il est vivant.
 *
 * Sa fenêtre et son jour de semaine se règlent ici, pas depuis le graphe du dessus :
 * lire « les samedis des 90 derniers jours » n'a pas à changer la période de la
 * chronologie. Le survol — ou les flèches — réécrit la ligne de lecture au-dessus de
 * la bande plutôt que d'ouvrir une infobulle : ça se place toujours bien, ça marche
 * au doigt, et la phrase par défaut répond déjà à la question qu'on vient poser.
 */
export const DailyRhythm = ({ serverId, seriesMode }: DailyRhythmProps) => {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const [days, setDays] = useState<number>(DEFAULT_WINDOW_DAYS);
  const [dayType, setDayType] = useState<DayType>("all");
  const [rawCursor, setCursor] = useState<number | null>(null);
  const timezone = useSyncExternalStore(subscribeNever, readTimezone, readNothing);
  const nowMinutes = useSyncExternalStore(subscribeToMinute, readNowMinutes, readNothing);

  const { data, error, isLoading } = useSWR(
    timezone ? (["server-rhythm", serverId, days, timezone] as const) : null,
    ([, id, rangeDays, zone]) => getServerDailyRhythm(id, rangeDays, zone),
    { refreshInterval: 1000 * 60 * 10 }
  );

  const slotMinutes = data?.slotMinutes ?? 30;
  const slotCount = MINUTES_PER_DAY / slotMinutes;
  // Changer de fenêtre peut faire passer la bande de 48 à 24 créneaux : un curseur
  // hérité de la granularité précédente ne désigne alors plus rien.
  const cursor = rawCursor !== null && rawCursor < slotCount ? rawCursor : null;

  const slots = densify(data?.series[dayType] ?? [], slotCount);
  const values = slots.map((slot) => {
    if (!slot) return null;
    return seriesMode === "peak" ? slot.peakPlayerCount : slot.playerCount;
  });
  const max = Math.max(0, ...values.filter((value): value is number => value !== null));
  const observed = data?.daysObserved[dayType] ?? 0;

  const bold = { b: (chunks: ReactNode) => <b className="font-semibold text-foreground">{chunks}</b> };
  // Les libellés d'heure sont des heures d'horloge — l'API a déjà converti dans le
  // fuseau du lecteur. On les construit et les formate en UTC pour que le fuseau
  // configuré côté next-intl ne les redécale pas (sinon minuit s'affiche « 5 h »).
  const clockLabel = (minute: number, options: DateTimeFormatOptions) =>
    format.dateTime(new Date(Date.UTC(2000, 0, 1, Math.floor(minute / 60) % 24, minute % 60)), {
      ...options,
      timeZone: "UTC",
    });
  const timeLabel = (minute: number) => clockLabel(minute, { hour: "numeric", minute: "2-digit" });
  const hourLabel = (hour: number) => clockLabel(hour * 60, { hour: "numeric" });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = CURSOR_STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setCursor((current) => ((current ?? 0) + step + slotCount) % slotCount);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setCursor(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setCursor(slotCount - 1);
    }
    if (event.key === "Escape") setCursor(null);
  };

  const controls = (
    <div className="flex flex-wrap gap-2">
      <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
        <SelectTrigger className="h-9 w-auto gap-1.5 text-xs font-medium" aria-label={t("rhythm.window.ariaLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WINDOWS.map((window) => (
            <SelectItem key={window.days} value={String(window.days)}>
              {t(`period.presets.${window.preset}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={dayType} onValueChange={(value) => setDayType(value as DayType)}>
        <SelectTrigger className="h-9 w-auto gap-1.5 text-xs font-medium" aria-label={t("rhythm.dayType.ariaLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("rhythm.dayType.all")}</SelectItem>
          <SelectSeparator />
          <SelectItem value="weekday">{t("rhythm.dayType.weekday")}</SelectItem>
          <SelectItem value="weekend">{t("rhythm.dayType.weekend")}</SelectItem>
          <SelectSeparator />
          {ISO_WEEKDAYS.map((day) => (
            <SelectItem key={day} value={day}>
              {t(`rhythm.dayType.${day}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.09em] text-foreground">
          {t("rhythm.title")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("rhythm.subtitle")}</p>
      </div>
      {controls}
    </div>
  );

  const frame = (children: ReactNode) => (
    <section className="border-t border-border px-6 py-5">
      {header}
      {children}
    </section>
  );

  if (error) {
    return frame(<p className="mt-6 text-sm text-muted-foreground">{t("rhythm.error")}</p>);
  }

  if (!data || isLoading) {
    return frame(
      <div className="mt-6 flex h-44 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (observed < MIN_RHYTHM_DAYS) {
    return frame(
      <div className="mt-6 rounded-lg border border-dashed border-border px-5 py-8 text-center">
        <p className="text-sm font-medium text-foreground">{t("rhythm.empty.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rhythm.empty.description", { min: MIN_RHYTHM_DAYS, count: observed })}
        </p>
      </div>
    );
  }

  const prime = primeWindow(values);
  const { highest, lowest } = extremes(values);
  const hovered = cursor === null ? null : slots[cursor];

  const readout = () => {
    if (cursor !== null && !hovered) {
      return {
        lead: t.rich("rhythm.slot.emptyLead", { time: timeLabel(cursor * slotMinutes), ...bold }),
        detail: t("rhythm.slot.emptyDetail"),
      };
    }
    if (cursor !== null && hovered) {
      const shown = seriesMode === "peak" ? hovered.peakPlayerCount : hovered.playerCount;
      const other = seriesMode === "peak" ? hovered.playerCount : hovered.peakPlayerCount;
      return {
        lead: t.rich(seriesMode === "peak" ? "rhythm.slot.leadPeak" : "rhythm.slot.leadAverage", {
          time: timeLabel(hovered.minuteOfDay),
          count: format.number(shown),
          ...bold,
        }),
        detail: t.rich(
          seriesMode === "peak" ? "rhythm.slot.detailPeak" : "rhythm.slot.detailAverage",
          { other: format.number(other), days: hovered.daysCount, ...bold }
        ),
      };
    }

    const lead = prime
      ? t.rich("rhythm.summary.lead", {
          from: timeLabel(prime.start * slotMinutes),
          to: timeLabel((prime.end + 1) * slotMinutes),
          ...bold,
        })
      : t("rhythm.summary.flatLead");

    if (highest === null || lowest === null) return { lead, detail: t("rhythm.summary.flatDetail") };

    return {
      lead,
      detail: t.rich(
        seriesMode === "peak" ? "rhythm.summary.detailPeak" : "rhythm.summary.detailAverage",
        {
          peak: format.number(values[highest]!),
          peakAt: timeLabel(highest * slotMinutes),
          low: format.number(values[lowest]!),
          lowAt: timeLabel(lowest * slotMinutes),
          ...bold,
        }
      ),
    };
  };

  const { lead, detail } = readout();
  const nowHour = nowMinutes === null ? null : nowMinutes / 60;

  return frame(
    <>
      <div className="mt-5 min-h-14" aria-live="polite">
        <p className="text-[15px] font-medium leading-snug text-foreground tabular-nums">{lead}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground tabular-nums">{detail}</p>
      </div>

      <div className="relative mt-4 pt-6">
        {prime &&
          primeSegments(prime, slotCount).map((segment) => (
            <div
              key={segment.start}
              aria-hidden
              className="pointer-events-none absolute top-1.5 h-2.5 rounded-t-[3px] border border-b-0 border-foreground/25"
              style={{
                left: atMinute(segment.start * slotMinutes),
                width: atMinute((segment.end - segment.start + 1) * slotMinutes),
              }}
            >
              {segment.labelled && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-2 text-[11px] font-semibold text-foreground">
                  {t("rhythm.bracket", {
                    from: timeLabel(prime.start * slotMinutes),
                    to: timeLabel((prime.end + 1) * slotMinutes),
                  })}
                </span>
              )}
            </div>
          ))}

        <div
          role="group"
          tabIndex={0}
          aria-label={t("rhythm.stripAria")}
          onKeyDown={onKeyDown}
          onPointerLeave={() => setCursor(null)}
          onBlur={() => setCursor(null)}
          className="grid h-28 items-end gap-0.5 border-b border-border focus-visible:ring-2 focus-visible:ring-ring sm:h-36"
          style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
        >
          {values.map((value, index) => (
            <div
              key={index}
              className="relative flex h-full items-end"
              onPointerEnter={() => setCursor(index)}
            >
              {value === null ? (
                <div className="h-0.75 w-full rounded-xs bg-muted-foreground/25" />
              ) : (
                <div
                  className={cn(
                    "min-h-0.5 w-full origin-bottom rounded-t-xs",
                    "animate-rhythm-rise motion-reduce:animate-none",
                    cursor === index ? "bg-foreground" : "bg-accent"
                  )}
                  style={{
                    height: `${max > 0 ? (value / max) * 100 : 0}%`,
                    animationDelay: `${index * 6}ms`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {nowMinutes !== null && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-6 border-l border-dashed border-foreground/70"
            style={{ left: atMinute(nowMinutes) }}
          />
        )}
      </div>

      <div className="relative h-7">
        {RULER_HOURS.map((hour) => (
          <span
            key={hour}
            className={cn(
              "absolute top-0 pt-1.5 font-mono text-[11px] text-muted-foreground",
              TICK_OFFSET[hour] ?? "-translate-x-1/2",
              nowHour !== null && Math.abs(nowHour - hour) < 1.5 && "invisible"
            )}
            style={{ left: atMinute(hour * 60) }}
          >
            {hourLabel(hour)}
          </span>
        ))}
        {nowMinutes !== null && (
          <span
            className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-foreground"
            style={{ left: atMinute(nowMinutes) }}
          >
            {t("rhythm.now")}
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
        {t("rhythm.footnote", {
          days: observed,
          minutes: slotMinutes,
          timezone: data.timezone,
        })}
      </p>

      <div className="sr-only">
        <table>
          <caption>{t("rhythm.table.caption")}</caption>
          <thead>
            <tr>
              <th>{t("rhythm.table.slot")}</th>
              <th>{t("rhythm.table.average")}</th>
              <th>{t("rhythm.table.peak")}</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => (
              <tr key={index}>
                <td>{timeLabel(index * slotMinutes)}</td>
                <td>{slot ? format.number(slot.playerCount) : "—"}</td>
                <td>{slot ? format.number(slot.peakPlayerCount) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
