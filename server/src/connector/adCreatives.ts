// Pauta (Nicolas 2026-11-25): the brand's paid campaigns on any platform, each with its ads, the real pieces and their texts,
// mirrored by the Braindy connector. Clients only view it. The pieces are copied into Braindy's own storage because the
// platforms' links expire. Numbers live apart (stats/totals), so the rules can keep them behind the Results switch.
import { createHash } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from './store.js';

export const PAUTA_PLATFORMS = ['meta', 'google', 'linkedin', 'tiktok', 'chatgpt', 'microsoft', 'pinterest', 'x', 'snapchat', 'reddit', 'perplexity',
  'spotify', 'amazon', 'mercadolibre', 'doordash', 'ubereats', 'rappi', 'ctv', 'programmatic', 'ooh', 'other'] as const;
export const AD_STATES = ['live', 'review', 'scheduled', 'paused', 'issue', 'ended'] as const;
export const FORMATS = ['vertical', 'feed', 'horizontal', 'chat', 'text', 'audio'] as const;
const STAT_KEYS = ['spend', 'impressions', 'reach', 'clicks', 'results', 'convValue'] as const;
const PALETTE = ['#8B5CF6', '#06B6D4', '#F5B301', '#2A7FFF', '#E4572E', '#2E9E62', '#D6409F', '#7A5C3E'];
const MAX_BYTES = 150 * 1024 * 1024;

type State = (typeof AD_STATES)[number];
type Stats = Partial<Record<(typeof STAT_KEYS)[number], number | null>> & { resultLabel?: string };
export interface CreativeInput { format: string; url: string; kind?: 'image' | 'video'; thumb?: string }
export interface AdInput {
  id: string; name?: string; status?: string; creatives?: CreativeInput[];
  primaryText?: string; headline?: string; description?: string; cta?: string; link?: string;
  headlines?: string[]; descriptions?: string[]; requestId?: string; versionId?: string; stats?: Stats;
}
export interface CampaignInput {
  id: string; name: string; objective?: string; status?: string; start?: string; end?: string;
  budget?: number; budgetPeriod?: 'daily' | 'total'; currency?: string; color?: string; stats?: Stats; ads?: AdInput[];
}

const bucket = () => getStorage().bucket(process.env.FILES_BUCKET ?? 'braindy-app-files');
const str = (v: unknown, n: number) => String(v ?? '').slice(0, n);
const num = (v: unknown) => (v == null || v === '' || !isFinite(Number(v)) ? null : Math.round(Number(v) * 100) / 100);
const https = (u?: string) => (u && /^https:\/\//i.test(u) ? u.slice(0, 2000) : '');
const safeId = (s: string) => String(s).replace(/[^\w-]/g, '').slice(0, 80);
const stats = (s?: Stats) => s ? { ...Object.fromEntries(STAT_KEYS.filter((k) => s[k] !== undefined).map((k) => [k, num(s[k])])), resultLabel: str(s.resultLabel, 60) } : null;
const when = (v?: string) => { const d = v ? new Date(v) : null; return d && !isNaN(+d) ? Timestamp.fromDate(d) : null; };

/** Every platform's own words for a campaign or ad state, reduced to the five a client understands. */
export function stateOf(raw?: string): State {
  const s = String(raw ?? '').toLowerCase();
  if (/review|pending|in_process|processing|learning_limited_review|under_review|revis/.test(s)) return 'review';
  if (/disapprov|reject|issue|error|limited|not_delivering|suspend|problem|rechaz/.test(s)) return 'issue';
  if (/schedul|not_started|programad|upcoming/.test(s)) return 'scheduled';
  if (/pause|paused|inactive|pausad/.test(s)) return 'paused';
  if (/end|complete|finish|archiv|removed|deleted|terminad/.test(s)) return 'ended';
  return 'live';
}

/** Copies one piece into Braindy (once per source link) and returns where it lives. */
async function keep(brandId: string, adKey: string, url: string, hint?: 'image' | 'video') {
  const h = createHash('sha1').update(url.split('?')[0] ?? url).digest('hex').slice(0, 16);
  const prefix = `brands/${brandId}/pauta/${adKey}/${h}`;
  const [found] = await bucket().getFiles({ prefix, maxResults: 1 });
  if (found[0]) return { path: found[0].name, kind: (found[0].metadata.contentType ?? '').startsWith('video/') ? 'video' as const : 'image' as const };
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const type = r.headers.get('content-type') ?? (hint === 'video' ? 'video/mp4' : 'image/jpeg');
  if (!/^(image|video)\//.test(type)) throw new Error(`no es imagen ni video (${type})`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('pesa más de 150 MB');
  const ext = (type.split('/')[1] ?? 'bin').split(';')[0]!.replace('jpeg', 'jpg').replace('quicktime', 'mov').slice(0, 5);
  const path = `${prefix}.${ext}`;
  await bucket().file(path).save(buf, { contentType: type, resumable: false, metadata: { cacheControl: 'private, max-age=86400' } });
  return { path, kind: type.startsWith('video/') ? 'video' as const : 'image' as const };
}

/** Upserts one platform's campaigns with their ads; campaigns of that platform no longer sent are left as «Ended», never deleted. */
export async function syncAdCreatives(brandId: string, platform: string, campaigns: CampaignInput[], complete = false) {
  const p = platform.toLowerCase();
  if (!(PAUTA_PLATFORMS as readonly string[]).includes(p)) throw new Error(`Plataforma no soportada: ${platform}. Usa una de: ${PAUTA_PLATFORMS.join(', ')}`);
  const col = db.collection(`brands/${brandId}/adCampaigns`);
  const prev = await col.where('platform', '==', p).get();
  const prevById = new Map(prev.docs.map((d) => [d.id, d.data()]));
  const taken = new Set((await col.get()).docs.map((d) => d.get('color') as string));
  const seen = new Set<string>();
  const failed: string[] = [];
  let pieces = 0;

  for (const c of campaigns) {
    const id = `${p}_${safeId(c.id)}`;
    if (!safeId(c.id) || seen.has(id)) continue;
    seen.add(id);
    const old = prevById.get(id);
    const color = /^#[0-9a-f]{6}$/i.test(c.color ?? '') ? c.color! : (old?.color as string) ?? PALETTE.find((x) => !taken.has(x)) ?? PALETTE[seen.size % PALETTE.length]!;
    taken.add(color);
    const ads = [];
    const adStats: Record<string, unknown> = {};
    for (const a of (c.ads ?? []).slice(0, 60)) {
      const adKey = `${id}_${safeId(a.id)}`;
      const creatives = [];
      for (const cr of (a.creatives ?? []).slice(0, 8)) {
        const fmt = (FORMATS as readonly string[]).includes(cr.format) ? cr.format : 'feed';
        const src = https(cr.url);
        if (!src) continue;
        try {
          const kept = await keep(brandId, adKey, src, cr.kind);
          const thumb = cr.thumb && https(cr.thumb) ? await keep(brandId, adKey, https(cr.thumb), 'image').catch(() => null) : null;
          creatives.push({ format: fmt, kind: kept.kind, path: kept.path, ...(thumb ? { thumbPath: thumb.path } : {}) });
          pieces++;
        } catch (e) { failed.push(`${a.name ?? a.id} (${fmt}): ${(e as Error).message}`); }
      }
      ads.push({
        id: safeId(a.id), name: str(a.name, 160), state: stateOf(a.status), rawStatus: str(a.status, 40), creatives,
        text: {
          primary: str(a.primaryText, 3000), headline: str(a.headline, 300), description: str(a.description, 600), cta: str(a.cta, 60), link: https(a.link),
          headlines: (a.headlines ?? []).slice(0, 15).map((x) => str(x, 120)), descriptions: (a.descriptions ?? []).slice(0, 5).map((x) => str(x, 300)),
        },
        requestId: safeId(a.requestId ?? ''), versionId: safeId(a.versionId ?? ''),
      });
      const s = stats(a.stats);
      if (s) adStats[safeId(a.id)] = s;
    }
    await col.doc(id).set({
      platform: p, campaignId: str(c.id, 80), name: str(c.name, 160), objective: str(c.objective, 80),
      state: stateOf(c.status), rawStatus: str(c.status, 40), start: when(c.start), end: when(c.end),
      budget: num(c.budget) != null ? { amount: num(c.budget), period: c.budgetPeriod === 'total' ? 'total' : 'daily' } : null,
      currency: str(c.currency ?? 'USD', 3).toUpperCase(), color, ads, source: 'connector',
      updatedAt: FieldValue.serverTimestamp(), ...(old ? {} : { createdAt: FieldValue.serverTimestamp() }),
    });
    const totals = stats(c.stats);
    if (totals || Object.keys(adStats).length) {
      await col.doc(id).collection('stats').doc('totals').set({ totals, ads: adStats, currency: str(c.currency ?? 'USD', 3).toUpperCase(), updatedAt: FieldValue.serverTimestamp() });
    }
  }
  let ended = 0;
  if (complete) {
    for (const [id, d] of prevById) if (!seen.has(id) && d.state !== 'ended') { await col.doc(id).update({ state: 'ended', updatedAt: FieldValue.serverTimestamp() }); ended++; }
  }
  await db.doc(`brands/${brandId}`).set({ pautaAt: FieldValue.serverTimestamp() }, { merge: true });
  return { campaigns: seen.size, pieces, ended, failed };
}

/** Connector tool braindy_ad_creatives_sync: same shape for every platform; the platform is just a field. */
export function registerPautaTools(server: McpServer, app: string) {
  const STATS = z.record(z.string(), z.union([z.number(), z.string(), z.null()])).optional()
    .describe('{ spend, impressions, reach, clicks, results, convValue, resultLabel } for the whole life of the campaign or ad');
  server.registerTool('braindy_ad_creatives_sync', {
    title: 'Subir la pauta (campañas, anuncios y piezas) a Braindy App',
    description: 'Mirrors a brand\'s paid campaigns of one platform into Braindy App, section «Pauta» (clients only view it): each campaign with its state, dates and budget, '
      + 'and each ad with its real pieces (vertical 9:16, feed 1:1/4:5, horizontal 16:9/1.91:1, chat for ChatGPT/Perplexity sponsored cards, text for search ads, audio), its texts and its numbers. '
      + 'Pieces are given as https links (the platform\'s or any public link): the server copies them into Braindy, because platform links expire. '
      + 'status is the platform\'s own word (ACTIVE, IN_PROCESS, PAUSED, DISAPPROVED, ENABLED, ELIGIBLE…); Braindy turns it into Al aire / En revisión / Programada / Pausada / Con un problema / Terminada. '
      + 'requestId (+ versionId) links an ad to the Braindy request where the client approved the piece. complete=true marks campaigns of this platform not sent as ended (never deleted). '
      + 'Use when Nicolas says "sube la pauta de X", "sincroniza los anuncios", or after launching or changing a campaign.',
    inputSchema: {
      brandId: z.string(),
      platform: z.enum(PAUTA_PLATFORMS),
      complete: z.boolean().optional().describe('true when the list holds every campaign of this platform'),
      campaigns: z.array(z.object({
        id: z.string(), name: z.string(), objective: z.string().optional(), status: z.string().optional(),
        start: z.string().optional().describe('ISO 8601'), end: z.string().optional().describe('ISO 8601; empty = no end'),
        budget: z.number().optional(), budgetPeriod: z.enum(['daily', 'total']).optional(), currency: z.string().optional(),
        color: z.string().optional().describe('#RRGGBB for its band in the calendar; picked automatically if left out'),
        stats: STATS,
        ads: z.array(z.object({
          id: z.string(), name: z.string().optional(), status: z.string().optional(),
          creatives: z.array(z.object({ format: z.enum(FORMATS), url: z.string(), kind: z.enum(['image', 'video']).optional(), thumb: z.string().optional() })).max(8).optional(),
          primaryText: z.string().optional(), headline: z.string().optional(), description: z.string().optional(), cta: z.string().optional(), link: z.string().optional(),
          headlines: z.array(z.string()).max(15).optional().describe('Search ads: every headline'), descriptions: z.array(z.string()).max(5).optional(),
          requestId: z.string().optional(), versionId: z.string().optional(), stats: STATS,
        })).max(60).optional(),
      })).max(50),
    },
  }, async ({ brandId, platform, complete, campaigns }) => {
    try {
      const name = await requireBrand(brandId);
      const r = await syncAdCreatives(brandId, platform, campaigns as CampaignInput[], complete);
      const bad = r.failed.length ? `\nNo se pudieron copiar ${r.failed.length} piezas:\n- ${r.failed.slice(0, 10).join('\n- ')}` : '';
      return { content: [{ type: 'text' as const, text: `${name} · pauta ${platform}: ${r.campaigns} campañas, ${r.pieces} piezas guardadas${r.ended ? `, ${r.ended} terminadas` : ''}.${bad}\nVer: ${app}/pauta` }] };
    } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true }; }
  });
}
