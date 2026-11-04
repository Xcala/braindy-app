import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Brand } from '../brands/BrandProvider';

/**
 * NickMark turns a top-level folder on or off for the client, right on the folder. While every folder is on the brand
 * stays in mode 'all'; once one is off it switches to 'selected', so folders imported later start hidden.
 */
export function useFolderShare(brand: Brand | undefined, tops: string[]) {
  const fa = brand?.fileAccess;
  const shared = new Set(fa?.mode === 'selected' ? fa.folders : tops);
  const write = (next: Set<string>) => {
    if (!brand) return Promise.resolve();
    const all = tops.every((p) => next.has(p));
    return updateDoc(doc(db, 'brands', brand.id), { fileAccess: all ? { mode: 'all', folders: [] } : { mode: 'selected', folders: [...next] } });
  };
  return {
    isShared: (top: string) => shared.has(top),
    count: tops.filter((p) => shared.has(p)).length,
    toggle: (top: string) => { const n = new Set(shared); if (n.has(top)) n.delete(top); else n.add(top); return write(n); },
    showAll: () => write(new Set(tops)),
    hideAll: () => write(new Set()),
  };
}
