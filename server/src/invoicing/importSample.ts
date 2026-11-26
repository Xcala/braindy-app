// Import from a sample PDF: Claude reads the PDF itself (text and layout of every page, scanned pages included)
// and fills a strict schema through a tool call; the checks that matter are done here in code, never trusted to
// the model: amounts add up, NIT check digit, amount in words, pages consistent.
import { aiConfigured, claudeTurn, type Tool } from '../ai.js';
import { nitValid, pesosInWords } from './money.js';

export type Extracted = {
  issuer: { name: string; docType: string; docNumber: string; docCity: string; bank: { bankName: string; accountType: string; accountNumber: string; holder: string } };
  client: { legalName: string; taxId: string };
  concept: string; packs: Array<{ name: string; description: string }>;
  servicePeriod: string; servicePeriodFrom: string; servicePeriodTo: string; executionPlace: string; projectClose: string;
  totalAmount: number; installments: number; amountsPerPage: number[]; amountWordsPerPage: string[];
  numberingPattern: string; numbers: string[]; issueDates: string[]; paymentModality: string;
  hasSignature: boolean; logoDetected: boolean; warnings: string[];
};

const s = { type: 'string' } as const, n = { type: 'integer' } as const;
const TOOL: Tool = {
  name: 'cuenta_de_cobro',
  description: 'Datos extraídos de un PDF de cuentas de cobro colombianas (una o varias páginas, una cuenta por página).',
  input_schema: {
    type: 'object', additionalProperties: false,
    required: ['issuer', 'client', 'concept', 'packs', 'servicePeriod', 'servicePeriodFrom', 'servicePeriodTo', 'executionPlace', 'projectClose', 'totalAmount', 'installments', 'amountsPerPage', 'amountWordsPerPage', 'numberingPattern', 'numbers', 'issueDates', 'paymentModality', 'hasSignature', 'logoDetected', 'warnings'],
    properties: {
      issuer: { type: 'object', required: ['name', 'docType', 'docNumber', 'docCity', 'bank'], properties: { name: s, docType: { type: 'string', enum: ['CC', 'NIT', ''] }, docNumber: s, docCity: s,
        bank: { type: 'object', required: ['bankName', 'accountType', 'accountNumber', 'holder'], properties: { bankName: s, accountType: s, accountNumber: s, holder: s } } } },
      client: { type: 'object', required: ['legalName', 'taxId'], properties: { legalName: s, taxId: { type: 'string', description: 'NIT con dígito de verificación, ej. 902038455-4' } } },
      concept: { type: 'string', description: 'Texto de «por concepto de», sin la lista de packs' },
      packs: { type: 'array', items: { type: 'object', required: ['name', 'description'], properties: { name: s, description: s } } },
      servicePeriod: { type: 'string', description: 'Tal como aparece, ej. «septiembre a noviembre de 2026»' },
      servicePeriodFrom: { type: 'string', description: 'YYYY-MM o vacío' }, servicePeriodTo: { type: 'string', description: 'YYYY-MM o vacío' },
      executionPlace: s, projectClose: s,
      totalAmount: { type: 'integer', description: 'Valor total del proyecto en pesos, sin puntos' },
      installments: { type: 'integer', description: 'Cuántas cuentas de cobro dice el documento que son' },
      amountsPerPage: { type: 'array', items: n, description: 'Valor de cada cuenta, en el orden de las páginas' },
      amountWordsPerPage: { type: 'array', items: s, description: 'El valor en letras de cada página, literal' },
      numberingPattern: { type: 'string', description: 'Patrón del consecutivo, ej. BM-07-0X' }, numbers: { type: 'array', items: s },
      issueDates: { type: 'array', items: { type: 'string', description: 'YYYY-MM-DD' } },
      paymentModality: s,
      hasSignature: { type: 'boolean', description: 'true solo si hay una firma manuscrita (imagen) sobre la línea de firma' },
      logoDetected: { type: 'boolean' }, warnings: { type: 'array', items: s },
    },
  },
};

const SYSTEM = 'Extraes datos de cuentas de cobro colombianas. Copia los valores tal como aparecen, sin inventar nada: un dato que no está va vacío (o 0). Responde solo llamando a la herramienta cuenta_de_cobro.';

/** Reads the PDF with Claude and returns the extracted fields plus the warnings found by the checks below. */
export async function extractSample(pdf: Buffer, brandId: string): Promise<Extracted> {
  if (!aiConfigured()) throw new Error('ai_not_configured');
  const { content } = await claudeTurn(SYSTEM, [{ role: 'user', content: [
    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') } },
    { type: 'text', text: 'Extrae los datos de este PDF de cuentas de cobro.' },
  ] }], [TOOL], { maxTokens: 4000, meta: { brandId, kind: 'billing_import' } as never });
  const call = content.find((b) => b.type === 'tool_use' && b.name === TOOL.name);
  if (!call) throw new Error('ai_no_answer');
  return validate(call.input as Extracted);
}

/** The checks, in code: every difference becomes a warning (the model's own warnings are kept too). */
export function validate(x: Extracted): Extracted {
  const w = [...(x.warnings ?? [])];
  const amounts = x.amountsPerPage ?? [];
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (amounts.length && sum !== x.totalAmount) w.push(`La suma de las cuentas (${sum}) no da el total (${x.totalAmount}).`);
  if (x.installments && amounts.length && amounts.length !== x.installments) w.push(`Dice ${x.installments} cuentas pero hay ${amounts.length} páginas con valor.`);
  const nit = nitValid(x.client?.taxId ?? '');
  if (nit === false) w.push(`El dígito de verificación del NIT ${x.client.taxId} no es válido.`);
  if (nit === null && x.client?.taxId) w.push(`El NIT ${x.client.taxId} no trae dígito de verificación.`);
  (x.amountWordsPerPage ?? []).forEach((words, i) => {
    const v = amounts[i];
    const norm = (t: string) => t.toLocaleUpperCase('es-CO').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').replace(/ M ?CTE$/, '').trim();
    if (v && words && !norm(words).startsWith(norm(pesosInWords(v)).replace(/ PESOS.*$/, ''))) w.push(`Página ${i + 1}: el valor en letras no coincide con ${v}.`);
  });
  if (new Set(x.numbers ?? []).size !== (x.numbers ?? []).length) w.push('Hay consecutivos repetidos.');
  if (!x.hasSignature) w.push('Falta firma.');
  return { ...x, warnings: [...new Set(w)] };
}
