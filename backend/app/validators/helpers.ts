import vine from '@vinejs/vine'

/**
 * Champ epoch milliseconds. Accepte aussi la chaîne littérale `"now"`, convertie
 * en `Date.now()` avant validation — pratique pour les bornes `toDate` que les
 * clients veulent ancrer à "maintenant" sans re-générer un timestamp à chaque requête.
 */
export const epochMsField = () =>
  vine.number().parse((value) => (value === 'now' ? Date.now() : value))

/**
 * Équivalent de `epochMsField()` pour les endpoints qui lisent `request.input(...)`
 * directement (sans validator Vine). Renvoie `null` si la valeur n'est ni un
 * epoch ms valide ni la chaîne `"now"`.
 */
export function parseEpochMs(value: unknown): number | null {
  if (value === 'now') return Date.now()
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}
