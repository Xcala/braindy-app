import { daysFrom, isOverdue } from '../lib/dates';
export const TABS = ['all', 'active', 'to_approve', 'late', 'done'];
export const DUES = ['all', 'late', 'week', 'month', 'none'];
export const ASKEDS = ['all', '7', '30', '90', 'year'];
export const SORTS = ['action', 'new', 'old', 'due', 'updated', 'name'];
export const NO_FILTERS = { q: '', who: '', due: 'all', asked: 'all', sort: 'action', tab: 'all', tag: '', archived: false };
export const isLate = (r) => r.status === 'in_production' && !!r.dueDate && isOverdue(r.dueDate);
const ms = (r, k) => r[k]?.toMillis?.() ?? 0;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const inTab = (tab, r) => tab === 'all' || (tab === 'late' ? isLate(r) : tab === 'active' ? r.status === 'in_production' || r.status === 'to_approve'
    : tab === 'done' ? r.status === 'approved' || r.status === 'published' : r.status === tab);
/** What needs someone first: to approve, then overdue, then in production by due date, then the rest newest first. */
const rank = (r) => (r.status === 'to_approve' ? 0 : isLate(r) ? 1 : r.status === 'in_production' ? 2 : 3);
function inDue(due, r) {
    if (due === 'all')
        return true;
    if (due === 'none')
        return !r.dueDate;
    if (due === 'late')
        return isLate(r);
    const n = daysFrom(r.dueDate);
    return n != null && n >= 0 && n <= (due === 'week' ? 7 : 31);
}
function inAsked(asked, r) {
    if (asked === 'all')
        return true;
    const t = ms(r, 'createdAt');
    if (asked === 'year')
        return new Date(t).getFullYear() === new Date().getFullYear();
    return t >= Date.now() - Number(asked) * 864e5;
}
/** Everything but the status tab, so the tabs can show how many each one would hold. */
export function narrow(list, f, typeLabel) {
    const q = norm(f.q.trim());
    return list.filter((r) => (!q || norm(`${r.title} ${r.formatType ?? ''} ${typeLabel(r)} ${(r.tags ?? []).join(' ')}`).includes(q))
        && (!f.who || r.createdBy === f.who) && (!f.tag || !!r.tags?.includes(f.tag)) && !!r.archived === f.archived
        && inDue(f.due, r) && inAsked(f.asked, r));
}
export function sortRequests(list, sort) {
    const by = {
        action: (a, b) => rank(a) - rank(b) || (rank(a) === 2 ? String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')) : ms(b, 'createdAt') - ms(a, 'createdAt')),
        new: (a, b) => ms(b, 'createdAt') - ms(a, 'createdAt'),
        old: (a, b) => ms(a, 'createdAt') - ms(b, 'createdAt'),
        due: (a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')),
        updated: (a, b) => ms(b, 'updatedAt') - ms(a, 'updatedAt'),
        name: (a, b) => a.title.localeCompare(b.title),
    };
    return [...list].sort(by[sort]);
}
export const isFiltered = (f) => !!f.q || !!f.who || !!f.tag || f.archived || f.due !== 'all' || f.asked !== 'all' || f.tab !== 'all';
/** How many of the filters behind the "Filters" button are on (search and tabs are always in sight). */
export const hiddenCount = (f) => [!!f.who, !!f.tag, f.archived, f.due !== 'all', f.asked !== 'all', f.sort !== 'action'].filter(Boolean).length;
/** Filters live in the address (?tab=late&q=logo) so a filtered view can be sent as a link. Defaults stay out of it. */
export function filtersFromParams(p) {
    const pick = (k, ok, d) => (ok.includes(p.get(k)) ? p.get(k) : d);
    return {
        q: p.get('q') ?? '', who: p.get('who') ?? '', tag: p.get('tag') ?? '', archived: p.get('archived') === '1',
        due: pick('due', DUES, 'all'), asked: pick('asked', ASKEDS, 'all'), sort: pick('sort', SORTS, 'action'), tab: pick('tab', TABS, 'all'),
    };
}
export function filtersToParams(f, keep) {
    const p = new URLSearchParams(keep);
    for (const k of Object.keys(NO_FILTERS))
        p.delete(k);
    for (const [k, v] of Object.entries(f))
        if (v !== NO_FILTERS[k])
            p.set(k, v === true ? '1' : String(v));
    return p;
}
