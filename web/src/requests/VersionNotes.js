import { jsx as _jsx } from "react/jsx-runtime";
import { Scan } from '../components/Scan';
/** A delivery note made to scan (sections, bullets, bold keys); older notes written in one block are split too. */
export function VersionNotes({ text, className = 't-sm' }) {
    return _jsx(Scan, { text: text, className: className, points: true });
}
