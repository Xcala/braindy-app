import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
export function useProposals() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => onSnapshot(query(collection(db, 'proposals'), orderBy('createdAt', 'desc')), (s) => {
        setList(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
    }, () => setLoading(false)), []);
    return { list, loading };
}
/** Proposals only for admins (clients cannot read them; avoids a denied listener). */
useProposals.optional = function useProposalsOptional(enabled) {
    const [list, setList] = useState([]);
    useEffect(() => {
        if (!enabled)
            return;
        return onSnapshot(query(collection(db, 'proposals'), orderBy('createdAt', 'desc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [enabled]);
    return { list };
};
export function useProposal(id) {
    const [p, setP] = useState(undefined);
    useEffect(() => onSnapshot(doc(db, 'proposals', id), (s) => setP(s.exists() ? { id: s.id, ...s.data() } : null)), [id]);
    return p;
}
export function useSends(id) {
    const [sends, setSends] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'proposals', id, 'sends'), orderBy('createdAt', 'desc')), (s) => setSends(s.docs.map((d) => ({ id: d.id, ...d.data() })))), [id]);
    return sends;
}
export function useEvents(id, sendId) {
    const [events, setEvents] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'proposals', id, 'sends', sendId, 'events'), orderBy('at', 'asc')), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() })))), [id, sendId]);
    return events;
}
export function useProposalFiles(id) {
    const [files, setFiles] = useState([]);
    useEffect(() => onSnapshot(collection(db, 'proposals', id, 'files'), (s) => setFiles(s.docs.map((d) => ({ id: d.id, ...d.data() })))), [id]);
    return files;
}
