import type { ReactNode } from 'react';
import { scanBlocks } from '../lib/scan';
import './scan.css';

/**
 * Any text written for people, shown to scan before reading: short headings, one point per line and the key of
 * each point in bold. `list` makes comma lists (rules, what to avoid) into points too; `points` splits every
 * paragraph of two or more sentences (otherwise only long ones).
 */
export function Scan({ text, list, points, className = 't-sm', tone = 'mute' }: { text: string; list?: boolean; points?: boolean; className?: string; tone?: 'mute' | 'ink' }) {
  return (
    <div className={`scan scan-${tone} ${className}`}>
      {scanBlocks(text, { list, points }).map((b, i) => b.kind === 'head' ? <p key={i} className="scan-head">{bold(b.text)}</p>
        : b.kind === 'p' ? <p key={i}>{bold(b.text)}</p>
        : <ul key={i} className="scan-list">{b.items.map((x, j) => <li key={j}>{bold(x)}</li>)}</ul>)}
    </div>
  );
}

export const bold = (s: string): ReactNode[] => s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
