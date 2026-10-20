import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';

export interface Brand {
  id: string;
  name: string;
  kind: 'brand' | 'group';
  groupId: string | null;
  status: 'active' | 'archived';
  logoUrl: string | null;
  /** Old apps this brand was migrated from: brands, orbit, brief, brandbook. */
  sources: string[];
}

interface BrandState {
  brands: Brand[];
  current: Brand | null;
  select: (id: string) => void;
  loading: boolean;
}

const STORAGE_KEY = 'braindy.brand';
const BrandContext = createContext<BrandState | null>(null);

const toBrand = (id: string, d: Record<string, unknown>): Brand => ({
  id,
  name: String(d.name ?? id),
  kind: d.kind === 'group' ? 'group' : 'brand',
  groupId: (d.groupId as string) ?? null,
  status: d.status === 'archived' ? 'archived' : 'active',
  logoUrl: (d.logoUrl as string) ?? null,
  sources: sourcesOf(d.legacyIds as Record<string, unknown[]> | undefined),
});

const sourcesOf = (l?: Record<string, unknown[]>) => [
  (l?.brands?.length ?? 0) > 0 && 'brands',
  (l?.orbit?.length ?? 0) > 0 && 'orbit',
  (l?.briefEmails?.length ?? 0) > 0 && 'brief',
  (l?.brandingProjects?.length ?? 0) > 0 && 'brandbook',
].filter((x): x is string => !!x);

/** Admin sees every brand; clients see the brands listed in their profile (rules enforce the same). */
export function BrandProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const isAdmin = profile?.role === 'admin';
  const brandIds = (profile?.brandIds ?? []).join(',');

  useEffect(() => {
    if (!profile) return;
    if (isAdmin) {
      return onSnapshot(collection(db, 'brands'), (snap) => {
        setBrands(snap.docs.map((d) => toBrand(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      });
    }
    // Direct brands plus, for groups, every brand below them (group members see the whole group).
    const found = new Map<string, Brand>();
    const unsubs = new Map<string, () => void>();
    const publish = () => setBrands([...found.values()].sort((a, b) => a.name.localeCompare(b.name)));
    const watch = (id: string) => {
      if (unsubs.has(id)) return;
      unsubs.set(id, onSnapshot(doc(db, 'brands', id), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          found.set(id, toBrand(id, data));
          if (data.kind === 'group') ((data.descendants as string[]) ?? []).forEach(watch);
        } else {
          found.delete(id);
        }
        publish();
        setLoading(false);
      }, () => setLoading(false)));
    };
    const ids = brandIds ? brandIds.split(',') : [];
    if (!ids.length) setLoading(false);
    ids.forEach(watch);
    return () => unsubs.forEach((u) => u());
  }, [profile, isAdmin, brandIds]);

  const current = useMemo(() => {
    const visible = isAdmin ? brands : brands;
    return visible.find((b) => b.id === selected)
      ?? visible.find((b) => b.status === 'active' && b.id !== 'braindy')
      ?? visible[0] ?? null;
  }, [brands, selected, isAdmin]);

  const select = (id: string) => {
    setSelected(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* storage unavailable */ }
  };

  return <BrandContext.Provider value={{ brands, current, select, loading }}>{children}</BrandContext.Provider>;
}

export function useBrands(): BrandState {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrands must be used inside BrandProvider');
  return ctx;
}

/** Orders brands as a tree: each group followed by its children (indented by depth). */
export function asTree(brands: Brand[]): Array<{ brand: Brand; depth: number }> {
  const byParent = new Map<string | null, Brand[]>();
  const ids = new Set(brands.map((b) => b.id));
  for (const b of brands) {
    const parent = b.groupId && ids.has(b.groupId) ? b.groupId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), b]);
  }
  const out: Array<{ brand: Brand; depth: number }> = [];
  const visit = (parent: string | null, depth: number) => {
    for (const b of byParent.get(parent) ?? []) {
      out.push({ brand: b, depth });
      visit(b.id, depth + 1);
    }
  };
  visit(null, 0);
  return out;
}
