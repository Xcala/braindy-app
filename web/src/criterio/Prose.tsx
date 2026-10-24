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

/** Lesson text as the Brains write it (no HTML is ever rendered). */
export function Prose({ text }: { text: string }) {
  return (
    <div className="col g16" style={{ maxWidth: 720 }}>
      {parse(text).map((b, i) => {
        if (b.kind === 'h') return <h2 key={i} className="h3" style={{ marginTop: 12 }}>{inline(b.lines[0])}</h2>;
        if (b.kind === 'ul') return <ul key={i} className="col g8" style={{ ...body, paddingLeft: 22, listStyle: 'disc' }}>{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>;
        if (b.kind === 'quote') return <blockquote key={i} className="h3" style={{ borderLeft: '3px solid var(--azul)', paddingLeft: 16 }}>{inline(b.lines.join(' '))}</blockquote>;
        return <p key={i} style={body}>{inline(b.lines.join(' '))}</p>;
      })}
    </div>
  );
}
