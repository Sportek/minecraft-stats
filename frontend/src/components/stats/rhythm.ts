/**
 * Lecture de la « journée type » : ce que la bande dit, indépendamment de la
 * façon dont elle est tracée. L'API renvoie des créneaux indexés depuis minuit
 * dans le fuseau du lecteur — 48 de 30 min sur les fenêtres courtes, 24 d'une
 * heure au-delà (cf. `slotMinutes`).
 */

import { DailyRhythmSlot } from "@/types/server";

/** En deçà, la moyenne ne porte qu'un jour ou deux : la journée type mentirait. */
export const MIN_RHYTHM_DAYS = 3;

/** Plafond de l'API — sert de repli quand la période choisie est « Tout ». */
export const MAX_RHYTHM_DAYS = 730;

/** Part du meilleur créneau au-dessus de laquelle on parle de pleine affluence. */
const PRIME_THRESHOLD = 0.8;

export interface PrimeWindow {
  start: number;
  /** Peut dépasser le dernier index : la plage enjambe alors minuit. */
  end: number;
}

/**
 * Rend la série dense sur 24 h. L'API omet les créneaux sans aucun relevé ; les
 * garder implicites décalerait la bande, et 4 h du matin se retrouverait tracée
 * à la place de midi.
 */
export function densify(slots: DailyRhythmSlot[], slotCount: number): (DailyRhythmSlot | null)[] {
  const dense: (DailyRhythmSlot | null)[] = Array.from({ length: slotCount }, () => null);

  for (const slot of slots) {
    if (slot.slot >= 0 && slot.slot < slotCount) dense[slot.slot] = slot;
  }
  return dense;
}

/**
 * Plage contiguë la plus longue où l'affluence reste au-dessus du seuil de pleine
 * affluence, ou `null` si le serveur n'a pas d'heure de pointe marquée.
 *
 * La recherche court sur deux journées bout à bout : un serveur dont le pic
 * enjambe minuit — le cas dès qu'on regarde un serveur d'un autre fuseau — a une
 * seule pleine affluence, pas deux morceaux collés aux bords de la bande.
 */
export function primeWindow(values: (number | null)[]): PrimeWindow | null {
  const known = values.filter((value): value is number => value !== null);
  const max = known.length > 0 ? Math.max(...known) : 0;
  if (max <= 0) return null;

  const floor = max * PRIME_THRESHOLD;
  const count = values.length;
  let best: PrimeWindow | null = null;
  let start = -1;

  for (let index = 0; index < count * 2; index++) {
    const value = values[index % count];

    if (value !== null && value >= floor) {
      if (start === -1) start = index;
      // Une plage qui fait le tour du cadran n'a pas de bornes à montrer.
      if (index - start + 1 >= count) return null;
      continue;
    }

    if (start === -1) continue;
    // Les plages ouvertes au second tour ont déjà été relevées au premier.
    if (start < count && (!best || index - start > best.end - best.start + 1)) {
      best = { start, end: index - 1 };
    }
    start = -1;
  }

  return best;
}

/**
 * Découpe la plage en segments traçables. Une plage qui enjambe minuit se dessine
 * en deux morceaux ; l'étiquette va sur le plus large, pour ne pas la répéter.
 */
export function primeSegments(window: PrimeWindow, slotCount: number) {
  if (window.end < slotCount) return [{ start: window.start, end: window.end, labelled: true }];

  const tail = { start: window.start, end: slotCount - 1 };
  const head = { start: 0, end: window.end - slotCount };
  const tailIsLonger = tail.end - tail.start >= head.end - head.start;

  return [
    { ...tail, labelled: tailIsLonger },
    { ...head, labelled: !tailIsLonger },
  ];
}

/** Index du créneau le plus et le moins fréquenté, en ignorant ceux sans relevé. */
export function extremes(values: (number | null)[]) {
  let highest: number | null = null;
  let lowest: number | null = null;

  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === null) continue;
    if (highest === null || value > values[highest]!) highest = index;
    if (lowest === null || value < values[lowest]!) lowest = index;
  }

  return { highest, lowest };
}
