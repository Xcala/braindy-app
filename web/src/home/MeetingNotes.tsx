import type { ReactNode } from 'react';

type Item = { text: string; depth: number };
type Section = { title?: string; paras: string[]; items: Item[] };

const NEXT = /pr[oó]ximos pasos|siguientes pasos|next steps|action items|acuerdos|tareas|pendientes|to-?dos?/i;

/** Granola notes are light markdown: headings (with or without #), nested "-" bullets and **bold**. */
export function parseNotes(md: string): Section[] {
  const out: Section[] = [];
  let cur: Section = { paras: [], items: [] };
  const push = () => { if (cur.title || cur.paras.length || cur.items.length) out.push(cur); };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const bullet = /^(\s*)(?:[-*•]|\d+[.)])\s+(.*)$/.exec(raw);
    if (bullet) { cur.items.push({ text: bullet[2], depth: Math.min(2, Math.floor(bullet[1].replace(/\t/g, '  ').length / 2)) }); continue; }
    const line = raw.replace(/^#+\s*/, '').trim();
    // A short line that is not a sentence opens a new topic; anything else is a paragraph of the current one.
    if (/^#+\s/.test(raw) || (line.length <= 90 && !/[.:;]$/.test(line))) { push(); cur = { title: line.replace(/\*\*/g, ''), paras: [], items: [] }; }
    else cur.paras.push(line);
  }
  push();
  return out;
}

const inline = (s: string): ReactNode[] => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

/** Meeting notes laid out as topics: a numbered title per topic, bullets with hierarchy, next steps as a checklist. */
export function MeetingNotes({ notes }: { notes: string }) {
  const sections = parseNotes(notes);
  let n = 0;
  return (
    <div className="mnotes">
      {sections.map((s, i) => {
        const next = !!s.title && NEXT.test(s.title);
        if (s.title && !next) n++;
        return (
          <section key={i} className={`mtopic${next ? ' is-next' : ''}`}>
            {s.title && (
              <h4 className="mtopic-h">
                {next ? <span className="mtopic-n" aria-hidden="true">✓</span> : <span className="mtopic-n">{String(n).padStart(2, '0')}</span>}
                <span>{s.title}</span>
              </h4>
            )}
            {s.paras.map((p, k) => <p key={k} className="mtopic-p">{inline(p)}</p>)}
            {s.items.length > 0 && (
              <ul className="mlist">
                {s.items.map((it, k) => <li key={k} className={`d${it.depth}`}>{inline(it.text)}</li>)}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** The topic titles, for the closed card's preview. */
export const topics = (notes: string) => parseNotes(notes).map((s) => s.title).filter((x): x is string => !!x && !NEXT.test(x));
