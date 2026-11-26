// The Braindy cuenta de cobro / recibo de pago as an A4 PDF (pdf-lib, standard fonts, vector logo: ~10 KB plus the
// signature). Blocks in order: color band + title + logo, number line, date, client DEBE A issuer, concept, total and
// distribution, the amount box with words, legal lines, signature over the line, bank box, footer.
// A US issuer gets the same layout in English and dollars (Invoice / Payment receipt).
import { rgb } from 'pdf-lib';
import { Doc, INK, LINE, MUTE, safe } from '../contracts/pdfKit.js';
import { LOGO_PATHS, LOGO_VIEWBOX } from './logo.js';
import { dateLabelL, money, monthLabelL, type Lang } from './money.js';
import { issuerStyle, type Issuer, type Profile } from './store.js';

const BRAND = rgb(0.18, 0.3, 0.88);
const SOFT = rgb(0.95, 0.96, 0.99);

export type PdfInput = {
  type: 'cuenta_cobro' | 'recibo'; number: string; index: number; of: number; billingMonth: string; issueDate: string;
  amount: number; amountWords: string; issuer: Issuer; client: Profile; signature?: Uint8Array | null;
  title: string; concept: string; packs: Array<{ name: string; description: string }>; servicePeriod?: { from: string; to: string };
  executionPlace?: string; projectClose?: string; totalAmount?: number; distributionNote?: string;
  receipt?: { method: string; paidOn: string; covers: Array<{ number: string; amount: number }> };
};

const T = {
  es: {
    cuenta: 'Cuenta de cobro', recibo: 'Recibo de pago', of: (i: number, n: number) => `Cuenta ${i} de ${n}`, month: 'Mes de cobro', paidOn: 'Pago recibido el',
    owes: 'DEBE A:', paidTo: 'PAGÓ A:', billTo: '', concept: 'POR CONCEPTO DE:', period: 'Período del servicio', place: 'Lugar de ejecución',
    total: 'Valor total del proyecto', method: 'Medio de pago', towards: 'Abono a la cuenta', boxCuenta: 'VALOR DE ESTA CUENTA', boxRecibo: 'VALOR RECIBIDO',
    regards: 'Atentamente,', payTo: 'Para consignación:', footCuenta: (i: number, n: number) => `Cuenta de cobro ${i} de ${n}`,
    range: (a: string, b: string) => `de ${a} a ${b}`, taxId: 'NIT',
  },
  en: {
    cuenta: 'Invoice', recibo: 'Payment receipt', of: (i: number, n: number) => `Installment ${i} of ${n}`, month: 'Billing month', paidOn: 'Payment received on',
    owes: 'FROM:', paidTo: 'RECEIVED BY:', billTo: 'BILL TO:', concept: 'DESCRIPTION OF SERVICES:', period: 'Service period', place: 'Place of performance',
    total: 'Total project value', method: 'Payment method', towards: 'Applied to invoice', boxCuenta: 'AMOUNT DUE', boxRecibo: 'AMOUNT RECEIVED',
    regards: 'Sincerely,', payTo: 'Payment details:', footCuenta: (i: number, n: number) => `Invoice ${i} of ${n}`,
    range: (a: string, b: string) => `${a} to ${b}`, taxId: 'Tax ID',
  },
} as const;

const docLabel = (i: Issuer) =>
  i.docType === 'EIN' || i.docType === 'ITIN' || i.docType === 'SSN' ? `${i.docType} ${i.docNumber}` : `${i.docType === 'NIT' ? 'NIT' : 'C.C.'} ${i.docNumber}${i.docCity ? ` de ${i.docCity}` : ''}`;

function bankRows(i: Issuer, lang: Lang): string[] {
  const bk = i.bank;
  if (lang === 'es') return [bk.holder || i.name, `${bk.accountType ? `Cuenta de ${bk.accountType.toLowerCase()} ` : 'Cuenta '}${bk.bankName}`.trim(), `No. ${bk.accountNumber}`];
  return [
    `Account holder: ${bk.holder || i.name}`, `Bank: ${bk.bankName}${bk.accountType ? ` · ${bk.accountType}` : ''}`, `Account No. ${bk.accountNumber}`,
    bk.routingNumber ? `Routing (ABA/ACH): ${bk.routingNumber}` : '', bk.swift ? `SWIFT: ${bk.swift}` : '', bk.bankAddress ? `Bank address: ${bk.bankAddress}` : '',
  ].filter(Boolean);
}

export async function renderBillingPdf(x: PdfInput): Promise<Uint8Array> {
  const { lang, currency } = issuerStyle(x.issuer);
  const t = T[lang];
  const amt = (n: number) => money(n, currency);
  const cuenta = x.type === 'cuenta_cobro';
  const title = cuenta ? t.cuenta : t.recibo;
  const d = await Doc.create(`${title} ${x.number} · ${x.client.legalName}`);
  if (lang === 'en') d.pageLabel = (i, n) => `Page ${i} of ${n}`;
  d.footer = cuenta ?`${x.title} · ${t.footCuenta(x.index, x.of)} · ${monthLabelL(x.billingMonth, lang)}` : `${x.title} · ${t.recibo} ${x.number}`;
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
  const line = cuenta ? `${x.number}  |  ${t.of(x.index, x.of)}  |  ${t.month}: ${monthLabelL(x.billingMonth, lang)}` : `${x.number}  |  ${t.paidOn} ${dateLabelL(x.receipt!.paidOn, lang)}`;
  d.paragraph(line, { size: 9.5, color: MUTE, gap: 2 });
  d.paragraph(`${x.issuer.city || (lang === 'es' ? 'Bogotá' : '')}${x.issuer.city || lang === 'es' ? ', ' : ''}${dateLabelL(x.issueDate, lang)}`, { size: 9.5, color: MUTE, gap: 14 });

  // 4. Client DEBE A issuer (a receipt: the issuer received from the client). English: BILL TO client, FROM issuer.
  const center = (s2: string, size: number, bold = false, color = INK) => { d.text(s2, (W - d.measure(s2, size, bold)) / 2, d.y - size, size, bold, color); d.y -= size * 1.45; };
  if (t.billTo) center(cuenta ? t.billTo : 'RECEIVED FROM:', 9, false, MUTE);
  center(x.client.legalName, 12, true);
  if (x.client.taxId) center(`${t.taxId} ${x.client.taxId}`, 9, false, MUTE);
  d.y -= 4;
  center(cuenta ? t.owes : t.paidTo, 9, false, MUTE);
  center(x.issuer.name.toUpperCase(), 12, true);
  center(docLabel(x.issuer), 9, false, MUTE);
  if (lang === 'en' && x.issuer.address) center(x.issuer.address, 8.5, false, MUTE);
  d.y -= 10;

  // 5. Concept.
  d.paragraph(`**${t.concept}**`, { size: 10, gap: 4 });
  d.paragraph(x.concept, { size: 10, gap: 4 });
  for (const p of x.packs) d.paragraph(`•  **${p.name}:** ${p.description}`, { size: 9.5, indent: 12, gap: 2 });
  const p0 = x.servicePeriod;
  const per = !p0?.from ? '' : p0.to && p0.to !== p0.from ? t.range(monthLabelL(p0.from, lang), monthLabelL(p0.to, lang)) : monthLabelL(p0.from, lang);
  const facts = [per && `${t.period}: ${per}.`, x.executionPlace && `${t.place}: ${x.executionPlace}.`, x.projectClose].filter(Boolean) as string[];
  if (facts.length) { d.y -= 2; d.paragraph(facts.join(' '), { size: 9.5, color: MUTE, gap: 8 }); }

  // 6. Total and distribution (cuentas), or what this payment covers (recibos).
  if (cuenta && x.totalAmount) d.paragraph(`**${t.total}:** ${amt(x.totalAmount)}${x.distributionNote ? `. ${x.distributionNote}.` : '.'}`, { size: 9.5, gap: 10 });
  if (!cuenta && x.receipt) {
    d.paragraph(`**${t.method}:** ${x.receipt.method}`, { size: 9.5, gap: 2 });
    for (const c of x.receipt.covers) d.paragraph(`•  ${t.towards} ${c.number}: ${amt(c.amount)}`, { size: 9.5, indent: 12, gap: 2 });
    d.y -= 8;
  }

  // 7. The amount box.
  d.ensure(70);
  const boxH = 58;
  d.page.drawRectangle({ x: d.left, y: d.y - boxH, width: d.width, height: boxH, color: SOFT, borderColor: BRAND, borderWidth: 1 });
  d.text(cuenta ? t.boxCuenta : t.boxRecibo, d.left + 14, d.y - 18, 8.5, true, BRAND);
  d.text(amt(x.amount), d.left + 14, d.y - 36, 16, true, INK);
  const words = safe(x.amountWords);
  const ws = d.measure(words, 8.5) > d.width - 28 ? 7 : 8.5;
  d.text(words, d.left + 14, d.y - 50, ws, false, MUTE);
  d.y -= boxH + 14;

  // 8. Legal lines.
  for (const l of x.issuer.legalDeclarations ?? []) d.paragraph(l, { size: 8.5, color: MUTE, gap: 3 });
  d.y -= 6;

  // 9. Signature over the line.
  d.ensure(120);
  d.paragraph(t.regards, { size: 10, gap: 4 });
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
  if (cuenta && x.issuer.bank?.accountNumber) {
    const rows = [t.payTo, ...bankRows(x.issuer, lang)];
    const h = rows.length * 13 + 14;
    d.ensure(h + 10);
    d.page.drawRectangle({ x: d.left, y: d.y - h, width: d.width, height: h, borderColor: LINE, borderWidth: 0.8 });
    rows.forEach((r, i) => { const bold = r.includes('No. '); const sz = i === 0 ? 8.5 : 9.5; d.text(r, (W - d.measure(r, sz, bold)) / 2, d.y - 16 - i * 13, sz, bold, i === 0 ? MUTE : INK); });
    d.y -= h + 10;
  }
  const contact = [x.issuer.web, x.issuer.phone, x.issuer.email].filter(Boolean).join('   ·   ');
  if (contact) d.text(contact, (W - d.measure(contact, 8)) / 2, 76, 8, false, MUTE);
  return d.finish();
}
