// The Braindy cuenta de cobro / recibo de pago as an A4 PDF (pdf-lib, standard fonts, vector logo: ~10 KB plus the
// signature). Blocks in order: color band + title + logo, number line, date, client DEBE A issuer, concept, total and
// distribution, the amount box with words, legal lines, signature over the line, bank box, footer.
import { rgb } from 'pdf-lib';
import { Doc, INK, LINE, MUTE, safe } from '../contracts/pdfKit.js';
import { LOGO_PATHS, LOGO_VIEWBOX } from './logo.js';
import { cop, dateLabel, monthLabel } from './money.js';
import type { Issuer, Profile } from './store.js';

const BRAND = rgb(0.18, 0.3, 0.88);
const SOFT = rgb(0.95, 0.96, 0.99);

export type PdfInput = {
  type: 'cuenta_cobro' | 'recibo'; number: string; index: number; of: number; billingMonth: string; issueDate: string;
  amount: number; amountWords: string; issuer: Issuer; client: Profile; signature?: Uint8Array | null;
  title: string; concept: string; packs: Array<{ name: string; description: string }>; servicePeriod?: { from: string; to: string };
  executionPlace?: string; projectClose?: string; totalAmount?: number; distributionNote?: string;
  receipt?: { method: string; paidOn: string; covers: Array<{ number: string; amount: number }> };
};

const period = (p?: { from: string; to: string }) =>
  !p?.from ? '' : p.to && p.to !== p.from ? `de ${monthLabel(p.from)} a ${monthLabel(p.to)}` : monthLabel(p.from);
const docLabel = (i: Issuer) => `${i.docType === 'NIT' ? 'NIT' : 'C.C.'} ${i.docNumber}${i.docCity ? ` de ${i.docCity}` : ''}`;

export async function renderBillingPdf(x: PdfInput): Promise<Uint8Array> {
  const cuenta = x.type === 'cuenta_cobro';
  const title = cuenta ? 'Cuenta de cobro' : 'Recibo de pago';
  const d = await Doc.create(`${title} ${x.number} · ${x.client.legalName}`);
  d.footer = cuenta ? `${x.title} · Cuenta de cobro ${x.index} de ${x.of} · ${monthLabel(x.billingMonth)}` : `${x.title} · Recibo de pago ${x.number}`;
  d.newPage();
  const W = d.page.getWidth(), H = d.page.getHeight();

  // 1. Band, title and logo.
  d.page.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: BRAND });
  const [, , vw, vh] = LOGO_VIEWBOX.split(' ').map(Number);
  const lw = 112, s = lw / vw;
  for (const p of LOGO_PATHS) d.page.drawSvgPath(p, { x: W - d.left - lw, y: H - 40, scale: s, color: INK });
  d.text(title.toUpperCase(), d.left, H - 40 - vh * s + 4, 18, true, INK);
  d.y = H - 40 - vh * s - 14;

  // 2–3. Number line and date.
  const line = cuenta ? `${x.number}  |  Cuenta ${x.index} de ${x.of}  |  Mes de cobro: ${monthLabel(x.billingMonth)}` : `${x.number}  |  Pago recibido el ${dateLabel(x.receipt!.paidOn)}`;
  d.paragraph(line, { size: 9.5, color: MUTE, gap: 2 });
  d.paragraph(`${x.issuer.city || 'Bogotá'}, ${dateLabel(x.issueDate)}`, { size: 9.5, color: MUTE, gap: 14 });

  // 4. Client DEBE A issuer (a receipt: the issuer received from the client).
  const center = (s2: string, size: number, bold = false, color = INK) => { d.text(s2, (W - d.measure(s2, size, bold)) / 2, d.y - size, size, bold, color); d.y -= size * 1.45; };
  center(x.client.legalName, 12, true);
  if (x.client.taxId) center(`NIT ${x.client.taxId}`, 9, false, MUTE);
  d.y -= 4;
  center(cuenta ? 'DEBE A:' : 'PAGÓ A:', 9, false, MUTE);
  center(x.issuer.name.toUpperCase(), 12, true);
  center(docLabel(x.issuer), 9, false, MUTE);
  d.y -= 10;

  // 5. Concept.
  d.paragraph('**POR CONCEPTO DE:**', { size: 10, gap: 4 });
  d.paragraph(x.concept, { size: 10, gap: 4 });
  for (const p of x.packs) d.paragraph(`•  **${p.name}:** ${p.description}`, { size: 9.5, indent: 12, gap: 2 });
  const facts = [period(x.servicePeriod) && `Período del servicio: ${period(x.servicePeriod)}.`, x.executionPlace && `Lugar de ejecución: ${x.executionPlace}.`, x.projectClose].filter(Boolean) as string[];
  if (facts.length) { d.y -= 2; d.paragraph(facts.join(' '), { size: 9.5, color: MUTE, gap: 8 }); }

  // 6. Total and distribution (cuentas), or what this payment covers (recibos).
  if (cuenta && x.totalAmount) d.paragraph(`**Valor total del proyecto:** ${cop(x.totalAmount)} COP${x.distributionNote ? `. ${x.distributionNote}.` : '.'}`, { size: 9.5, gap: 10 });
  if (!cuenta && x.receipt) {
    d.paragraph(`**Medio de pago:** ${x.receipt.method}`, { size: 9.5, gap: 2 });
    for (const c of x.receipt.covers) d.paragraph(`•  Abono a la cuenta ${c.number}: ${cop(c.amount)} COP`, { size: 9.5, indent: 12, gap: 2 });
    d.y -= 8;
  }

  // 7. The amount box.
  d.ensure(70);
  const boxH = 58;
  d.page.drawRectangle({ x: d.left, y: d.y - boxH, width: d.width, height: boxH, color: SOFT, borderColor: BRAND, borderWidth: 1 });
  d.text(cuenta ? 'VALOR DE ESTA CUENTA' : 'VALOR RECIBIDO', d.left + 14, d.y - 18, 8.5, true, BRAND);
  d.text(`${cop(x.amount)} COP`, d.left + 14, d.y - 36, 16, true, INK);
  const words = safe(x.amountWords);
  const ws = d.measure(words, 8.5) > d.width - 28 ? 7 : 8.5;
  d.text(words, d.left + 14, d.y - 50, ws, false, MUTE);
  d.y -= boxH + 14;

  // 8. Legal lines.
  for (const l of x.issuer.legalDeclarations ?? []) d.paragraph(l, { size: 8.5, color: MUTE, gap: 3 });
  d.y -= 6;

  // 9. Signature over the line.
  d.ensure(120);
  d.paragraph('Atentamente,', { size: 10, gap: 4 });
  const top = d.y;
  if (x.signature?.length) {
    const img = await d.pdf.embedPng(x.signature);
    const sc = Math.min(170 / img.width, 60 / img.height);
    d.page.drawImage(img, { x: d.left, y: top - 62, width: img.width * sc, height: img.height * sc });
  }
  d.page.drawLine({ start: { x: d.left, y: top - 64 }, end: { x: d.left + 200, y: top - 64 }, thickness: 0.8, color: INK });
  d.text(x.issuer.name.toUpperCase(), d.left, top - 78, 10, true);
  d.text(docLabel(x.issuer), d.left, top - 90, 9, false, MUTE);
  d.y = top - 108;

  // 10. Bank box (cuentas only: a receipt is already paid).
  const bk = x.issuer.bank;
  if (cuenta && bk?.accountNumber) {
    const rows = ['Para consignación:', bk.holder || x.issuer.name, `${bk.accountType ? `Cuenta de ${bk.accountType.toLowerCase()} ` : 'Cuenta '}${bk.bankName}`.trim(), `No. ${bk.accountNumber}`];
    const h = rows.length * 13 + 14;
    d.ensure(h + 10);
    d.page.drawRectangle({ x: d.left, y: d.y - h, width: d.width, height: h, borderColor: LINE, borderWidth: 0.8 });
    rows.forEach((r, i) => { const sz = i === 0 ? 8.5 : 9.5; d.text(r, (W - d.measure(r, sz, i === 3)) / 2, d.y - 16 - i * 13, sz, i === 3, i === 0 ? MUTE : INK); });
    d.y -= h + 10;
  }
  const contact = [x.issuer.web, x.issuer.phone, x.issuer.email].filter(Boolean).join('   ·   ');
  if (contact) d.text(contact, (W - d.measure(contact, 8)) / 2, 76, 8, false, MUTE);
  return d.finish();
}
