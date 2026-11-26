// Paid ads and sales results for Results (Nicolas 2026-11-10, Milohas): ads mirrored from Metricool (Meta Ads, Google Ads,
// TikTok Ads), one doc per platform in brands/{id}/adStats/{platform}; sales from a delivery or sales portal (DoorDash…),
// read from its reports by month, one doc per source in brands/{id}/salesStats/{source}. Same Results switch as the social numbers.
import { FieldValue } from 'firebase-admin/firestore';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from './store.js';

export const AD_PLATFORMS = ['meta', 'google', 'tiktok', 'linkedin', 'microsoft', 'pinterest', 'chatgpt', 'x', 'snapchat', 'reddit', 'spotify', 'amazon'] as const;
export const AD_DAILY_KEYS = ['spend', 'impressions', 'reach', 'clicks', 'results', 'convValue'] as const;
export const AD_PERIODS = ['30', '90', 'month', 'lastMonth', '365'] as const;
const CAMPAIGN_KEYS = ['spend', 'impressions', 'reach', 'clicks', 'results', 'convValue'] as const;
const SALES_KEYS = ['sales', 'orders', 'customers', 'newCustomers', 'adSales', 'adOrders', 'adSpend', 'credits'] as const;
// cost = net cost (after the portal credit); grossCost and credit when the portal shows them (2026-11-25, DoorDash like Estefanía's page).
const PROMO_KEYS = ['orders', 'sales', 'cost', 'grossCost', 'credit'] as const;

type Row = Record<string, number | string | null | undefined>;
export interface AdInput { account?: string; currency?: string; daily: Row[]; campaigns?: Partial<Record<(typeof AD_PERIODS)[number], Row[]>> }
export interface SalesInput { currency?: string; note?: string; months: Array<Row & { promos?: Row[]; insights?: string[]; costNotes?: string[] }> }

const num = (v: unknown) => (v == null || v === '' || !isFinite(Number(v)) ? null : Math.round(Number(v) * 100) / 100);
const str = (v: unknown, n: number) => String(v ?? '').slice(0, n);
const pick = (row: Row, keys: readonly string[]): Record<string, number | null> => Object.fromEntries(keys.filter((k) => row[k] !== undefined).map((k) => [k, num(row[k])]));

/** Replaces one ad platform's numbers. Days merge with what is stored; campaigns are replaced per period that is sent. */
export async function syncAdStats(brandId: string, platform: string, input: AdInput) {
  const p = platform.toLowerCase();
  if (!(AD_PLATFORMS as readonly string[]).includes(p)) throw new Error(`Plataforma no soportada: ${platform}`);
  const ref = db.doc(`brands/${brandId}/adStats/${p}`);
  const prev = (await ref.get()).data() ?? {};
  const days = new Map<string, Row>((prev.daily ?? []).map((d: { d: string }) => [d.d, d]));
  for (const row of input.daily) {
    const d = str(row.d, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) days.set(d, { ...(days.get(d) ?? {}), d, ...pick(row, AD_DAILY_KEYS) });
  }
  const daily = [...days.values()].sort((a, b) => String(a.d).localeCompare(String(b.d))).slice(-1100);
  const campaigns: Record<string, unknown> = { ...(prev.campaigns ?? {}) };
  for (const per of AD_PERIODS) {
    const list = input.campaigns?.[per];
    if (!list) continue;
    campaigns[per] = list.filter((c) => c.name).slice(0, 40).map((c) => ({
      id: str(c.id, 40), name: str(c.name, 120), objective: str(c.objective, 60), status: str(c.status, 20).toUpperCase(),
      resultLabel: str(c.resultLabel, 60), ...pick(c, CAMPAIGN_KEYS),
    })).sort((a, b) => ((b as { spend?: number | null }).spend ?? 0) - ((a as { spend?: number | null }).spend ?? 0));
  }
  await ref.set({
    platform: p, account: str(input.account ?? prev.account, 60), currency: str(input.currency ?? prev.currency ?? 'USD', 3).toUpperCase(),
    daily, campaigns, source: 'metricool', updatedAt: FieldValue.serverTimestamp(),
  });
  return { days: daily.length, from: daily[0]?.d ?? '', to: daily.at(-1)?.d ?? '', periods: Object.keys(campaigns) };
}

/** Replaces one sales source's months (merged by month: a later report of the same month wins). */
export async function syncSalesStats(brandId: string, source: string, input: SalesInput) {
  const id = source.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  if (!id) throw new Error('Falta la fuente (por ejemplo doordash).');
  const ref = db.doc(`brands/${brandId}/salesStats/${id}`);
  const prev = (await ref.get()).data() ?? {};
  const months = new Map<string, Record<string, unknown>>((prev.months ?? []).map((m: { month: string }) => [m.month, m]));
  for (const m of input.months) {
    const month = str(m.month, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    months.set(month, {
      month, ...pick(m, SALES_KEYS), period: str(m.period, 60), note: str(m.note, 400), readAt: str(m.readAt, 40),
      insights: (m.insights ?? []).slice(0, 6).map((x) => str(x, 300)).filter(Boolean),
      costNotes: (m.costNotes ?? []).slice(0, 4).map((x) => str(x, 300)).filter(Boolean),
      promos: (m.promos ?? []).filter((x) => x.name).slice(0, 20).map((x) => ({ name: str(x.name, 120), dates: str(x.dates, 60), kind: str(x.kind, 30), ...pick(x, PROMO_KEYS) })),
    });
  }
  const list = [...months.values()].sort((a, b) => String(a.month).localeCompare(String(b.month))).slice(-36);
  await ref.set({
    source: id, currency: str(input.currency ?? prev.currency ?? 'USD', 3).toUpperCase(), note: str(input.note ?? prev.note, 400),
    months: list, updatedAt: FieldValue.serverTimestamp(),
  });
  return { months: list.map((m) => m.month) };
}

const ROW = z.record(z.string(), z.union([z.number(), z.string(), z.null()]));

/** Connector tools: braindy_ad_stats_sync (daily refresh, from Metricool) and braindy_sales_stats_sync (monthly, from the sales portal). */
export function registerAdTools(server: McpServer, app: string) {
  const run = <A>(fn: (a: A) => Promise<string>) => async (a: A) => {
    try { return { content: [{ type: 'text' as const, text: await fn(a) }] }; }
    catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true }; }
  };
  server.registerTool('braindy_ad_stats_sync', {
    title: 'Subir los resultados de anuncios a Braindy App',
    description: 'Mirrors a brand\'s paid ads from Metricool (network metaAds / googleAds / tiktokAds, connectors evolution and campaigns) into Results › Ads. '
      + 'daily = one row per day; campaigns = totals per campaign for each period sent (30, 90, month, lastMonth, 365 days). Days merge, so a short recent range is enough daily. '
      + 'results = the campaign\'s own result (profile visits, landing page views, leads, purchases) with resultLabel naming it in Spanish. Use in the daily refresh and when Nicolas says "trae los anuncios".',
    inputSchema: {
      brandId: z.string(),
      platform: z.enum(AD_PLATFORMS),
      account: z.string().optional().describe('Ad account id, e.g. act_123'),
      currency: z.string().optional().describe('USD, COP…'),
      daily: z.array(ROW).max(1100).describe('{ d: "YYYY-MM-DD", spend, impressions, reach, clicks, results, convValue }'),
      campaigns: z.object(Object.fromEntries(AD_PERIODS.map((p) => [p, z.array(ROW).max(40).optional()])) as Record<(typeof AD_PERIODS)[number], z.ZodOptional<z.ZodArray<typeof ROW>>>).optional()
        .describe('{ "30": [{ id, name, objective, status, spend, impressions, reach, clicks, results, resultLabel, convValue }], "90": [...], ... }'),
    },
  }, run(async ({ brandId, platform, ...input }) => {
    const name = await requireBrand(brandId);
    const r = await syncAdStats(brandId, platform, input as AdInput);
    return `${name} · anuncios ${platform}: ${r.days} días (${r.from} a ${r.to}) · campañas de ${r.periods.join(', ') || '—'}.\nVer: ${app}/report`;
  }));
  server.registerTool('braindy_sales_stats_sync', {
    title: 'Subir las ventas de un portal (DoorDash…) a Braindy App',
    description: 'Saves a brand\'s sales by month from a sales or delivery portal (DoorDash, Uber Eats, Rappi, a store) into Results › Sales: '
      + 'store sales and orders, customers and new customers, sales and orders that came from the portal\'s ads or promotions, what those cost (adSpend, after credits), and each promotion. '
      + 'Months merge, a later report of the same month wins. Read the numbers from the portal\'s reports or CSV files Nicolas gives you; never guess. Use when he says "sube las ventas de DoorDash".',
    inputSchema: {
      brandId: z.string(),
      source: z.string().describe('doordash, ubereats, rappi, tienda…'),
      currency: z.string().optional(),
      note: z.string().optional().describe('Where the numbers come from, shown under them'),
      months: z.array(ROW.and(z.object({ promos: z.array(ROW).max(20).optional(), insights: z.array(z.string()).max(6).optional(), costNotes: z.array(z.string()).max(4).optional() }))).max(36)
        .describe('{ month: "YYYY-MM", period: "1 – 31 oct", readAt: "2 nov 2026" (day the portal was read), sales, orders, customers, newCustomers, adSales, adOrders, adSpend (net, after credits), credits, note, costNotes: ["how each cost is made, one line each"], insights: ["up to 6 short conclusions, in the brand language"], promos: [{ name, kind (promo|sponsored|ad), dates, orders, sales, grossCost, credit, cost (net) }] }'),
    },
  }, run(async ({ brandId, source, ...input }) => {
    const name = await requireBrand(brandId);
    const r = await syncSalesStats(brandId, source, input as SalesInput);
    return `${name} · ventas ${source}: ${r.months.join(', ')}.\nVer: ${app}/report`;
  }));
}
