// Minimal READ-ONLY Google Drive client (drive.readonly scope) for the import scripts.
// Credentials: a separate gcloud config logged in as the Drive owner (nicolas@xent.co):
//   CLOUDSDK_CONFIG=~/.config/gcloud-drive gcloud auth application-default login --scopes=...drive.readonly
import { GoogleAuth } from 'google-auth-library';
import { homedir } from 'node:os';
import { join } from 'node:path';

const keyFile = process.env.DRIVE_CREDENTIALS
  ?? join(homedir(), '.config', 'gcloud-drive', 'application_default_credentials.json');

const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });

export const FOLDER = 'application/vnd.google-apps.folder';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  md5Checksum?: string;
  modifiedTime: string;
  parents?: string[];
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const url = `https://www.googleapis.com/drive/v3/${path}?${new URLSearchParams(params)}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': 'braindy-brand-guideline' },
    });
    if (res.ok) return res.json() as Promise<T>;
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }
    throw new Error(`Drive ${res.status}: ${await res.text()}`);
  }
}

const FIELDS = 'nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,parents)';

export async function list(q: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = '';
  do {
    const page = await get<{ files: DriveFile[]; nextPageToken?: string }>('files', {
      q: `${q} and trashed = false`, fields: FIELDS, pageSize: '1000',
      supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(pageToken ? { pageToken } : {}),
    });
    out.push(...page.files);
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

export const children = (folderId: string) => list(`'${folderId}' in parents`);

export const getFile = (id: string) =>
  get<DriveFile>(`files/${id}`, { fields: 'id,name,mimeType,size,md5Checksum,modifiedTime,parents', supportsAllDrives: 'true' });

export interface WalkedFile extends DriveFile {
  path: string; // folder path relative to the walked root, e.g. "Logos/PNG"
}

/** Recursively lists every file under a folder. `skip` excludes subfolder ids (e.g. child brands). */
export async function walk(rootId: string, skip: Set<string> = new Set(), prefix = ''): Promise<WalkedFile[]> {
  const items = await children(rootId);
  const files: WalkedFile[] = [];
  for (const it of items) {
    if (it.mimeType === FOLDER) {
      if (skip.has(it.id) || /^_?to[_ ]delete$/i.test(it.name)) continue;
      files.push(...(await walk(it.id, skip, prefix ? `${prefix}/${it.name}` : it.name)));
    } else {
      files.push({ ...it, path: prefix });
    }
  }
  return files;
}

/** Extracts a folder/file id from a Drive URL, or null. */
export function idFromUrl(url: unknown): string | null {
  const m = String(url ?? '').match(/(?:folders\/|\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
