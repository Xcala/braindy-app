// Pure money pieces of the cuentas de cobro: COP format, amount in words (Colombia), the split of a total into
// cuentas, months and issue dates, payment allocation and the DIAN check digit. No Firestore here (unit tested).
import { apocope, numberInWords } from '../contracts/words.js';

/** $1.083.333 (Colombian thousands dot, no decimals). */
export const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')}`;

/** «UN MILLÓN OCHENTA Y TRES MIL TRESCIENTOS TREINTA Y TRES PESOS M/CTE.» */
export function pesosInWords(n: number): string {
  const v = Math.round(n);
  if (v === 1) return 'UN PESO M/CTE.';
  const words = apocope(numberInWords(v));
  const de = v >= 1_000_000 && v % 1_000_000 === 0 ? 'DE ' : '';
  return `${words.toLocaleUpperCase('es-CO')} ${de}PESOS M/CTE.`;
}

/** Total split in n integer cuentas: floor in the first n−1, the remainder in the last. */
export function splitAmount(total: number, n: number): number[] {
  if (!Number.isInteger(total) || total <= 0 || !Number.isInteger(n) || n < 1 || n > 60) throw new Error('bad_split');
  const each = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - each * (n - 1) : each));
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ym = (s: string) => { const m = /^(\d{4})-(\d{2})$/.exec(s); if (!m || +m[2] < 1 || +m[2] > 12) throw new Error('bad_month'); return [+m[1], +m[2]] as const; };

/** "2026-09" plus k months. */
export function addMonths(month: string, k: number): string {
  const [y, m] = ym(month);
  const t = y * 12 + (m - 1) + k;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}
/** «noviembre de 2026». */
export const monthLabel = (month: string) => { const [y, m] = ym(month); return `${MONTHS[m - 1]} de ${y}`; };
/** «25 de noviembre de 2026» from YYYY-MM-DD. */
export const dateLabel = (ymd: string) => { const [y, m, d] = ymd.split('-').map(Number); return `${d} de ${MONTHS[m - 1]} de ${y}`; };
/** Today in Bogotá as YYYY-MM-DD. */
export const todayBogota = (at = new Date()) => at.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

/** When a cuenta's 30 days start: the day it was issued, or its own planned day if it was issued early (2026-11-26:
 *  Blacky's December–February cuentas were sent in November and must not turn «En mora» in December). */
export const dueFrom = (d: { issueDate?: string | null; scheduledDate?: string | null }) =>
  [d.issueDate ?? '', d.scheduledDate ?? ''].reduce((a, b) => (b > a ? b : a), '');
/** Unpaid for more than `days` since dueFrom. `today` is YYYY-MM-DD in Bogotá. */
export function isLate(d: { issueDate?: string | null; scheduledDate?: string | null }, today: string, days = 30) {
  const from = dueFrom(d);
  if (!from) return false;
  const limit = new Date(`${from}T12:00:00Z`); limit.setUTCDate(limit.getUTCDate() + days);
  return today > limit.toISOString().slice(0, 10);
}

export type PlanRow = { index: number; of: number; number: string; billingMonth: string; scheduledDate: string; amount: number; issueNow: boolean };

/** The cuentas of an agreement. Months up to the current one are issued at activation (dated today, never backdated);
 *  later ones wait for their issue day. */
export function planOf(a: { totalAmount: number; installments: number; startMonth: string; issueDay: number; numberingPrefix: string }, today = todayBogota()): PlanRow[] {
  const day = Math.min(28, Math.max(1, Math.round(a.issueDay)));
  const thisMonth = today.slice(0, 7);
  return splitAmount(a.totalAmount, a.installments).map((amount, i) => {
    const billingMonth = addMonths(a.startMonth, i);
    const due = `${billingMonth}-${String(day).padStart(2, '0')}`;
    const issueNow = billingMonth <= thisMonth;
    return { index: i + 1, of: a.installments, number: `${a.numberingPrefix}-${String(i + 1).padStart(2, '0')}`, billingMonth, scheduledDate: issueNow ? today : due, amount, issueNow };
  });
}

/** A payment spread over open cuentas in order: each takes what it still owes until the money runs out. */
export function allocate(open: Array<{ id: string; owed: number }>, amount: number): Array<{ id: string; applied: number; settles: boolean }> {
  let left = Math.round(amount);
  const out: Array<{ id: string; applied: number; settles: boolean }> = [];
  for (const o of open) {
    if (left <= 0) break;
    const applied = Math.min(left, o.owed);
    if (applied <= 0) continue;
    out.push({ id: o.id, applied, settles: applied === o.owed });
    left -= applied;
  }
  return out;
}

/** DIAN verification digit of a NIT (digits only, without the digit). */
export function nitCheckDigit(nit: string): number {
  const digits = nit.replace(/\D/g, '');
  const w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += Number(digits[digits.length - 1 - i]) * w[i];
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}
/** "902038455-4" → valid when the digit after the dash matches. Null when there is no digit to check. */
export function nitValid(taxId: string): boolean | null {
  const m = /^\s*([\d.\s]+)-\s*(\d)\s*$/.exec(taxId);
  return m ? nitCheckDigit(m[1]) === Number(m[2]) : null;
}

/** ****3465 */
export const mask = (s: string | null | undefined) => { const d = String(s ?? '').replace(/\s/g, ''); return d ? `****${d.slice(-4)}` : ''; };

// ---- Several issuers: a Colombian one (COP, Spanish) and a US one (USD in cents, English). ----
export type Currency = 'COP' | 'USD';
export type Lang = 'es' | 'en';
/** Amounts are integers in the smallest unit used here: pesos for COP, cents for USD. */
export const money = (n: number, cur: Currency = 'COP') =>
  cur === 'USD' ? `US$${(Math.round(n) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${cop(n)} COP`;

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? `-${ONES[r % 10]}` : ''}`;
  return [h ? `${ONES[h]} hundred` : '', rest].filter(Boolean).join(' ');
}
/** 1083 → «one thousand eighty-three». */
export function englishNumber(n: number): string {
  if (n === 0) return 'zero';
  const parts: string[] = [];
  for (const [v, w] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand'], [1, '']] as const) {
    const k = Math.floor(n / v) % 1000;
    if (k) parts.push(`${under1000(k)}${w ? ` ${w}` : ''}`);
  }
  return parts.join(' ');
}
/** 108333 cents → «ONE THOUSAND EIGHTY-THREE AND 33/100 US DOLLARS». */
export function dollarsInWords(cents: number): string {
  const c = Math.round(cents), d = Math.floor(c / 100), r = c % 100;
  return `${englishNumber(d).toUpperCase()} AND ${String(r).padStart(2, '0')}/100 US DOLLAR${d === 1 && r === 0 ? '' : 'S'}`;
}
export const amountInWords = (n: number, cur: Currency = 'COP') => (cur === 'USD' ? dollarsInWords(n) : pesosInWords(n));

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthLabelL = (month: string, lang: Lang = 'es') => { if (lang === 'es') return monthLabel(month); const [y, m] = ym(month); return `${MONTHS_EN[m - 1]} ${y}`; };
export const dateLabelL = (ymd: string, lang: Lang = 'es') => { if (lang === 'es') return dateLabel(ymd); const [y, m, d] = ymd.split('-').map(Number); return `${MONTHS_EN[m - 1]} ${d}, ${y}`; };
