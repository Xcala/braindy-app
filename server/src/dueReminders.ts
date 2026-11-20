// The day before a request is due, its brand gets a WhatsApp notice (template request_due_tomorrow, or a
// wa.me link waiting in the brand's notices). Each request is reminded once per due date (remindedDue).
// A summary per day lands in admin/dueReminders/days/{day} for NickMark.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { notify } from './notify.js';
import { logError } from './guard.js';
import { brandPeople, pushTo } from './push/send.js';

/** Tomorrow as YYYY-MM-DD in Bogotá. */
export function tomorrowInBogota(now = new Date()) {
  return new Date(now.getTime() + 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

export async function remindDueTomorrow() {
  const day = tomorrowInBogota();
  const active = await db.collection('brands').where('status', '==', 'active').select('name').get();
  const due: Array<{ brandId: string; brand: string; requestId: string; title: string }> = [];
  let skipped = 0;
  for (const b of active.docs) {
    const snap = await db.collection(`brands/${b.id}/requests`).where('dueDate', '==', day).get();
    for (const r of snap.docs) {
      if (r.get('status') !== 'in_production' || r.get('archived')) continue;
      if (r.get('remindedDue') === day) { skipped++; continue; }
      const title = String(r.get('title') ?? r.get('formatType') ?? '');
      try {
        await notify(b.id, 'due_tomorrow', { when: title });
        await r.ref.update({ remindedDue: day });
        const people = await brandPeople(b.id);
        await pushTo(people.uids, { kind: 'due', tag: `r-${r.id}`, url: `/requests/${r.id}?brand=${encodeURIComponent(b.id)}`,
          title: { es: `Mañana se entrega · ${people.name}`, en: `Due tomorrow · ${people.name}` }, body: { es: `«${title}»`, en: `"${title}"` } });
        due.push({ brandId: b.id, brand: String(b.get('name') ?? b.id), requestId: r.id, title });
      } catch (e) { logError(e, { where: 'cron-due', brandId: b.id }); }
    }
  }
  await db.doc(`admin/dueReminders/days/${day}`).set({ day, at: FieldValue.serverTimestamp(), ...(due.length ? { due: FieldValue.arrayUnion(...due) } : {}) }, { merge: true });
  return { day, reminded: due.length, skipped };
}
