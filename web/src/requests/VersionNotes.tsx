import { Scan } from '../components/Scan';

/** A delivery note made to scan (sections, bullets, bold keys); older notes written in one block are split too. */
export function VersionNotes({ text, className = 't-sm' }: { text: string; className?: string }) {
  return <Scan text={text} className={className} points />;
}
