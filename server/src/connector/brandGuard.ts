// Keeps one brand's work out of another brand's delivery. A client with several brands (a restaurant group) shares
// people across them, so a request that mentions two restaurants could come back with both pieces in one version.
// A file whose name carries a sibling brand's name or initials ("Hacienda", "CEEA") is refused for this brand.
import { db } from '../firebase.js';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Words that identify a brand in a file name: its full name, its first long word and its initials. */
function marks(name: string): string[] {
  const words = fold(name).split(/[^a-z0-9]+/).filter(Boolean);
  const initials = words.map((w) => w[0]).join('');
  return [words.join(' '), ...(words[0]?.length >= 6 ? [words[0]] : []), ...(initials.length >= 3 ? [initials] : [])];
}

/** Brands that share a client with this one (through users' brandIds), with their names. */
async function siblings(brandId: string) {
  const users = await db.collection('users').where('brandIds', 'array-contains', brandId).limit(20).get();
  const ids = new Set<string>();
  users.docs.forEach((u) => ((u.get('brandIds') as string[]) ?? []).forEach((id) => id !== brandId && ids.add(id)));
  if (!ids.size || ids.size > 30) return []; // admins see every brand: only a client's own group counts
  const docs = await db.getAll(...[...ids].map((id) => db.doc(`brands/${id}`)));
  return docs.filter((d) => d.exists).map((d) => ({ id: d.id, name: String(d.get('name') ?? d.id) }));
}

/** Throws when a file name points at another brand of the same client. */
export async function assertOwnBrand(brandId: string, fileNames: string[]) {
  const own = (await db.doc(`brands/${brandId}`).get()).get('name') as string | undefined;
  const ownMarks = new Set(own ? marks(own) : []);
  for (const b of await siblings(brandId)) {
    const theirs = marks(b.name).filter((m) => !ownMarks.has(m));
    for (const f of fileNames) {
      const t = ` ${fold(f).replace(/[^a-z0-9]+/g, ' ')} `;
      const hit = theirs.find((m) => t.includes(` ${m} `));
      if (hit) throw new Error(`«${f}» parece de ${b.name}, no de esta marca. Cada marca va en su propia solicitud: entrega aquí solo lo de esta marca.`);
    }
  }
}
