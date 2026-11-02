import type { ReactNode } from 'react';

/** Bold spans in a line: **like this**. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part);
}

type Block = { kind: 'h' | 'p' | 'ul' | 'quote'; lines: string[] };

/** Groups lines: "## " heading, "- " list items, "> " quote, anything else a paragraph; blank lines close a block. */
function parse(text: string): Block[] {
  const out: Block[] = [];
  let cur: Block | null = null;
  for (const raw of text.trim().split('\n')) {
    const line = raw.trimEnd();
    const kind: Block['kind'] | null = !line.trim() ? null : line.startsWith('## ') ? 'h' : line.startsWith('- ') ? 'ul' : line.startsWith('> ') ? 'quote' : 'p';
    if (!kind) { cur = null; continue; }
    if (kind === 'h') { out.push({ kind, lines: [line.slice(3)] }); cur = null; continue; }
    const content = kind === 'ul' ? line.slice(2) : kind === 'quote' ? line.slice(2) : line;
    if (cur && cur.kind === kind) cur.lines.push(content);
    else { cur = { kind, lines: [content] }; out.push(cur); }
  }
  return out;
}

const body = { fontSize: 17, lineHeight: 1.65 } as const;

/**
 * Lesson text as the Brains write it (no HTML is ever rendered). With an accent it reads richer: the first paragraph
 * as a lead, numbered sections (anchors sec-1, sec-2…), lists as check cards and quotes as pull quotes.
 */
export function Prose({ text, accent }: { text: string; accent?: string }) {
  let n = 0, firstP = true;
  return (
    <div className="col g16" style={{ maxWidth: 760 }}>
      {parse(text).map((b, i) => {
        if (b.kind === 'h') {
          if (!accent) return <h2 key={i} className="h3" style={{ marginTop: 12 }}>{inline(b.lines[0])}</h2>;
          n += 1;
          return <h2 key={i} id={`sec-${n}`} className="h3 lx-h"><span className="lx-n" style={{ background: accent }}>{n}</span>{inline(b.lines[0].replace(/^d+.s*/, ''))}</h2>;
        }
        if (b.kind === 'ul') {
          if (!accent) return <ul key={i} className="col g8" style={{ ...body, paddingLeft: 22, listStyle: 'disc' }}>{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>;
          const grid = b.lines.length >= 4 && b.lines.every((l) => l.length < 110);
          return <ul key={i} className={`lx-list${grid ? ' is-grid' : ''}`}>{b.lines.map((l, j) => <li key={j}><i style={{ background: accent }}>✓</i><span>{inline(l)}</span></li>)}</ul>;
        }
        if (b.kind === 'quote') {
          return accent
            ? <blockquote key={i} className="lx-quote" style={{ background: `${accent}14`, color: 'var(--ink)' }}>{inline(b.lines.join(' '))}</blockquote>
            : <blockquote key={i} className="h3" style={{ borderLeft: '3px solid var(--azul)', paddingLeft: 16 }}>{inline(b.lines.join(' '))}</blockquote>;
        }
        const lead = accent && firstP; firstP = false;
        return <p key={i} className={lead ? 'lx-lead' : undefined} style={lead ? undefined : body}>{inline(b.lines.join(' '))}</p>;
      })}
    </div>
  );
}
