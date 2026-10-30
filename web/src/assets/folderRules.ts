import type { Brand } from '../brands/BrandProvider';

export const UPLOADS = 'Uploads';
const top = (path: string) => path.split('/')[0];

/** Mirrors firestore.rules fileAllowed: whether the client sees a folder path. The admin sees everything. */
export function folderVisible(brand: Pick<Brand, 'fileAccess'>, isAdmin: boolean) {
  const fa = brand.fileAccess;
  return (path: string) => isAdmin || fa?.mode !== 'selected' || top(path) === UPLOADS || fa.folders.includes(top(path));
}
