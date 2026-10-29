// Every link that leaves the app (client sites, apps, research, files, WhatsApp) opens in a new tab,
// wherever it is rendered: cards, comments, request briefs, lessons. Links inside the app keep the same tab.
export function installExternalLinks() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    const external = /^https?:$/.test(url.protocol) && url.origin !== location.origin;
    if (!external || a.target === '_blank') return;
    e.preventDefault();
    window.open(url.href, '_blank', 'noopener,noreferrer');
  }, true);
}
