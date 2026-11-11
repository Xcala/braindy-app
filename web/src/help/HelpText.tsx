import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** **bold** and [links](/path) inside one line. App paths open in place; https links open a new tab; anything else stays text. */
function inline(text: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<b key={k++}>{m[1]}</b>);
    else if (m[3]!.startsWith('/') && !m[3]!.startsWith('//')) out.push(<Link key={k++} to={m[3]!} onClick={onNavigate}>{m[2]}</Link>);
    else if (m[3]!.startsWith('https://')) out.push(<a key={k++} href={m[3]} target="_blank" rel="noreferrer">{m[2]}</a>);
    else out.push(m[2]);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** The assistant's short markdown: paragraphs and bullet lists, nothing else. */
export function HelpText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length}>{list.map((l, i) => <li key={i}>{inline(l, onNavigate)}</li>)}</ul>);
    list = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = /^([-•*]|\d+\.)\s+(.*)$/.exec(line);
    if (bullet) { list.push(bullet[2]!); continue; }
    flush();
    if (line) blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ''), onNavigate)}</p>);
  }
  flush();
  return <>{blocks}</>;
}
