// Migrates brief requests (+ comments) into brands/{brand}/requests. Reads brief only; idempotent
// (ids brief-<id>); --dry-run by default prints a report; --write applies.
//   npm run migrate:requests -w server [-- --write]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

const write = process.argv.includes('--write');
const BRAND = 'quimiolab'; // decision 2026-10-05: every brief user is Quimiolab
const app = initializeApp({ credential: applicationDefault(), projectId: 'braindy-brand-guideline' });
const brief = getFirestore(app, 'ai-studio-5a30c0b0-483a-4f53-a864-8d0cc7128673'); // read-only
const target = getFirestore(app, 'braindy-app');
target.settings({ ignoreUndefinedProperties: true });

const SUB: Record<string, string> = {
  'Contenido orgánico': 'organic', 'Contenido pago (ads)': 'ads', Video: 'video', Estrategia: 'strategy',
  'Piezas gráficas': 'pieces', 'Identidad visual': 'identity', 'Material corporativo': 'corporate', 'Assets digitales': 'digital',
  'Identidad de marca': 'identity', 'Arquitectura de marca': 'architecture', Naming: 'naming',
};
const LEAD: Record<string, string> = { social: 'creator', graphic: 'creator', branding: 'creator', marketing: 'marketer' };
const HELPERS: Record<string, string[]> = { social: ['marketer'], graphic: ['marketer'], branding: ['researcher', 'marketer'], marketing: ['creator', 'researcher'] };

const ts = (v: unknown): Timestamp | undefined => {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v;
  if (typeof v === 'object' && v && '_seconds' in v) return new Timestamp((v as { _seconds: number })._seconds, 0);
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : Timestamp.fromDate(d);
};

type Deliv = { imageUrl?: string; media?: Array<{ url: string; type: string }>; driveLink?: string; caption?: string; copy?: string; version?: number; uploadedAt?: unknown; approval?: { status?: string; by?: string; at?: unknown } };

const uidByEmail = new Map<string, string>();
let page: string | undefined;
do {
  const r = await getAuth(app).listUsers(1000, page);
  r.users.forEach((u) => u.email && uidByEmail.set(u.email.toLowerCase(), u.uid));
  page = r.pageToken;
} while (page);

const snap = await brief.collection('requests').get();
const report: string[] = [];
const counts: Record<string, number> = {};
let versionsN = 0, commentsN = 0;
const ops: Array<{ path: string; data: Record<string, unknown> }> = [];

for (const d of snap.docs) {
  const x = d.data();
  const category = LEAD[x.category] ? x.category : 'other';
  const subcategory = SUB[x.subcategory] ?? (category === 'other' ? 'special' : '');
  const steps = [...(x.steps ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const card = (s?: { description?: string; links?: string[]; images?: string[] }) => s ? {
    text: String(s.description ?? '').trim(), links: [...(s.links ?? []), ...(s.images ?? [])].filter((l: string) => /^https?:\/\//.test(l)).slice(0, 10),
  } : { text: '', links: [] };

  const delivs: Deliv[] = (x.versions?.length ? x.versions : x.deliverable ? [x.deliverable] : []) as Deliv[];
  const completed = x.status === 'completed';
  const status = completed ? 'approved' : delivs.length ? 'to_approve' : 'in_production';
  counts[status] = (counts[status] ?? 0) + 1;
  const id = `brief-${d.id}`;
  const base = `brands/${BRAND}/requests/${id}`;
  const createdBy = uidByEmail.get(String(x.requestedBy ?? '').toLowerCase()) ?? `legacy:${x.requestedBy}`;

  ops.push({ path: base, data: {
    title: x.projectName && !/^Nuevo Proyecto/i.test(x.projectName) ? x.projectName : x.formatType || 'Brief request',
    category, subcategory, formatType: x.formatType ?? '',
    cards: { product: card(steps[0]), application: card(steps[1]), scene: card(steps[2]) },
    dueDate: x.targetDate ? String(x.targetDate).slice(0, 10) : null, format: '', language: 'Español',
    status, stage: completed ? 'approved' : delivs.length ? 'clientApproval' : 'work',
    leadBrain: LEAD[category] ?? 'researcher', helperBrains: HELPERS[category] ?? ['marketer'],
    approvalLevel: category === 'branding' || subcategory === 'strategy' ? 'nicolas' : 'self',
    plan: { scope: [], firstDelivery: null, note: '', approved: true },
    versionCount: delivs.length, latestVersion: delivs.length ? `v${delivs.length}` : null,
    createdBy, createdAt: ts(x.requestedAt), updatedAt: ts(x.updatedAt) ?? ts(x.requestedAt),
    legacy: { briefRequestId: d.id, requestedBy: x.requestedBy },
  } });

  delivs.forEach((v, i) => {
    const media = v.media?.length ? v.media : v.imageUrl ? [{ url: v.imageUrl, type: 'image' }] : [];
    const files = media.map((m, j) => ({ name: `v${i + 1}-${j + 1}.${m.type === 'video' ? 'mp4' : 'jpg'}`, url: m.url, contentType: m.type === 'video' ? 'video/mp4' : 'image/jpeg', size: 0 }));
    if (v.driveLink) files.push({ name: 'Drive', url: v.driveLink, contentType: 'text/html', size: 0 });
    const last = i === delivs.length - 1;
    const legacyState = v.approval?.status === 'approved' ? 'approved' : v.approval?.status === 'rejected' ? 'changes_requested' : last && completed ? 'approved' : 'pending';
    ops.push({ path: `${base}/versions/v${i + 1}`, data: {
      n: i + 1, files, notes: [v.caption, v.copy].filter(Boolean).join('\n\n'), reason: '', brain: LEAD[category] ?? null,
      published: true, approval: { state: legacyState, by: v.approval?.by ?? null, at: ts(v.approval?.at) ?? null },
      createdAt: ts(v.uploadedAt), publishedAt: ts(v.uploadedAt), legacy: true,
    } });
    versionsN++;
  });

  const cs = await d.ref.collection('comments').get();
  cs.docs.forEach((c) => {
    const y = c.data();
    const links = [...(y.links ?? []), ...((y.media ?? []) as Array<{ url: string }>).map((m) => m.url)].filter(Boolean);
    ops.push({ path: `${base}/comments/c-${c.id}`, data: {
      author: uidByEmail.get(String(y.userEmail ?? '').toLowerCase()) ?? `legacy:${y.userEmail}`,
      text: [y.text, ...links].filter(Boolean).join('\n'), createdAt: ts(y.createdAt), resolved: completed, legacy: true,
    } });
    commentsN++;
  });
  if (createdBy.startsWith('legacy:')) report.push(`- ${d.id}: requester ${x.requestedBy} has no account; kept as legacy author`);
}

const dir = resolve(import.meta.dirname, '../../../migration-reports');
mkdirSync(dir, { recursive: true });
const file = resolve(dir, `requests-${write ? 'write' : 'dry-run'}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
writeFileSync(file, [
  `# Brief requests → ${BRAND} · ${write ? 'write' : 'dry-run'}`, '',
  `${snap.size} requests · ${versionsN} versions · ${commentsN} comments`, '',
  `Status: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}`, '',
  '"completed" in brief → Approved (the request was closed there). Files stay at their original URLs.', '',
  ...report,
].join('\n'));

if (write) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = target.batch();
    ops.slice(i, i + 400).forEach((o) => batch.set(target.doc(o.path), o.data));
    await batch.commit();
  }
}
console.log(`${write ? 'Wrote' : 'Would write'} ${ops.length} docs (${snap.size} requests, ${versionsN} versions, ${commentsN} comments). Report: ${file}`);
