import { describe, expect, it } from "vitest";
import { DailyRhythmSlot } from "@/types/server";
import { densify, extremes, primeSegments, primeWindow } from "./rhythm";

const slot = (index: number, playerCount: number): DailyRhythmSlot => ({
  slot: index,
  minuteOfDay: index * 30,
  playerCount,
  peakPlayerCount: playerCount * 2,
  minPlayerCount: 0,
  samplesCount: 90,
  daysCount: 30,
});

/** Journée à 48 créneaux dont seuls ceux listés portent une valeur. */
const day = (values: Record<number, number>) => {
  const dense: (number | null)[] = Array.from({ length: 48 }, () => 0);
  for (const [index, value] of Object.entries(values)) dense[Number(index)] = value;
  return dense;
};

describe("densify", () => {
  it("garde les 24 h de large quand des créneaux manquent", () => {
    const dense = densify([slot(0, 10), slot(47, 20)], 48);

    expect(dense).toHaveLength(48);
    expect(dense[0]?.playerCount).toBe(10);
    expect(dense[47]?.playerCount).toBe(20);
    expect(dense[24]).toBeNull();
  });

  it("ignore un créneau hors du cadran plutôt que d'étendre la bande", () => {
    expect(densify([slot(99, 10)], 48).every((entry) => entry === null)).toBe(true);
  });
});

describe("primeWindow", () => {
  it("retient la plage contiguë la plus longue au-dessus du seuil", () => {
    // Un creux isolé à 100 et une soirée pleine de 40 à 45.
    const values = day({ 10: 100, 40: 95, 41: 96, 42: 100, 43: 99, 44: 90, 45: 85 });

    expect(primeWindow(values)).toEqual({ start: 40, end: 45 });
  });

  it("recolle une pleine affluence qui enjambe minuit", () => {
    const values = day({ 46: 90, 47: 100, 0: 95, 1: 85 });

    expect(primeWindow(values)).toEqual({ start: 46, end: 49 });
  });

  it("ne retient rien quand l'affluence est plate sur les 24 h", () => {
    expect(primeWindow(Array.from({ length: 48 }, () => 100))).toBeNull();
  });

  it("ne retient rien quand aucun créneau n'a de joueur", () => {
    expect(primeWindow(Array.from({ length: 48 }, () => 0))).toBeNull();
    expect(primeWindow(Array.from({ length: 48 }, () => null))).toBeNull();
  });

  it("traite un créneau sans relevé comme une coupure, pas comme un creux", () => {
    const values = day({ 20: 100, 22: 100 });
    values[21] = null;

    expect(primeWindow(values)).toEqual({ start: 20, end: 20 });
  });
});

describe("primeSegments", () => {
  it("laisse une plage ordinaire en un seul morceau étiqueté", () => {
    expect(primeSegments({ start: 38, end: 46 }, 48)).toEqual([
      { start: 38, end: 46, labelled: true },
    ]);
  });

  it("coupe à minuit et n'étiquette que le plus large des deux morceaux", () => {
    expect(primeSegments({ start: 45, end: 49 }, 48)).toEqual([
      { start: 45, end: 47, labelled: true },
      { start: 0, end: 1, labelled: false },
    ]);
  });
});

describe("extremes", () => {
  it("renvoie le meilleur et le pire créneau relevé", () => {
    const values = day({ 5: 12, 20: 300, 44: 180 });

    expect(extremes(values)).toEqual({ highest: 20, lowest: 0 });
  });

  it("ignore les créneaux sans relevé au lieu de les compter à zéro", () => {
    const values: (number | null)[] = Array.from({ length: 48 }, () => null);
    values[10] = 40;
    values[30] = 90;

    expect(extremes(values)).toEqual({ highest: 30, lowest: 10 });
  });

  it("ne renvoie rien sur une journée entièrement vide", () => {
    expect(extremes(Array.from({ length: 48 }, () => null))).toEqual({
      highest: null,
      lowest: null,
    });
  });
});
