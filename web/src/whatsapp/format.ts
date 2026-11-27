// Small formatters for the WhatsApp admin: phone numbers with spaces, short dates and «x ago».
import type { StringKey } from '../i18n/strings';

type T = (key: StringKey, vars?: Record<string, string | number>) => string;

// Country codes whose numbers are not 10 digits after the code are rare in our inbox; the rest is grouped 3 · 3 · 4.
const CC3 = ['593', '591', '595', '598', '502', '503', '504', '505', '506', '507', '351', '353', '354', '358', '971', '972'];

/** «573113511003» → «+57 311 351 1003»; «14085551234» → «+1 408 555 1234». Unknown shapes get groups of three. */
export function fmtPhone(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  let cc: string;
  if (d.startsWith('1') && d.length === 11) cc = '1';
  else if (CC3.some((c) => d.startsWith(c))) cc = d.slice(0, 3);
  else cc = d.slice(0, 2);
  const rest = d.slice(cc.length);
  const parts = rest.length === 10 ? [rest.slice(0, 3), rest.slice(3, 6), rest.slice(6)] : (rest.match(/.{1,3}/g) ?? []);
  return `+${cc} ${parts.join(' ')}`.trim();
}

const locale = (lang: string) => (lang === 'es' ? 'es-CO' : 'en-US');
const clean = (s: string) => s.replace(/\./g, '').replace(/\s+/g, ' ').trim();

/** Short date: «hoy 4:33 p. m.» today, «24 nov» otherwise, with the year only when it is not this year. */
export function shortWhen(d: Date | null | undefined, lang: string, t: T): string {
  if (!d) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return t('wa.today', { time: d.toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' }) });
  }
  return shortDay(d, lang);
}

/** «24 nov» or «24 nov 2025» (year only when it is not this year). */
export function shortDay(d: Date, lang: string): string {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return clean(d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }));
}

/** «hace 3 h», «hace 12 min», «hace 2 d». */
export function ago(d: Date, t: T): string {
  const min = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (min < 1) return t('wa.ago.now');
  if (min < 60) return t('wa.ago.m', { n: min });
  const h = Math.round(min / 60);
  if (h < 48) return t('wa.ago.h', { n: h });
  return t('wa.ago.d', { n: Math.round(h / 24) });
}
