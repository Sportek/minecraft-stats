/**
 * Formate un ratio de croissance en pourcentage signé, ex. `0.12` → `+12%`,
 * `-0.03` → `-3%`. Mutualise un formateur qui était copié à l'identique dans
 * trois composants (rankings/metric, server-detail-header, card/server-status).
 */
export function formatGrowth(growth: number): string {
  return `${growth >= 0 ? "+" : ""}${Math.round(growth * 100)}%`;
}
