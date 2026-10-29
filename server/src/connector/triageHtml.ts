// Reads Braindy's website triage template (the "Seguimiento de cambios" page: <article class="tri-item"> per point,
// grouped under <div class="tri-group"><h2>Section</h2>). Used by Sanuteam and the sites built after it.
import type { SiteChangeInput, SiteChangeStatus } from './store.js';

const STATUS: Record<string, SiteChangeStatus> = {
  entregado: 'delivered', 'en-curso': 'in_progress', decision: 'decision', cliente: 'client', descartado: 'discarded',
};

const text = (html = '') => html
  .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();

const pick = (html: string, re: RegExp) => text(re.exec(html)?.[1]);

/** Every triage point in the page, in order. Returns [] when the page does not use this template. */
export function parseTriageHtml(html: string): SiteChangeInput[] {
  const out: SiteChangeInput[] = [];
  // Split by section so each point keeps its group name.
  const groups = html.split(/<div class="tri-group">/).slice(1);
  for (const g of groups) {
    const group = pick(g, /<h2[^>]*>([\s\S]*?)<\/h2>/);
    const items = g.split(/<article class="tri-item"/).slice(1);
    for (const it of items) {
      const key = /data-id="([^"]+)"/.exec(it)?.[1];
      const estado = /data-estado="([^"]+)"/.exec(it)?.[1] ?? '';
      const title = pick(it, /<h3[^>]*>([\s\S]*?)<\/h3>/);
      if (!key || !title) continue;
      out.push({
        key, group, title,
        request: pick(it, /<p class="req">([\s\S]*?)<\/p>/),
        source: pick(it, /<p class="src">([\s\S]*?)<\/p>/).replace(/^Fuente:\s*/i, ''),
        delivered: pick(it, /<div class="ent">(?:<b>[^<]*<\/b>)?([\s\S]*?)<\/div>/),
        status: STATUS[estado] ?? 'in_progress',
      });
    }
  }
  return out;
}
