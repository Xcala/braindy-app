import type { ReactNode } from 'react';
import './viewer.css';

/**
 * A delivery note made to scan: "- item" lines become bullets, a short line ending in ":" a small heading, and
 * **words** bold. Older notes written in one block with " • " between points are split into bullets too.
 */
export function VersionNotes({ text, className = 't-sm' }: { text: string; className?: string }) {
  const lines = text.replace(/\s+•\s+/g, '\n- ').split('\n').map((l) => l.trim());
  const out: ReactNode[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length) out.push(<ul key={out.length} className="vn-list">{items.map((x, i) => <li key={i}>{bold(x)}</li>)}</ul>);
    items = [];
  };
  for (const l of lines) {
    const item = l.match(/^[-•*]\s+(.*)$/);
    if (item) { items.push(item[1]!); continue; }
    flush();
    if (!l) continue;
    out.push(l.length <= 60 && l.endsWith(':')
      ? <p key={out.length} className="vn-head">{bold(l.slice(0, -1))}</p>
      : <p key={out.length} className="vn-p">{bold(l)}</p>);
  }
  flush();
  return <div className={`vn ${className}`}>{out}</div>;
}

const bold = (s: string) => s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
