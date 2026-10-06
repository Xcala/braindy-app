import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// On Cloud Run this uses the service account attached to the service (no key files).
// Locally it uses `gcloud auth application-default login`, or the emulators when
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST are set.
const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT ?? 'braindy-brand-guideline',
});

export const adminAuth = getAuth(app);

// Only the new database. The service account's IAM is also scoped to it.
export const db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID ?? 'braindy-app');
