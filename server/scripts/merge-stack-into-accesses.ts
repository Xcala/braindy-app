// One-off (2026-11-20): the «apps» cards of Mi plan (brands/{id}/billing/stack) join the brand's accesses
// (brands/{id}/accesses), so Apps de terceros is one list. Matches by app name; fills what the access lacks
// (purpose, who pays, renewal, status, and the plan/price when the access has none). Apps with no access become
// new accesses without a password. billing/stack is left as it is (backup). Idempotent; --dry-run prints only.
// Usage: npx tsx scripts/merge-stack-into-accesses.ts [--dry-run]
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';

const dry = process.argv.includes('--dry-run');
type Item = { name: string; purpose?: string; plan?: string; cost?: number; currency?: string; period?: string; payer?: string; renews?: string; url?: string; status?: string; note?: string };
const key = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

function subscriptionOf(x: Item) {
  if (x.cost == null && !x.plan && x.period !== 'usage') return null;
  const cur = String(x.currency ?? 'usd').toUpperCase();
  return {
    plan: (x.plan ?? '').slice(0, 80),
    price: typeof x.cost === 'number' && x.cost >= 0 ? Math.round(x.cost * 100) / 100 : null,
    currency: cur === 'COP' || cur === 'EUR' ? cur : 'USD',
    period: x.period === 'year' || x.period === 'usage' || x.period === 'once' ? x.period : 'month',
  };
}

async function main() {
  const brands = await db.collection('brands').get();
  let merged = 0, created = 0, untouched = 0, brandsWith = 0;
  for (const b of brands.docs) {
    const st = await db.doc(`brands/${b.id}/billing/stack`).get();
    const items = (st.get('items') as Item[] | undefined) ?? [];
    if (!items.length) continue;
    brandsWith++;
    const acc = await db.collection(`brands/${b.id}/accesses`).get();
    const byKey = new Map(acc.docs.map((d) => [key(String(d.get('platform') ?? '')), d]));
    console.log(`\n${b.get('name') ?? b.id} · ${items.length} apps en Mi plan · ${acc.size} accesos`);
    for (const x of items) {
      const k = key(x.name);
      const d = byKey.get(k) ?? [...byKey].find(([kk]) => kk && (kk.includes(k) || k.includes(kk)))?.[1];
      const about = {
        purpose: (x.purpose ?? '').slice(0, 160),
        payer: x.payer === 'braindy' || x.payer === 'client' ? x.payer : null,
        renews: x.renews && /^\d{4}-\d{2}-\d{2}$/.test(x.renews) ? x.renews : null,
        status: x.status === 'paused' || x.status === 'cancelled' ? x.status : 'active',
      };
      if (d) {
        const patch: Record<string, unknown> = {};
        if (!d.get('purpose') && about.purpose) patch.purpose = about.purpose;
        if (d.get('payer') == null && about.payer) patch.payer = about.payer;
        if (!d.get('renews') && about.renews) patch.renews = about.renews;
        if (!d.get('status')) patch.status = about.status;
        if (!d.get('subscription')) { const s = subscriptionOf(x); if (s) patch.subscription = s; }
        if (!Object.keys(patch).length) { untouched++; console.log(`  = ${x.name} → «${d.get('platform')}» ya estaba`); continue; }
        merged++;
        console.log(`  ↔ ${x.name} → «${d.get('platform')}» +${Object.keys(patch).join(', ')}`);
        if (!dry) await d.ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp(), updatedByName: 'Braindy' });
      } else {
        created++;
        console.log(`  + ${x.name} (nuevo, sin contraseña)`);
        if (dry) continue;
        const ref = db.collection(`brands/${b.id}/accesses`).doc(`stack-${k || created}`);
        await ref.set({
          platform: x.name.slice(0, 80), username: '', link: (x.url ?? '').slice(0, 500), notes: (x.note ?? '').slice(0, 1000), hasSecret: false,
          sharedWithBraindy: false, subscription: subscriptionOf(x), signIn: 'password', group: '', ...about,
          createdBy: 'script:merge-stack', updatedBy: 'script:merge-stack', updatedByName: 'Braindy', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        await db.collection(`brands/${b.id}/accessLog`).doc().set({ accessId: ref.id, platform: x.name, action: 'added', by: 'script:merge-stack', byName: 'Braindy', at: FieldValue.serverTimestamp() });
      }
    }
  }
  console.log(`\n${dry ? '[prueba] ' : ''}Marcas con apps en Mi plan: ${brandsWith} · unidas: ${merged} · nuevas: ${created} · ya estaban: ${untouched}`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
