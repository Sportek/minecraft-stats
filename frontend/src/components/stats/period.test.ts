import { describe, expect, it } from "vitest";
import {
  autoResolution,
  axisTimeFormat,
  bucketCount,
  effectiveResolution,
  MAX_BUCKETS,
  Period,
  PresetId,
  resolutionAvailability,
  shiftPeriod,
  toStatsQuery,
} from "./period";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const preset = (id: PresetId): Period => ({ kind: "preset", preset: id, resolution: "auto" });
const custom = (from: number, to: number): Period => ({ kind: "custom", from, to, resolution: "auto" });

describe("autoResolution", () => {
  it("picks the finest step that stays readable on the range", () => {
    expect(autoResolution(DAY)).toBe("30 minutes");
    expect(autoResolution(7 * DAY)).toBe("1 hour");
    expect(autoResolution(30 * DAY)).toBe("6 hours");
    expect(autoResolution(180 * DAY)).toBe("1 day");
    expect(autoResolution(730 * DAY)).toBe("1 week");
  });

  it("falls back to the widest step when the range is unbounded", () => {
    expect(autoResolution(null)).toBe("1 week");
  });

  it("never auto-selects a sub-hour step past a couple of days, which would hit the raw table", () => {
    expect(autoResolution(3 * DAY)).not.toBe("30 minutes");
  });
});

describe("effectiveResolution", () => {
  it("derives the step from the range in auto mode", () => {
    expect(effectiveResolution(preset("7d"))).toBe("1 hour");
  });

  it("honours an explicit override", () => {
    expect(effectiveResolution({ ...preset("7d"), resolution: "1 day" })).toBe("1 day");
  });
});

describe("bucketCount", () => {
  it("counts the points a range/step pair produces", () => {
    expect(bucketCount(preset("24h"), "30 minutes")).toBe(48);
    expect(bucketCount(preset("7d"), "1 hour")).toBe(168);
    expect(bucketCount(preset("30d"), "6 hours")).toBe(120);
  });

  it("returns null for the open-ended range, whose lower bound only the backend knows", () => {
    expect(bucketCount(preset("all"), "1 week")).toBeNull();
  });
});

describe("resolutionAvailability", () => {
  it("rejects a step that would blow the backend budget", () => {
    const availability = resolutionAvailability(preset("2y"), "30 minutes");
    expect(availability).toEqual({ available: false, reason: "tooManyPoints" });
    expect(bucketCount(preset("2y"), "30 minutes")!).toBeGreaterThan(MAX_BUCKETS);
  });

  it("rejects a step too wide to draw a curve", () => {
    expect(resolutionAvailability(preset("7d"), "1 week")).toEqual({
      available: false,
      reason: "rangeTooShort",
    });
  });

  it("keeps only day-or-wider steps for the open-ended range", () => {
    expect(resolutionAvailability(preset("all"), "6 hours").available).toBe(false);
    expect(resolutionAvailability(preset("all"), "1 day").available).toBe(true);
    expect(resolutionAvailability(preset("all"), "1 week").available).toBe(true);
  });

  it("accepts what the presets select by default", () => {
    for (const id of ["24h", "7d", "30d", "3mo", "6mo", "1y", "2y", "all"] as const) {
      const period = preset(id);
      expect(resolutionAvailability(period, effectiveResolution(period))).toEqual({ available: true });
    }
  });
});

describe("toStatsQuery", () => {
  const now = 1_700_000_000_000;

  it("anchors a preset to now", () => {
    expect(toStatsQuery(preset("7d"), now)).toEqual({
      fromDate: now - 7 * DAY,
      toDate: now,
      interval: "1 hour",
    });
  });

  it("omits fromDate for the open-ended range so the backend resolves the first known day", () => {
    const query = toStatsQuery(preset("all"), now);
    expect(query.fromDate).toBeUndefined();
    expect(query).toEqual({ toDate: now, interval: "1 week" });
  });

  it("passes custom bounds through untouched", () => {
    const from = now - 45 * DAY;
    expect(toStatsQuery(custom(from, now), now)).toEqual({
      fromDate: from,
      toDate: now,
      interval: "6 hours",
    });
  });
});

describe("shiftPeriod", () => {
  const now = 1_700_000_000_000;

  it("steps back by a whole span", () => {
    const period = custom(now - 30 * DAY, now);
    expect(shiftPeriod(period, -1, now)).toMatchObject({ from: now - 60 * DAY, to: now - 30 * DAY });
  });

  it("never runs past now", () => {
    const period = custom(now - 30 * DAY, now);
    expect(shiftPeriod(period, 1, now)).toMatchObject({ from: now - 30 * DAY, to: now });
  });

  it("preserves the span when clamping", () => {
    const period = custom(now - 40 * DAY, now - 10 * DAY);
    const shifted = shiftPeriod(period, 1, now);
    expect(shifted).toMatchObject({ kind: "custom" });
    if (shifted.kind !== "custom") throw new Error("expected a custom period");
    expect(shifted.to - shifted.from).toBe(30 * DAY);
  });

  it("leaves presets alone — they are already anchored to now", () => {
    const period = preset("7d");
    expect(shiftPeriod(period, -1, now)).toBe(period);
  });
});

describe("axisTimeFormat", () => {
  it("drops the clock once a bucket spans a day or more", () => {
    expect(axisTimeFormat("6 hours")).toBe("%d/%m %H:%M");
    expect(axisTimeFormat("1 day")).toBe("%d/%m/%y");
    expect(axisTimeFormat("1 week")).toBe("%d/%m/%y");
  });
});
