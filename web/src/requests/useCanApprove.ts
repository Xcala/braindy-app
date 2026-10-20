import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';

/** Whether the signed-in user can approve on a brand (admin, owner, or member with canApprove, incl. via a group). */
export function useCanApprove(brandId?: string) {
  const { user, profile } = useAuth();
  const [can, setCan] = useState(false);
  useEffect(() => {
    if (!brandId || !user) return;
    if (profile?.role === 'admin') { setCan(true); return; }
    let alive = true;
    (async () => {
      const brand = await getDoc(doc(db, 'brands', brandId));
      const chain = [brandId, ...((brand.get('ancestors') as string[]) ?? [])];
      for (const id of chain) {
        const m = await getDoc(doc(db, 'brands', id, 'members', user.uid)).catch(() => null);
        if (m?.exists()) { if (alive) setCan(m.get('role') === 'client_owner' || m.get('canApprove') === true); return; }
      }
      if (alive) setCan(false);
    })();
    return () => { alive = false; };
  }, [brandId, user, profile?.role]);
  return can;
}
