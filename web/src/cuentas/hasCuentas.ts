import { useSyncExternalStore } from 'react';

/** Which brands are billed in cuentas de cobro, as Pagos finds out: the explainer on top of the tab tells the cuentas
 *  story (PDF, card or transfer proof, recibo here) instead of the card plan's. */
const seen = new Map<string, boolean>();
const subs = new Set<() => void>();
export function markCuentas(brandId: string, has: boolean) {
  if (seen.get(brandId) === has) return;
  seen.set(brandId, has); subs.forEach((f) => f());
}
export const useHasCuentas = (brandId: string) =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => seen.get(brandId) ?? false);
