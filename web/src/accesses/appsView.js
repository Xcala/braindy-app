import { signInOf } from './useAccesses';
export const DEFAULT_VIEW = { layout: 'list', sort: 'manual', groupBy: 'none', filter: 'all' };
const VIEW_KEY = 'apps-view-1';
export function loadView() {
    try {
        return { ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(VIEW_KEY) ?? '{}') };
    }
    catch {
        return DEFAULT_VIEW;
    }
}
export function saveView(v) { try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(v));
}
catch { /* storage blocked */ } }
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Name, user, link, notes, plan and group: every word typed has to appear somewhere. */
export function matches(a, q) {
    const hay = fold([a.platform, a.username, a.link, a.notes, a.subscription?.plan, a.group].filter(Boolean).join(' '));
    return fold(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
export function passes(a, f) {
    if (f === 'subs')
        return !!a.subscription;
    if (f === 'google' || f === 'microsoft')
        return signInOf(a) === f;
    if (f === 'missing')
        return signInOf(a) === 'password' && !a.hasSecret;
    return true;
}
/** What it costs per month in USD-equivalent terms of its own currency (yearly plans count a twelfth). */
export const perMonth = (a) => {
    const s = a.subscription;
    return s?.price != null ? (s.period === 'year' ? s.price / 12 : s.price) : 0;
};
/** Monthly totals per currency for a set of apps. */
export function monthlyTotals(list) {
    const m = new Map();
    for (const a of list)
        if (a.subscription?.price != null)
            m.set(a.subscription.currency ?? 'USD', (m.get(a.subscription.currency ?? 'USD') ?? 0) + perMonth(a));
    return m;
}
/** "My order" is the dragged order (new apps go last, by name); the rest are the usual sorts. */
export function sortApps(list, sort) {
    const byName = (a, b) => a.platform.localeCompare(b.platform);
    const out = [...list];
    if (sort === 'az')
        return out.sort(byName);
    if (sort === 'price')
        return out.sort((a, b) => perMonth(b) - perMonth(a) || byName(a, b));
    if (sort === 'recent')
        return out.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
    return out.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || byName(a, b));
}
/** The key each app falls under; for "group" it is also the value saved when an app is dropped into it. */
export function groupKey(a, by) {
    if (by === 'group')
        return a.group ?? '';
    if (by === 'signIn')
        return signInOf(a);
    if (by === 'account')
        return a.username?.trim().toLowerCase() ?? '';
    return '';
}
/** Groups in name order, the ones without a value last. Items keep the order they came in. */
export function groupApps(list, by, t) {
    if (by === 'none')
        return [{ key: '', label: '', items: list }];
    const map = new Map();
    for (const a of list) {
        const k = groupKey(a, by);
        map.set(k, [...(map.get(k) ?? []), a]);
    }
    const SIGN = { password: 'acc.signInPassword', google: 'acc.signInGoogle', microsoft: 'acc.signInMicrosoft' };
    const label = (k) => by === 'signIn' ? t(SIGN[k]) : k || t(by === 'group' ? 'apps.noGroup' : 'apps.noUser');
    return [...map].map(([key, items]) => ({ key, label: label(key), items }))
        .sort((a, b) => (a.key === '' ? 1 : 0) - (b.key === '' ? 1 : 0) || a.label.localeCompare(b.label));
}
