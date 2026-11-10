import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
const DAYS = 14;
const MAX_WATCHED = 12;
const ms = (t) => t?.toMillis() ?? 0;
const approvedAt = (r) => ms(r.approvedAt ?? r.updatedAt);
/** Everything worth a bell for these brands in the last two weeks: deliveries to approve, approvals,
 *  requests entering production, comments from someone else, and apps published in My apps. */
export function useNotifications(brandIds) {
    const { user } = useAuth();
    const reqs = useBrandsRequests(brandIds);
    const since = Date.now() - DAYS * 864e5;
    const [comments, setComments] = useState({});
    const [apps, setApps] = useState({});
    // Comments: only on the requests that moved lately (one listener each, capped).
    const watched = reqs.filter((r) => r.status !== 'published' && ms(r.updatedAt ?? r.createdAt) > since).slice(0, MAX_WATCHED);
    const watchKey = watched.map((r) => `${r.brandId}/${r.id}`).join(',');
    useEffect(() => {
        setComments({});
        if (!watchKey || !user)
            return;
        const from = Timestamp.fromMillis(Date.now() - DAYS * 864e5);
        const offs = watchKey.split(',').map((k) => {
            const [b, id] = k.split('/');
            const title = reqs.find((r) => r.id === id)?.title ?? '';
            return onSnapshot(query(collection(db, 'brands', b, 'requests', id, 'comments'), where('createdAt', '>', from)), (s) => setComments((m) => ({ ...m, [k]: s.docs.filter((d) => d.get('author') !== user.uid).map((d) => ({
                    key: `c-${d.id}`, kind: 'comment', title, text: String(d.get('text') ?? ''), at: ms(d.get('createdAt')), brandId: b, to: `/requests/${id}`, requestBrand: true,
                })) })), () => setComments((m) => ({ ...m, [k]: [] })));
        });
        return () => offs.forEach((o) => o());
        // eslint-disable-next-line react-hooks/exhaustive-deps -- titles come along with the same key
    }, [watchKey, user]);
    // Apps published in My apps.
    const brandKey = brandIds.join(',');
    useEffect(() => {
        setApps({});
        if (!brandKey)
            return;
        const offs = brandKey.split(',').map((b) => onSnapshot(query(collection(db, 'brands', b, 'links'), where('section', '==', 'apps')), (s) => setApps((m) => ({ ...m, [b]: s.docs.filter((d) => d.get('status') !== 'building').map((d) => ({
                key: `a-${d.id}`, kind: 'app', title: String(d.get('title') ?? ''), at: ms(d.get('updatedAt') ?? d.get('createdAt')), brandId: b, to: '/apps',
            })) })), () => setApps((m) => ({ ...m, [b]: [] }))));
        return () => offs.forEach((o) => o());
    }, [brandKey]);
    const fromReqs = reqs.flatMap((r) => {
        const base = { title: r.title, brandId: r.brandId, to: `/requests/${r.id}`, requestBrand: true };
        if (r.status === 'to_approve')
            return [{ ...base, key: `t-${r.id}`, kind: 'toApprove', at: ms(r.updatedAt) }];
        if (r.status === 'approved' || r.status === 'published')
            return [{ ...base, key: `ok-${r.id}`, kind: 'approved', at: approvedAt(r) }];
        return [{ ...base, key: `p-${r.id}`, kind: 'production', at: ms(r.createdAt) }];
    });
    return [...fromReqs, ...Object.values(comments).flat(), ...Object.values(apps).flat()]
        .filter((n) => n.kind === 'toApprove' || n.at > since)
        .sort((a, b) => b.at - a.at);
}
