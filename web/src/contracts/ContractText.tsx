import { Fragment, type ReactNode } from 'react';

/** **bold** runs inside a line. */
const inline = (s: string): ReactNode[] => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean)
  .map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>));

/** The contract text (markdown subset: ## headings, paragraphs, numbered items, tables). Blanks show as ________. */
export function ContractText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  return (
    <article className="col g12 t-sm" style={{ lineHeight: 1.6, color: 'var(--ink)' }}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (!lines.length || lines[0].trim() === '---') return null;
        if (lines[0].startsWith('## ') || lines[0].startsWith('### ')) {
          return (
            <Fragment key={i}>
              <h3 className="w9" style={{ fontSize: 15, marginTop: 8 }}>{lines[0].replace(/^#+\s/, '')}</h3>
              {lines.slice(1).map((l, k) => <p key={k}>{inline(l)}</p>)}
            </Fragment>
          );
        }
        if (lines[0].startsWith('|')) {
          const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
          return (
            <div key={i} style={{ overflowX: 'auto' }}>
              <table className="t-sm" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 420 }}>
                <tbody>{rows.map((r, k) => (
                  <tr key={k}>{r.map((c, j) => {
                    const Cell = k === 0 ? 'th' : 'td';
                    return <Cell key={j} style={{ border: '1px solid #E3E7F0', padding: '6px 8px', textAlign: 'left', background: k === 0 ? '#F4F6FA' : undefined }}>{inline(c)}</Cell>;
                  })}</tr>
                ))}</tbody>
              </table>
            </div>
          );
        }
        return <div key={i} className="col g4">{lines.map((l, k) => <p key={k} style={/^\d+\.\s/.test(l.trim()) ? { paddingLeft: 12 } : undefined}>{inline(l.trim())}</p>)}</div>;
      })}
    </article>
  );
}
