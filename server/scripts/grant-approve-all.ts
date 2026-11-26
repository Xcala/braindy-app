// Turns on «can approve» for every existing team member and pending invite (Nicolas, 2026-11-19). Idempotent; --dry-run prints only.
// Usage: tsx scripts/grant-approve-all.ts [--dry-run]
import { db } from '../src/firebase.js';

const dry = process.argv.includes('--dry-run');
const at = new Date().toISOString();
let changed = 0, same = 0;
const members = await db.collectionGroup('members').get();
for (const m of members.docs) {
  const brand = m.ref.parent.parent;
  if (!brand || brand.parent.id !== 'brands') continue;
  if (m.get('canApprove') === true) { same++; continue; }
  changed++;
  console.log(`→ ${brand.id}: ${m.get('name') ?? m.id} (${m.get('role')})`);
  if (!dry) await db.batch().update(m.ref, { canApprove: true })
    .set(db.collection('audit').doc(), { type: 'member_updated', brandId: brand.id, uid: m.id, patch: { canApprove: true }, by: 'script:grant-approve-all', at }).commit();
}
const invites = await db.collection('invites').get();
let inv = 0;
for (const i of invites.docs) {
  if (i.get('canApprove') === true) continue;
  inv++;
  console.log(`→ invitación ${i.get('brandId')}: ${i.get('email')}`);
  if (!dry) await i.ref.update({ canApprove: true });
}
console.log(`Miembros: ${changed} activados, ${same} ya podían. Invitaciones: ${inv} activadas.`);
console.log(dry ? 'DRY RUN: nada escrito.' : 'Listo.');
