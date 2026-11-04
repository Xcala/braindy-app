import type { BrandRequest } from './types';

export type Row = { title: string; requested: string; type: string; due: string; status: string; tags: string; versions: number };

const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** CSV with a BOM and semicolons, which is what Excel in Spanish opens straight into columns. */
export function downloadCsv(name: string, head: string[], rows: Row[]) {
  const body = [head, ...rows.map((r) => [r.title, r.requested, r.type, r.due, r.status, r.tags, r.versions])].map((l) => l.map(cell).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' }));
  a.download = `${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A clean printable page in a new tab; the browser's "Save as PDF" turns it into the PDF. */
export function printPdf(title: string, sub: string, head: string[], rows: Row[]) {
  const w = window.open('', '_blank');
  if (!w) return false;
  const tr = rows.map((r) => `<tr>${[r.title, r.requested, r.type, r.due, r.status, r.tags].map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;700;900&display=swap" rel="stylesheet">
<style>body{font:13px/1.45 'Red Hat Display',system-ui,sans-serif;color:#0B1220;margin:32px}h1{font-weight:900;font-size:26px;margin:0 0 4px}p{color:#5B6475;margin:0 0 20px}
table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5B6475;border-bottom:2px solid #0B1220;padding:8px 6px}
td{border-bottom:1px solid #E3E7EF;padding:8px 6px;vertical-align:top}td:first-child{font-weight:700}@page{margin:14mm}</style></head>
<body><h1>${esc(title)}</h1><p>${esc(sub)}</p><table><thead><tr>${head.slice(0, 6).map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${tr}</tbody></table>
<script>document.fonts.ready.then(()=>setTimeout(()=>print(),200))</script></body></html>`);
  w.document.close();
  return true;
}

export const rowOf = (r: BrandRequest, x: { requested: string; type: string; due: string; status: string }): Row =>
  ({ title: r.title, ...x, tags: (r.tags ?? []).join(', '), versions: r.versionCount ?? 0 });
