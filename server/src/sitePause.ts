// Pause and resume a client's website on Firebase Hosting when its hosting plan goes unpaid (approved 2026-11-13).
// Each client site lives in its own Firebase project; braindy-api needs "Firebase Hosting Admin" on that project.
// Pause: a new release whose only content is a redirect of every path to Braindy's "Sitio en pausa" page. Nothing is
// deleted: the live version before the pause is saved and released again on resume, so the site comes back as it was.
// Rules: day 0 failed payment → notice; day 7 → "pauses in 8 days"; day 15 → pause; paid → resume. Content kept ≥ 90 days.
import { GoogleAuth } from 'google-auth-library';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { notify } from './notify.js';
import { logError } from './guard.js';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/firebase.hosting'] });
const API = 'https://firebasehosting.googleapis.com/v1beta1';
const API_BASE = process.env.API_PUBLIC_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
export const NOTICE_DAY = 7, PAUSE_DAY = 15;
const DAY = 864e5;
const planRef = (b: string) => db.doc(`brands/${b}/billing/plan`);

async function call<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
  const client = await auth.getClient();
  const r = await client.request<T>({ url: `${API}/${path}`, method, data: body });
  return r.data;
}

const siteOf = async (brandId: string) => ((await planRef(brandId).get()).get('hostingSite') as string | undefined) || null;

/** The version currently live on the site's live channel. */
async function liveVersion(site: string) {
  const r = await call<{ releases?: Array<{ version?: { name: string } }> }>('GET', `sites/${site}/channels/live/releases?pageSize=1`);
  return r.releases?.[0]?.version?.name ?? null;
}

export async function pauseSite(brandId: string, by: string) {
  const site = await siteOf(brandId);
  if (!site) throw new Error('no_site');
  const plan = (await planRef(brandId).get()).data() ?? {};
  if (plan.hostingPaused) return { already: true };
  const before = await liveVersion(site);
  const location = `${API_BASE}/public/hosting/pausa?b=${encodeURIComponent(brandId)}`;
  const v = await call<{ name: string }>('POST', `sites/${site}/versions`, {
    config: { redirects: [{ glob: '**', statusCode: 302, location }] }, labels: { braindy: 'pause' },
  });
  await call('PATCH', `${v.name}?update_mask=status`, { status: 'FINALIZED' });
  await call('POST', `sites/${site}/releases?versionName=${encodeURIComponent(v.name)}`, { message: 'Braindy: sitio en pausa por pago pendiente' });
  await planRef(brandId).set({ hostingPaused: true, hostingPausedAt: FieldValue.serverTimestamp(), hostingVersionBeforePause: before }, { merge: true });
  await db.collection('audit').doc().set({ type: 'site_paused', brandId, site, by, at: FieldValue.serverTimestamp() });
  return { paused: true };
}

export async function resumeSite(brandId: string, by: string) {
  const plan = (await planRef(brandId).get()).data() ?? {};
  if (!plan.hostingPaused) return { already: true };
  const site = plan.hostingSite as string | undefined;
  const before = plan.hostingVersionBeforePause as string | undefined;
  if (!site || !before) throw new Error('no_version_to_restore');
  await call('POST', `sites/${site}/releases?versionName=${encodeURIComponent(before)}`, { message: 'Braindy: sitio activo de nuevo' });
  await planRef(brandId).set({ hostingPaused: false, hostingResumedAt: FieldValue.serverTimestamp() }, { merge: true });
  await db.collection('audit').doc().set({ type: 'site_resumed', brandId, site, by, at: FieldValue.serverTimestamp() });
  return { resumed: true };
}

/** Webhook side: a failed hosting charge starts the clock once; a paid one clears it and brings the site back. */
export async function onHostingPayment(brandId: string, paid: boolean) {
  const ref = planRef(brandId);
  const plan = (await ref.get()).data() ?? {};
  if (!paid) {
    if (plan.hostingFailedAt) return;
    await ref.set({ hostingFailedAt: FieldValue.serverTimestamp(), hostingDunning: 0 }, { merge: true });
    await notify(brandId, 'hosting_failed');
    return;
  }
  if (plan.hostingFailedAt || plan.hostingPaused) await ref.set({ hostingFailedAt: FieldValue.delete(), hostingDunning: FieldValue.delete() }, { merge: true });
  if (plan.hostingPaused) {
    await resumeSite(brandId, 'stripe').catch((e) => logError(e, { where: 'site-resume', brandId }));
    await notify(brandId, 'hosting_resumed');
  }
}

/** Daily: day 7 notice and day 15 pause for every brand with an unpaid hosting charge. */
export async function hostingDunning(now = Date.now()) {
  const brands = await db.collection('brands').select('name').get();
  const out = { warned: 0, paused: 0, waiting: 0 };
  for (const b of brands.docs) {
    const plan = (await planRef(b.id).get()).data();
    const failed = plan?.hostingFailedAt?.toDate?.() as Date | undefined;
    if (!plan || !failed) continue;
    const days = Math.floor((now - failed.getTime()) / DAY);
    try {
      if (days >= PAUSE_DAY && !plan.hostingPaused) {
        if (!plan.hostingSite) { out.waiting++; continue; }
        await pauseSite(b.id, 'cron');
        await planRef(b.id).set({ hostingDunning: PAUSE_DAY }, { merge: true });
        await notify(b.id, 'hosting_paused');
        out.paused++;
      } else if (days >= NOTICE_DAY && (plan.hostingDunning ?? 0) < NOTICE_DAY && !plan.hostingPaused) {
        await planRef(b.id).set({ hostingDunning: NOTICE_DAY }, { merge: true });
        await notify(b.id, 'hosting_pause_soon');
        out.warned++;
      }
    } catch (e) { logError(e, { where: 'cron-hosting', brandId: b.id }); }
  }
  return out;
}
