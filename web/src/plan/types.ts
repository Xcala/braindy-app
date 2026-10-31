// Mirror of server/src/brandPlan.ts (PlanSchema). Stored at brands/{brandId}/billing/contracted.
// The schedule is not here: it is the contract's (Anexo 2, by week), see contracts/types.ts.
export type PackStatus = 'pending' | 'in_progress' | 'delivered';

export interface Pack {
  label?: string; name: string; subtitle?: string; price?: number; period: 'once' | 'month'; months?: number;
  includes: string[]; excludes: string[]; status: PackStatus;
}
export interface Care {
  name: string; price?: number; period: 'month' | 'year'; note?: string;
  includes: Array<{ title: string; body?: string }>; excludes: string[]; metrics: Array<{ value: string; label: string }>;
  hosting?: 'esencial' | 'pro' | 'ultra'; siteUrl?: string; startsAfter?: string;
}
export interface BrandPlan {
  title: string; summary?: string; currency: 'cop' | 'usd'; start?: string; end?: string; status: 'active' | 'done' | 'paused';
  packs: Pack[]; total?: { amount: number; label?: string }; payment: string[]; notIncluded: string[]; care?: Care;
}
