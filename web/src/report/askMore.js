/** «Ask for more like this»: the Ask panel opens with the post's text and link already in (social › organic). */
export function askMoreHref(text, link) {
    const p = new URLSearchParams({ new: '1', cat: 'social', sub: 'organic', text });
    if (/^https:\/\//.test(link))
        p.set('link', link);
    return `/requests?${p}`;
}
const day = (s) => s.slice(0, 10);
/** A calendar post's numbers: the Metricool post with the same link, else the one of that network on that day. */
export function statFor(stats, post) {
    const d = new Date(+post.date - post.date.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    for (const n of post.networks) {
        const net = stats.find((s) => s.network === n.network.toLowerCase());
        if (!net)
            continue;
        const hit = (n.url && net.posts.find((p) => p.url && p.url === n.url)) || net.posts.find((p) => day(p.date) === d && p.type !== 'story');
        if (hit)
            return { ...hit, network: net.network };
    }
    return null;
}
