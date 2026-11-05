// Turns prose into something to scan: short headings, one point per line, the key of each point in bold.
// Works on text that is already shaped ("Para revisar:", "- **Fotos:** …") and on text written as one block:
// " • " separators, "1) … 2) …" enumerations, comma lists (when asked) and long paragraphs split by sentence.

export type Block = { kind: 'head'; text: string } | { kind: 'p'; text: string } | { kind: 'list'; items: string[] };

const LONG = 200;

/** Top-level splits on `sep` (outside parentheses and quotes). */
function splitTop(s: string, sep: RegExp, prev?: RegExp): string[] {
  const out: string[] = [];
  let depth = 0, quote = '', start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (quote) { if (c === quote) quote = ''; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    else if ((c === '«' || c === '"' || c === '“') && depth === 0) quote = c === '«' ? '»' : c === '“' ? '”' : '"';
    else if (depth === 0 && (!prev || prev.test(s[i - 1] ?? ''))) {
      const m = sep.exec(s.slice(i));
      if (m && m.index === 0) { out.push(s.slice(start, i)); i += m[0].length - 1; start = i + 1; }
    }
  }
  out.push(s.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

const sentences = (s: string) => splitTop(s, /^\s+(?=[A-ZÁÉÍÓÚÑ¿¡"«(0-9#])/, /[.!?]/);

/** "Key: detail" or "Key — detail" gets its key in bold; a point that already has bold is left as it is. */
export function boldLead(item: string): string {
  if (item.includes('**')) return item;
  const m = /^([^:—–]{2,48}?)(:|\s[—–]\s)\s*(.+)$/.exec(item);
  if (m && !/^https?$/i.test(m[1]!)) return `**${m[1]!.trim()}**${m[2] === ':' ? ':' : ' —'} ${m[3]}`;
  // A first clause of up to six words before a comma or a parenthesis reads as the point's key.
  const c = /^([^,(]{3,60}?)([,(].+)$/.exec(item);
  if (c && c[1]!.trim().split(/\s+/).length <= 6 && c[2]!.length > 12) return `**${c[1]!.trim()}**${c[2]!.startsWith('(') ? ' ' : ''}${c[2]}`;
  // Otherwise the subject: the words before the first "que", "en", "con", "para"… (one to six of them).
  const s = /^((?:\S+\s+){0,5}?\S+?)(;?\s+(?:que|en|con|para|sobre|mientras|cuando|who|that|with|for|in|on|when)\s.{12,})$/i.exec(item);
  if (s && item.split(/\s+/).length >= 7 && !/^(el|la|los|las|un|una|de|si|y|the|a|an|if)$/i.test(s[1]!)) return `**${s[1]}**${s[2]}`;
  return item;
}

/**
 * Parses a text into blocks. `list`: a paragraph with three or more comma or semicolon parts becomes a list.
 * `points`: any paragraph of two or more sentences becomes one point per sentence (otherwise only long ones do).
 */
export function scanBlocks(text: string, opts: { list?: boolean; points?: boolean } = {}): Block[] {
  const norm = text
    .replace(/\r/g, '')
    .replace(/\s+•\s+/g, '\n- ')
    .replace(/^\s*[·•*–]\s+/gm, '- ');
  const out: Block[] = [];
  let items: string[] = [];
  const flush = () => { if (items.length) out.push({ kind: 'list', items: items.map(boldLead) }); items = []; };
  for (const raw of norm.split('\n')) {
    const l = raw.trim();
    const item = /^(?:-|\d+[.)])\s+(.*)$/.exec(l);
    if (item) {
      // "1) a. 2) b. 3) c." on one line: each number is its own point; a closing "(note)" goes after the list.
      const parts = item[1]!.split(/\s(?=\d\)\s)/).map((x) => x.replace(/^\d\)\s+/, '').replace(/[;]\s*$/, ''));
      const last = parts.length > 1 ? /^(.*?[.!?])\s+(\([^()]+\)\.?)$/.exec(parts[parts.length - 1]!) : null;
      if (last) parts[parts.length - 1] = last[1]!;
      items.push(...parts);
      if (last) { flush(); out.push({ kind: 'p', text: last[2]! }); }
      continue;
    }
    flush();
    if (!l) continue;
    if (l.length <= 60 && l.endsWith(':')) { out.push({ kind: 'head', text: l.slice(0, -1) }); continue; }
    // "1) a. 2) b. 3) c." (or "a. 2) b. 3) c.", or "Intro: 1) a. 2) b.") → the points, a closing "(note)" after them.
    const enumParts = l.split(/\s(?=\d\)\s)/);
    if (enumParts.length >= 3) {
      const [first, ...rest] = enumParts;
      if (/^\d\)\s/.test(first!) || /^2\)/.test(rest[0]!)) rest.unshift(first!);
      else out.push({ kind: 'p', text: first! });
      let note = '';
      const last = /^(.*?[.!?])\s+(\([^()]+\)\.?)$/.exec(rest[rest.length - 1]!);
      if (last) { rest[rest.length - 1] = last[1]!; note = last[2]!; }
      out.push({ kind: 'list', items: rest.map((x) => boldLead(x.replace(/^\d\)\s+/, '').replace(/[.;]\s*$/, ''))) });
      if (note) out.push({ kind: 'p', text: note });
      continue;
    }
    if (opts.list) {
      const parts = splitTop(l.replace(/\.$/, ''), /^[;,]\s+/);
      if (parts.length >= 3) { out.push({ kind: 'list', items: parts.map((p) => boldLead(p[0]!.toUpperCase() + p.slice(1))) }); continue; }
    }
    if (l.length > (opts.points ? 90 : LONG)) {
      const ss = sentences(l);
      if (ss.length >= (opts.points ? 2 : 3)) { out.push({ kind: 'list', items: ss.map(boldLead) }); continue; }
    }
    out.push({ kind: 'p', text: l });
  }
  flush();
  return out;
}

/** One line for a feed: no markdown, no line breaks. */
export const plainLine = (text: string) => text.replace(/\*\*/g, '').replace(/^[^\n:]{1,40}:[ \t]*$/gm, '').replace(/:\s+[^\n:]{1,30}:[ \t]*$/gm, ':').replace(/^\s*[-•·]\s+/gm, '')
  .replace(/\s*\n+\s*/g, ' · ').replace(/(:\s*)·\s*/g, '$1').replace(/^[\s·]+|[\s·]+$/g, '');
