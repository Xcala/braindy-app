// Connector tools for cuentas de cobro y recibos (and deleting files). Same functions the admin screen uses.
// Never returns the bank account number or the full document number: both are masked (****3465).
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { trashAsset } from '../fileOps.js';
import { forgetSearch } from '../search.js';
import { extractSample } from '../invoicing/importSample.js';
import { activate, issueDoc, sendDoc } from '../invoicing/issue.js';
import { recordPayment, voidDoc } from '../invoicing/payments.js';
import { mask, money, planOf } from '../invoicing/money.js';
import { DEFAULT_ISSUER, ISSUERS, agreementProblems, issuerStyle, agreementsCol, docsCol, now, pickAgreement, pickProfile, profileRef, saveFile, type BillingDoc } from '../invoicing/store.js';
import { requireBrand } from './store.js';

const reply = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const fail = (e: unknown) => ({ content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true });
const run = <A>(fn: (a: A) => Promise<string>) => async (a: A) => { try { return reply(await fn(a)); } catch (e) { return fail(e); } };
const line = (d: BillingDoc & { id: string }) =>
  `${d.number} · ${d.type === 'recibo' ? 'recibo' : `cuenta ${d.index}/${d.of}`} · ${d.billingMonth} · ${money(d.amount, d.currency)} · ${d.status}${d.held ? ' (para tu ojo)' : ''}${d.paid && d.status !== 'paid' ? ` · pagado ${money(d.paid, d.currency)}` : ''}${d.status === 'scheduled' ? ` · sale ${d.scheduledDate}` : ''} [${d.id}]`;

export function registerBillingTools(server: McpServer, ctx: { mode: 'local' | 'remote'; uid: string }, app: string) {
  const by = ctx.uid;

  server.registerTool('braindy_billing_import_sample', {
    title: 'Leer una cuenta de cobro de ejemplo (PDF)',
    description: 'Reads a sample cuenta de cobro PDF (one or many pages) and returns the agreement it describes: client, NIT, concept, packs, period, total, number of cuentas, '
      + 'amount per page, numbering, dates, plus warnings checked in code (sum, NIT check digit, amount in words, signature). Saves nothing but the sample. '
      + 'Bank account and document numbers come back masked. Then create the agreement with braindy_billing_agreement.',
    inputSchema: { brandId: z.string(), path: z.string().optional().describe('Local mode: path of the PDF on disk'), base64: z.string().optional().describe('Or the PDF in base64') },
  }, run(async ({ brandId, path, base64 }) => {
    await requireBrand(brandId);
    const pdf = path && ctx.mode === 'local' ? await readFile(path) : base64 ? Buffer.from(base64, 'base64') : null;
    if (!pdf) throw new Error('Falta el PDF (path en modo local, o base64).');
    const sample = await saveFile(`billing-samples/${brandId}/${Date.now()}.pdf`, pdf, 'application/pdf');
    const x = await extractSample(pdf, brandId);
    const safe = { ...x, issuer: { ...x.issuer, docNumber: mask(x.issuer.docNumber), bank: { ...x.issuer.bank, accountNumber: mask(x.issuer.bank.accountNumber) } } };
    return `${JSON.stringify(safe, null, 2)}\n\nsourceSamplePath: ${sample}`;
  }));

  server.registerTool('braindy_billing_agreement', {
    title: 'Crear un proyecto cobrado en cuentas de cobro',
    description: 'Creates a billing agreement for a brand: a project total split in n monthly cuentas (rounding remainder goes to the last one), numbered PREFIX-01…, issued on issueDay of each month. '
      + 'Optionally saves the client billing profile (legal name, NIT, accounting email/WhatsApp). dryRun=true only shows the plan. activate=true issues the cuentas of past and current months today '
      + '(their PDF freezes: an issued cuenta never changes, it can only be voided) and schedules the rest. Without autoSend each issued cuenta waits for Nicolas to send it.',
    inputSchema: {
      brandId: z.string(),
      issuerId: z.enum(['nicolas', 'nicolas-us']).optional().describe('Who charges: nicolas = Colombia (COP, Spanish cuenta de cobro, default); nicolas-us = USA (USD, English invoice). Amounts for USD are in CENTS.'),
      profile: z.object({ legalName: z.string(), taxId: z.string(), address: z.string().optional(), city: z.string().optional(), accountingEmail: z.string().optional(), accountingWhatsApp: z.string().optional() }).optional(),
      title: z.string(), concept: z.string(), packs: z.array(z.object({ name: z.string(), description: z.string() })).max(8).optional(),
      servicePeriodFrom: z.string().describe('YYYY-MM'), servicePeriodTo: z.string().describe('YYYY-MM'), executionPlace: z.string().optional(), projectClose: z.string().optional(),
      totalAmount: z.number().int().positive().describe('COP in pesos; USD in cents'), installments: z.number().int().min(1).max(60), startMonth: z.string().describe('YYYY-MM of the first cuenta'),
      issueDay: z.number().int().min(1).max(28).optional(), numberingPrefix: z.string().describe('e.g. BM-06'), distributionNote: z.string().optional(),
      autoSend: z.boolean().optional(), sourceSamplePath: z.string().optional(), dryRun: z.boolean().optional(), activate: z.boolean().optional(),
    },
  }, run(async (i) => {
    const name = await requireBrand(i.brandId);
    const a = pickAgreement({ ...i, servicePeriod: { from: i.servicePeriodFrom, to: i.servicePeriodTo }, executionPlace: i.executionPlace ?? 'Bogotá', issueDay: i.issueDay ?? 5 });
    const problems = agreementProblems(a);
    if (problems.length) throw new Error(`Faltan: ${problems.join(', ')}`);
    const issuerId = i.issuerId ?? DEFAULT_ISSUER;
    const cur = issuerStyle({ country: ISSUERS[issuerId] }).currency;
    const rows = planOf(a);
    const plan = rows.map((r) => `${r.number} · ${r.billingMonth} · ${money(r.amount, cur)} · ${r.issueNow ? 'se emite hoy' : `sale ${r.scheduledDate}`}`).join('\n');
    const sum = rows.reduce((n, r) => n + r.amount, 0);
    if (i.dryRun) return `${name} · ${a.title} (vista previa, nada guardado)\n${plan}\nSuman ${money(sum, cur)} de ${money(a.totalAmount, cur)}`;
    if (i.profile) await profileRef(i.brandId).set({ ...pickProfile(i.profile), updatedAt: now() }, { merge: true });
    const ref = agreementsCol(i.brandId).doc();
    await ref.set({ ...a, issuerId, currency: cur, roundingRule: 'remainder_last', templateId: 'braindy', status: 'draft', createdAt: now(), createdBy: by });
    if (!i.activate) return `${name} · ${a.title}: borrador guardado [${ref.id}]\n${plan}\nActívalo con activate=true o en ${app}/plan?tab=payments`;
    const r = await activate(i.brandId, ref.id, by);
    return `${name} · ${a.title} activo [${ref.id}]: ${r.issued.length} emitidas (${r.issued.join(', ') || '—'}), ${r.scheduled.length} programadas.\n${plan}\nRevisa y envía en ${app}/plan?tab=payments`;
  }));

  server.registerTool('braindy_billing_list', {
    title: 'Ver las cuentas de cobro y recibos de una marca',
    description: 'Lists every cuenta de cobro and recibo of a brand with number, month, value, status (scheduled, issued, sent, paid, overdue, void) and what was paid. Ids in brackets.',
    inputSchema: { brandId: z.string() },
  }, run(async ({ brandId }) => {
    const name = await requireBrand(brandId);
    const q = await docsCol(brandId).get();
    const docs = q.docs.map((s) => ({ id: s.id, ...(s.data() as BillingDoc) })).sort((x, y) => x.scheduledDate.localeCompare(y.scheduledDate) || x.number.localeCompare(y.number));
    return docs.length ? `${name}:\n${docs.map(line).join('\n')}` : `${name}: aún no hay cuentas de cobro.`;
  }));

  server.registerTool('braindy_billing_issue', {
    title: 'Emitir y/o enviar una cuenta de cobro',
    description: 'Issues a scheduled cuenta now (claims its number, freezes the PDF with Nicolas\'s signature) and/or sends an issued one (email with the PDF to accounting + WhatsApp link). '
      + 'Sending writes to the client: only when Nicolas asked for it.',
    inputSchema: { brandId: z.string(), docId: z.string(), issue: z.boolean().optional(), send: z.boolean().optional() },
  }, run(async ({ brandId, docId, issue, send }) => {
    const out: string[] = [];
    if (issue) { const r = await issueDoc(brandId, docId, by); out.push(`Emitida ${r.number}.`); }
    if (send) { const r = await sendDoc(brandId, docId, by); out.push(r.via.length ? `Enviada por ${r.via.join(' + ')}.` : 'No salió por correo ni WhatsApp.'); if (r.waMe) out.push(`WhatsApp (ventana cerrada), ábrelo tú: ${r.waMe}`); }
    return out.join('\n') || 'Nada que hacer: pasa issue y/o send.';
  }));

  server.registerTool('braindy_billing_payment', {
    title: 'Registrar un pago de cuentas de cobro',
    description: 'Records a confirmed payment and spreads it over the open cuentas in order (an advance can cover several cuentas and part of the next). receipt=true issues a recibo (RC-0001…).',
    inputSchema: { brandId: z.string(), agreementId: z.string().optional(), docIds: z.array(z.string()).optional(), amount: z.number().int().positive().describe('COP in pesos; USD in cents'), date: z.string().describe('YYYY-MM-DD'), method: z.string().optional(), receipt: z.boolean().optional() },
  }, run(async ({ brandId, agreementId, docIds, amount, date, method, receipt }) => {
    const r = await recordPayment(brandId, by, { agreementId, docIds, amount, date, method: method ?? 'Transferencia', receipt: receipt ?? true });
    return `Pago de ${amount} aplicado: ${r.covers.map((c) => `${c.id} ${c.applied}${c.settles ? ' (pagada)' : ''}`).join(', ')}${r.receipt ? `\nRecibo ${r.receipt.number}` : ''}`;
  }));

  server.registerTool('braindy_billing_void', {
    title: 'Anular una cuenta de cobro',
    description: 'Voids a cuenta (issued or scheduled) with a reason. It stays visible as Anulada and its number is never reused. Not possible when it has payments.',
    inputSchema: { brandId: z.string(), docId: z.string(), reason: z.string() },
  }, run(async ({ brandId, docId, reason }) => { await voidDoc(brandId, docId, by, reason); return `Anulada ${docId}: ${reason}`; }));

  server.registerTool('braindy_files_delete', {
    title: 'Borrar archivos de una marca (a la papelera)',
    description: 'Moves files of a brand\'s Files to the trash (restorable for 30 days in Braindy App) and keeps the Drive import from bringing them back. Takes asset ids.',
    inputSchema: { brandId: z.string(), assetIds: z.array(z.string()).min(1).max(100) },
  }, run(async ({ brandId, assetIds }) => {
    const name = await requireBrand(brandId);
    let ok = 0; const missing: string[] = [];
    for (const id of assetIds) (await trashAsset(brandId, id, by)) ? ok++ : missing.push(id);
    forgetSearch(brandId);
    return `${name}: ${ok} a la papelera${missing.length ? `; no encontrados: ${missing.join(', ')}` : ''}. Se pueden restaurar 30 días.`;
  }));
}
