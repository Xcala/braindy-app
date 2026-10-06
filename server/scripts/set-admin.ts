// Creates or updates users/{uid} with role "admin" in the `braindy-app` database.
// Usage: npm run set-admin -w server -- nicolas@braindy.co [--dry-run]
// Reads Auth (shared users), writes only to `braindy-app`. Idempotent.
import { adminAuth, db } from '../src/firebase.js';

const [email, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

if (!email) {
  console.error('Usage: set-admin <email> [--dry-run]');
  process.exit(1);
}

const user = await adminAuth.getUserByEmail(email);
const ref = db.doc(`users/${user.uid}`);
const current = await ref.get();
const next = {
  email: user.email ?? email,
  name: user.displayName ?? current.get('name') ?? email,
  role: 'admin',
  brandIds: current.get('brandIds') ?? [],
};

console.log(`${dryRun ? '[dry-run] ' : ''}users/${user.uid}:`, current.exists ? 'update' : 'create', next);
if (!dryRun) await ref.set(next, { merge: true });
