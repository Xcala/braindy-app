// READ-ONLY access to the legacy databases. Every query uses an explicit field list (select),
// so fields we must not touch — orbit `credentials`, contracts, invoices — are never fetched.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const LEGACY_DB = {
  brands: '(default)',
  brief: 'ai-studio-5a30c0b0-483a-4f53-a864-8d0cc7128673',
  orbit: 'ai-studio-f47795fa-4e77-4400-aaa0-e3328cfb9828',
} as const;

const app = initializeApp(
  { credential: applicationDefault(), projectId: 'braindy-brand-guideline' },
  'legacy-reader',
);
const db = (id: string) => getFirestore(app, id);

export type Row = { id: string } & Record<string, unknown>;

async function read(database: Firestore, collection: string, fields: string[]): Promise<Row[]> {
  const snap = await database.collection(collection).select(...fields).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export interface LegacyData {
  clients: Row[];
  brandingProjects: Row[];
  marketMaps: Row[];
  brandsUsers: Row[];
  adminUsers: Row[];
  orbitProjects: Row[];
  orbitUsers: Row[];
  orbitDocuments: Row[];
  orbitSessions: Row[];
  briefRequests: Row[];
  authUsers: Array<{ uid: string; email?: string; displayName?: string; disabled: boolean }>;
}

export async function readLegacy(): Promise<LegacyData> {
  const brands = db(LEGACY_DB.brands);
  const brief = db(LEGACY_DB.brief);
  const orbit = db(LEGACY_DB.orbit);

  const [
    clients, brandingProjects, marketMaps, brandsUsers, adminUsers,
    orbitProjects, orbitUsers, orbitDocuments, orbitSessions, briefRequests,
  ] = await Promise.all([
    read(brands, 'clients', ['name', 'slug', 'status', 'logoUrl', 'description', 'industry', 'location', 'website', 'ownerId', 'createdAt']),
    read(brands, 'brandingProjects', [
      'name', 'clientId', 'clientName', 'slug', 'deleted', 'projectType', 'logos', 'colors', 'typography',
      'brandVoice', 'designConceptImage', 'heroImage', 'heroTitle', 'heroSubtitle', 'galleryAssets',
      'sections', 'deckSlides', 'shared', 'createdAt', 'updatedAt',
    ]),
    read(brands, 'marketMaps', [
      'title', 'slug', 'clientId', 'clientName', 'description', 'coverImageUrl', 'htmlFileUrl',
      'htmlFiles', 'status', 'shared', 'tags', 'createdAt',
    ]),
    read(brands, 'users', ['uid', 'email', 'displayName', 'role']),
    read(brands, 'admin_users', ['uid', 'email', 'role', 'active']),
    read(orbit, 'projects', ['client', 'name', 'status', 'isArchived', 'logo', 'memberEmails', 'memberIds', 'brandManualLink', 'driveLink', 'resourcesLink']),
    read(orbit, 'users', ['uid', 'email', 'displayName', 'role']),
    read(orbit, 'documents', ['title', 'url', 'type', 'projectId', 'mimeType', 'storagePath', 'size', 'createdAt']),
    read(orbit, 'artemisSessions', ['projectId', 'status', 'summary', 'updatedAt']),
    read(brief, 'requests', ['requestedBy', 'projectName', 'requestedAt']),
  ]);

  const authUsers: LegacyData['authUsers'] = [];
  let pageToken: string | undefined;
  do {
    const page = await getAuth(app).listUsers(1000, pageToken);
    page.users.forEach((u) => authUsers.push({ uid: u.uid, email: u.email, displayName: u.displayName, disabled: u.disabled }));
    pageToken = page.pageToken;
  } while (pageToken);

  return {
    clients, brandingProjects, marketMaps, brandsUsers, adminUsers,
    orbitProjects, orbitUsers, orbitDocuments, orbitSessions, briefRequests, authUsers,
  };
}
