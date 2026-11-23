import type { Brand } from '../brands/BrandProvider';

export const UPLOADS = 'Uploads';
/** Where approved deliveries land (server/src/approvedFiles.ts). */
export const APPROVED = 'Entregas aprobadas';
const top = (path: string) => path.split('/')[0];

/** Mirrors firestore.rules fileAllowed: whether the client sees a folder path. The admin sees everything. */
export function folderVisible(brand: Pick<Brand, 'fileAccess'>, isAdmin: boolean) {
  const fa = brand.fileAccess;
  return (path: string) => isAdmin || fa?.mode !== 'selected' || top(path) === UPLOADS || fa.folders.includes(top(path));
}

/** Whether files can be uploaded, or a folder made, inside `path`: the admin anywhere but inside Uploads; the client in the folders they see, except approved deliveries and internal ones. Mirrors
 * server/src/files.ts clientFolderOk. */
export function canAddTo(brand: Pick<Brand, 'fileAccess'>, isAdmin: boolean) {
  const seen = folderVisible(brand, false);
  return (path: string) => {
    if (!path) return false;
    const t = top(path);
    if (t === UPLOADS) return false;
    return isAdmin || (t !== APPROVED && t !== 'Interno Braindy' && seen(path));
  };
}
