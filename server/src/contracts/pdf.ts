// The signed contract as a PDF: contract text, Anexo 1 (scope), Anexo 2 (Gantt by week), Anexo 3 (kickoff
// checklist), both signatures and Anexo 4 (electronic signature certificate, Ley 527 / Decreto 2364).
import { rgb } from 'pdf-lib';
import { BLUE, Doc, INK, LINE, MUTE } from './pdfKit.js';
import { weekDate, type ChecklistItem, type Schedule } from './schedule.js';

export interface SignatureRecord {
  role: 'client' | 'contractor';
  name: string; tipoDoc: string; doc: string; cargo: string; email: string;
  signedAt: string; verifiedAt: string; ip: string; userAgent: string; method: string; consent: string;
  png: Uint8Array;
}
export interface ContractPdfInput {
  id: string; brandName: string; title: string; templateVersion: string;
  text: string; textHash: string; scope: string; schedule: Schedule; checklist: ChecklistItem[];
  client: SignatureRecord; contractor: SignatureRecord;
}

const WEEKDAYS = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
const fmt = (iso: string) => new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'medium' }) + ' (hora de Bogotá)';
const fmtShort = (iso: string) => new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
const shortDate = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export async function renderContractPdf(c: ContractPdfInput): Promise<Uint8Array> {
  const d = await Doc.create(`${c.title} · ${c.brandName}`);
  d.footer = `${c.title} · ${c.brandName} · ${c.id} · SHA-256 del texto ${c.textHash.slice(0, 16)}…`;
  d.newPage();
  d.text('BRAINDY', d.left, d.y - 10, 9, true, BLUE);
  d.y -= 28;
  d.paragraph(`**${c.title}**`, { size: 16, gap: 2 });
  d.paragraph(c.brandName, { size: 11, color: MUTE, gap: 14 });
  d.markdown(c.text);

  d.newPage();
  d.heading('ANEXO 1. Alcance y métricas de éxito', 13);
  d.markdown(c.scope.trim() || 'Según la propuesta aceptada.');

  gantt(d, c.schedule);
  checklist(d, c.checklist, c.schedule.start);
  await signatures(d, [c.client, c.contractor]);
  certificate(d, c);
  return d.finish();
}

function gantt(d: Doc, s: Schedule) {
  d.newPage(true);
  d.heading('ANEXO 2. Cronograma (Gantt por semana)', 13);
  const m = s.meeting;
  d.paragraph(`Inicio: semana del ${shortDate(s.start)} · ${s.weeks} semanas · reunión semanal los ${WEEKDAYS[m.weekday]} a las ${m.time} (${m.minutes} min). Los rombos son entregas del contrato. El cronograma se corre con los retrasos de EL CONTRATANTE (cláusula tercera).`, { size: 9, color: MUTE });
  const labelW = 210, colW = Math.min(28, (d.width - labelW) / s.weeks), rowH = 15;
  const header = () => {
    d.ensure(rowH * 2);
    for (let w = 0; w < s.weeks; w++) {
      const x = d.left + labelW + w * colW;
      d.text(`S${w + 1}`, x + 2, d.y - 9, 6.5, true, MUTE);
      d.text(shortDate(weekDate(s.start, w)), x + 2, d.y - 17, 5.5, false, MUTE);
    }
    d.y -= 22;
  };
  header();
  for (const g of s.groups) {
    d.ensure(rowH * 2);
    d.text(g.title.toUpperCase(), d.left, d.y - 10, 8, true, BLUE);
    d.y -= rowH;
    for (const r of g.rows) {
      if (d.y - rowH < 80) { d.newPage(true); header(); }
      d.page.drawLine({ start: { x: d.left, y: d.y - rowH + 2 }, end: { x: d.left + labelW + s.weeks * colW, y: d.y - rowH + 2 }, thickness: 0.4, color: LINE });
      const label = r.title.length > 48 ? `${r.title.slice(0, 47)}…` : r.title;
      d.text(label, d.left, d.y - 10, 8, r.milestone);
      const x0 = d.left + labelW + r.from * colW, cy = d.y - 7;
      if (r.milestone) {
        const cx = x0 + colW / 2;
        d.page.drawSvgPath(`M ${cx} ${-cy + 5} L ${cx + 5} ${-cy} L ${cx} ${-cy - 5} L ${cx - 5} ${-cy} Z`, { x: 0, y: 0, color: rgb(0.96, 0.45, 0.1) });
      } else {
        d.page.drawRectangle({ x: x0 + 1, y: cy - 4, width: (r.to - r.from + 1) * colW - 2, height: 8, color: r.status === 'done' ? rgb(0.05, 0.48, 0.31) : BLUE, opacity: 0.85 });
      }
      d.y -= rowH;
    }
  }
}

function checklist(d: Doc, items: ChecklistItem[], start: string) {
  d.newPage();
  d.heading('ANEXO 3. Lista de arranque (información y accesos)', 13);
  d.paragraph('EL CONTRATANTE entrega lo siguiente por la plataforma, a más tardar en la fecha indicada. Los accesos se guardan cifrados (cláusula novena).', { size: 9, color: MUTE });
  d.table([['#', 'Qué entrega EL CONTRATANTE', 'A más tardar'], ...items.map((it, i) => [String(i + 1), it.title, shortDate(weekDate(start, it.week, 4))])], [30, d.width - 130, 100]);
}

async function signatures(d: Doc, sigs: SignatureRecord[]) {
  d.ensure(220);
  d.heading('Firmas', 12);
  const w = d.width / 2 - 10;
  const top = d.y;
  for (const [i, s] of sigs.entries()) {
    const x = d.left + i * (w + 20);
    const img = await d.pdf.embedPng(s.png);
    const scale = Math.min(w / img.width, 70 / img.height);
    d.page.drawImage(img, { x, y: top - 80, width: img.width * scale, height: img.height * scale });
    d.page.drawLine({ start: { x, y: top - 86 }, end: { x: x + w, y: top - 86 }, thickness: 0.8, color: INK });
    const lines = [s.role === 'client' ? 'EL CONTRATANTE' : 'EL CONTRATISTA', s.name, `${s.tipoDoc} ${s.doc}`, s.cargo, fmtShort(s.signedAt)];
    lines.forEach((l, k) => d.text(l, x, top - 100 - k * 12, k === 0 ? 8 : 9, k <= 1, k === 0 ? MUTE : INK));
  }
  d.y = top - 170;
}

function certificate(d: Doc, c: ContractPdfInput) {
  d.newPage();
  d.heading('ANEXO 4. Certificado de firma electrónica', 13);
  d.paragraph(`Documento: ${c.title} · ${c.brandName}. Identificador: ${c.id}. Plantilla ${c.templateVersion}. Firmado en la plataforma Braindy (app.braindy.co) conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.`, { size: 9 });
  d.paragraph(`**Huella del texto firmado (SHA-256):** ${c.textHash}`, { size: 8.5 });
  d.paragraph('Cualquier cambio en el texto produce una huella distinta. Ambas partes firmaron exactamente el texto con esta huella.', { size: 8.5, color: MUTE, gap: 10 });
  for (const s of [c.client, c.contractor]) {
    d.table([
      ['Campo', s.role === 'client' ? 'EL CONTRATANTE' : 'EL CONTRATISTA'],
      ['Firmante', `${s.name} · ${s.tipoDoc} ${s.doc}`],
      ['Calidad', s.cargo],
      ['Correo verificado', s.email],
      ['Verificación de identidad', `${s.method} · ${fmt(s.verifiedAt)}`],
      ['Fecha y hora de firma', fmt(s.signedAt)],
      ['Dirección IP', s.ip || 'no disponible'],
      ['Navegador', s.userAgent || 'no disponible'],
      ['Consentimiento', s.consent],
    ], [150, d.width - 150], 8.5);
  }
}
