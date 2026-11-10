export const UPLOADS = 'Uploads';
/** Where approved deliveries land (server/src/approvedFiles.ts). */
export const APPROVED = 'Entregas aprobadas';
const top = (path) => path.split('/')[0];
/** Mirrors firestore.rules fileAllowed: whether the client sees a folder path. The admin sees everything. */
export function folderVisible(brand, isAdmin) {
    const fa = brand.fileAccess;
    return (path) => isAdmin || fa?.mode !== 'selected' || top(path) === UPLOADS || fa.folders.includes(top(path));
}
