import type { ReactNode } from 'react';

/**
 * A closed block with a title you tap to open (2026-11-17): inside a tab, what the person comes to do stays open on top and the
 * rest folds here, so no page needs a second row of tabs. Max ~3 blocks per tab.
 */
export function Fold({ id, title, sub, open, children }: { id?: string; title: string; sub?: string; open?: boolean; children: ReactNode }) {
  return (
    <details id={id} className="card fold" open={open} style={{ padding: 0 }}>
      <summary className="row between g12" style={{ padding: '1.125rem 1.375rem', cursor: 'pointer', listStyle: 'none' }}>
        <span className="col g4" style={{ minWidth: 0 }}>
          <span className="h3">{title}</span>
          {sub && <span className="t-sm t-mute">{sub}</span>}
        </span>
        <span aria-hidden className="fold-chev" style={{ fontSize: '1.25rem', lineHeight: 1 }}>⌄</span>
      </summary>
      <div className="col g24" style={{ padding: '0 1.375rem 1.375rem' }}>{children}</div>
    </details>
  );
}
