const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s, n) => { const d = new Date(`${s}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a, b) => Math.round((+new Date(`${b}T12:00:00`) - +new Date(`${a}T12:00:00`)) / 864e5) + 1;
/** The period's dates, ending on the last day with data (Metricool runs a day behind), and the same length right before it. */
export function rangeOf(p, daily) {
    const last = daily.at(-1)?.d ?? iso(new Date());
    const first = daily[0]?.d ?? last;
    let cur;
    if (p === 'all')
        cur = { from: first, to: last };
    else if (p === 'month')
        cur = { from: `${last.slice(0, 8)}01`, to: last };
    else if (p === 'lastMonth') {
        const end = addDays(`${last.slice(0, 8)}01`, -1);
        cur = { from: `${end.slice(0, 8)}01`, to: end };
    }
    else
        cur = { from: addDays(last, 1 - Number(p)), to: last };
    const n = daysBetween(cur.from, cur.to);
    const prev = p === 'all' ? null : { from: addDays(cur.from, -n), to: addDays(cur.from, -1) };
    return { cur, prev: prev && prev.to >= first ? prev : null };
}
export const inRange = (d, r) => d >= r.from && d <= r.to.slice(0, 10) + '￿';
/** Followers is a level (last known value); everything else adds up over the days. */
export function total(daily, key, r) {
    const rows = daily.filter((x) => inRange(x.d, r) && x[key] != null);
    if (!rows.length)
        return null;
    return key === 'followers' ? rows.at(-1)[key] : rows.reduce((n, x) => n + (x[key] ?? 0), 0);
}
/** Followers at the start of the range (last value before it, else its first). */
export function followersAt(daily, r) {
    const before = daily.filter((x) => x.d < r.from && x.followers != null).at(-1);
    return before?.followers ?? daily.find((x) => inRange(x.d, r) && x.followers != null)?.followers ?? null;
}
export const change = (now, before) => (now == null || before == null || before === 0 ? null : Math.round(((now - before) / before) * 100));
/** Points for the chart: by day up to ~45 days, by week up to ~200, else by month. */
export function series(daily, key, r) {
    const rows = daily.filter((x) => inRange(x.d, r));
    const n = daysBetween(r.from, r.to);
    const bucket = n <= 45 ? (d) => d : n <= 200 ? (d) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); } : (d) => d.slice(0, 7);
    const out = new Map();
    for (const x of rows) {
        const k = bucket(x.d), v = x[key];
        if (v == null) {
            if (!out.has(k))
                out.set(k, null);
            continue;
        }
        out.set(k, key === 'followers' ? v : (out.get(k) ?? 0) + v);
    }
    return { unit: n <= 45 ? 'day' : n <= 200 ? 'week' : 'month', points: [...out].map(([k, v]) => ({ k, v })) };
}
export const postsIn = (posts, r) => posts.filter((p) => inRange(p.date.slice(0, 10), r));
/** Which daily keys a network has any value for (LinkedIn has no stories, YouTube no reach…). */
export const keysOf = (daily) => new Set(daily.flatMap((x) => Object.keys(x).filter((k) => k !== 'd' && x[k] != null)));
/** All networks added up, day by day: followers carry each network's last known count forward so a missing day doesn't dip;
 *  everything else is summed where any network has it. Posts from every network, each tagged with its own. Audience stays per network. */
export function combine(list) {
    const dates = [...new Set(list.flatMap((n) => n.daily.map((x) => x.d)))].sort();
    const byNet = list.map((n) => new Map(n.daily.map((x) => [x.d, x])));
    const lastF = list.map(() => null);
    const daily = dates.map((d) => {
        const row = { d };
        byNet.forEach((m, i) => {
            const x = m.get(d);
            if (x?.followers != null)
                lastF[i] = x.followers;
            for (const k of Object.keys(x ?? {})) {
                if (k === 'd' || k === 'followers' || x[k] == null)
                    continue;
                row[k] = (row[k] ?? 0) + x[k];
            }
        });
        const known = lastF.filter((v) => v != null);
        if (known.length)
            row.followers = known.reduce((a, b) => a + b, 0);
        return row;
    });
    const posts = list.flatMap((n) => n.posts.map((p) => ({ ...p, network: n.network }))).sort((a, b) => b.date.localeCompare(a.date));
    return { network: 'all', handle: '', daily, posts, audience: null, updatedAt: null };
}
