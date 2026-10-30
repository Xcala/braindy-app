// Amounts in Spanish words for the contract ("doce millones de pesos colombianos").
const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
  'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
  'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

export const apocope = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

function below1000(n: number): string {
  if (n === 100) return 'cien';
  const h = Math.floor(n / 100), r = n % 100;
  const rest = r < 30 ? UNITS[r] : TENS[Math.floor(r / 10)] + (r % 10 ? ` y ${UNITS[r % 10]}` : '');
  return [HUNDREDS[h], rest].filter(Boolean).join(' ');
}

/** Integer to words; "uno" becomes "un" before a noun (un millón, veintiún mil). */
export function numberInWords(n: number): string {
  if (n === 0) return 'cero';
  const millions = Math.floor(n / 1_000_000), thousands = Math.floor((n % 1_000_000) / 1000), rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? 'un millón' : `${apocope(numberInWords(millions))} millones`);
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${apocope(below1000(thousands))} mil`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

const CURRENCY: Record<string, [string, string]> = { COP: ['peso colombiano', 'pesos colombianos'], USD: ['dólar estadounidense', 'dólares estadounidenses'] };

export function amountInWords(n: number, currency: string): string {
  const [one, many] = CURRENCY[currency] ?? [currency, currency];
  const words = numberInWords(Math.round(n));
  const exactMillions = n >= 1_000_000 && n % 1_000_000 === 0;
  if (n === 1) return `un ${one}`;
  return `${apocope(words)} ${exactMillions ? 'de ' : ''}${many}`;
}
