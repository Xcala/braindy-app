// Small layout engine on pdf-lib for the signed contract: pages, wrapped text with **bold** runs,
// markdown-ish blocks (headings, paragraphs, lists, tables) and a footer on every page.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export const INK = rgb(0.06, 0.08, 0.13);
export const MUTE = rgb(0.38, 0.42, 0.5);
export const LINE = rgb(0.85, 0.87, 0.91);
export const BLUE = rgb(0.18, 0.3, 0.88);
const A4: [number, number] = [595.28, 841.89];
const M = 56;

// Standard fonts only encode WinAnsi: map common symbols and drop the rest (emoji, arrows).
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
export function safe(s: string): string {
  return s.replace(/→/g, '->').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[  ]/g, ' ')
    .replace(/[^\u0009\u000a -~¡-ÿ]/g, (ch) => (WINANSI_EXTRA.includes(ch) ? ch : ''));
}

type Run = { text: string; bold: boolean };
const runsOf = (s: string): Run[] => safe(s).split(/(\*\*[^*]+\*\*)/).filter(Boolean)
  .map((p) => (p.startsWith('**') ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }));

export class Doc {
  pdf!: PDFDocument;
  regular!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;
  footer = '';

  static async create(title: string) {
    const d = new Doc();
    d.pdf = await PDFDocument.create();
    d.pdf.setTitle(safe(title));
    d.pdf.setAuthor('Braindy');
    d.pdf.setProducer('Braindy (app.braindy.co)');
    d.regular = await d.pdf.embedFont(StandardFonts.Helvetica);
    d.bold = await d.pdf.embedFont(StandardFonts.HelveticaBold);
    return d;
  }

  get width() { return this.page.getWidth() - 2 * M; }
  get left() { return M; }

  newPage(landscape = false) {
    this.page = this.pdf.addPage(landscape ? [A4[1], A4[0]] : A4);
    this.y = this.page.getHeight() - M;
  }

  ensure(h: number) { if (this.y - h < M + 24) this.newPage(this.page.getWidth() > this.page.getHeight()); }

  text(s: string, x: number, y: number, size = 10, bold = false, color = INK) {
    this.page.drawText(safe(s), { x, y, size, font: bold ? this.bold : this.regular, color });
  }

  measure(s: string, size: number, bold = false) { return (bold ? this.bold : this.regular).widthOfTextAtSize(safe(s), size); }

  /** Wraps runs into lines of words, keeping bold per word. */
  private lines(runs: Run[], size: number, width: number) {
    const words = runs.flatMap((r) => r.text.split(/(\s+)/).filter((w) => w && !/^\s+$/.test(w)).map((w) => ({ w, bold: r.bold })));
    const out: Array<typeof words> = [];
    let line: typeof words = [], used = 0;
    const space = this.regular.widthOfTextAtSize(' ', size);
    for (const word of words) {
      const w = (word.bold ? this.bold : this.regular).widthOfTextAtSize(word.w, size);
      if (line.length && used + space + w > width) { out.push(line); line = []; used = 0; }
      used += (line.length ? space : 0) + w;
      line.push(word);
    }
    if (line.length) out.push(line);
    return out;
  }

  paragraph(s: string, { size = 10, indent = 0, gap = 6, color = INK, lead = 1.45 } = {}) {
    const lh = size * lead;
    for (const line of this.lines(runsOf(s), size, this.width - indent)) {
      this.ensure(lh);
      // One drawText per bold/regular stretch, so viewers that swap Helvetica keep the spaces.
      const parts: Array<{ text: string; bold: boolean }> = [];
      for (const { w, bold } of line) {
        const last = parts[parts.length - 1];
        if (last && last.bold === bold) last.text += ` ${w}`;
        else parts.push({ text: last && !/^[,.;:)]/.test(w) ? ` ${w}` : w, bold });
      }
      let x = this.left + indent;
      for (const p of parts) {
        this.text(p.text, x, this.y - size, size, p.bold, color);
        x += this.measure(p.text, size, p.bold);
      }
      this.y -= lh;
    }
    this.y -= gap;
  }

  heading(s: string, size = 12) {
    this.ensure(size * 3);
    this.y -= size * 0.6;
    this.paragraph(`**${s}**`, { size, gap: 4 });
  }

  table(rows: string[][], widths: number[], size = 9) {
    const pad = 5;
    for (const [i, row] of rows.entries()) {
      const cells = row.map((c, j) => this.lines(runsOf(i === 0 ? `**${c}**` : c), size, widths[j] - 2 * pad));
      const h = Math.max(...cells.map((l) => l.length)) * size * 1.35 + 2 * pad;
      this.ensure(h);
      let x = this.left;
      for (const [j, lines] of cells.entries()) {
        this.page.drawRectangle({ x, y: this.y - h, width: widths[j], height: h, borderColor: LINE, borderWidth: 0.6, color: i === 0 ? rgb(0.95, 0.96, 0.98) : undefined });
        lines.forEach((line, k) => this.text(line.map((t) => t.w).join(' '), x + pad, this.y - pad - size - k * size * 1.35, size, i === 0 || line.some((t) => t.bold)));
        x += widths[j];
      }
      this.y -= h;
    }
    this.y -= 8;
  }

  /** The contract text: ## headings, paragraphs, numbered items, | tables |, --- rules. */
  markdown(md: string) {
    const blocks = md.replace(/\r/g, '').split(/\n{2,}/);
    for (const block of blocks) {
      const lines = block.split('\n').filter((l) => l.trim());
      if (!lines.length || lines[0].trim() === '---') continue;
      if (lines[0].startsWith('## ')) { this.heading(lines[0].slice(3)); if (lines.length > 1) this.markdown(lines.slice(1).join('\n')); continue; }
      if (lines[0].startsWith('### ')) { this.heading(lines[0].slice(4), 11); continue; }
      if (lines[0].startsWith('|')) {
        const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
        const total = this.width, n = rows[0].length;
        this.table(rows, n === 3 ? [total * 0.22, total * 0.5, total * 0.28] : rows[0].map(() => total / n));
        continue;
      }
      for (const l of lines) this.paragraph(l.trim(), /^\d+\.\s/.test(l.trim()) ? { indent: 10, gap: 3 } : {});
    }
  }

  /** Footer with page numbers on every page (call last). */
  finish() {
    const pages = this.pdf.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: M, y: M - 6 }, end: { x: p.getWidth() - M, y: M - 6 }, thickness: 0.5, color: LINE });
      p.drawText(safe(this.footer), { x: M, y: M - 20, size: 7.5, font: this.regular, color: MUTE });
      const label = `Página ${i + 1} de ${pages.length}`;
      p.drawText(label, { x: p.getWidth() - M - this.regular.widthOfTextAtSize(label, 7.5), y: M - 20, size: 7.5, font: this.regular, color: MUTE });
    });
    return this.pdf.save();
  }
}
