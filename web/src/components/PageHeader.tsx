import type { ReactNode } from 'react';
import { HowLink } from '../learn/tutorials';

/**
 * The same head on every tab of a section (2026-11-12, design audit): the title is the tab's name, one short line under it,
 * and on the right, in one row, «▶ How it works», the secondary actions and at most one primary (blue) action.
 * On phones the actions drop under the title.
 */
export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="pagehead">
      <div className="col g4 pagehead-text">
        <h1 className="h1"><span className="w9">{title}.</span></h1>
        {sub && <p className="t-md t-mute" style={{ margin: 0 }}>{sub}</p>}
      </div>
      <div className="pagehead-actions"><HowLink />{actions}</div>
    </header>
  );
}
