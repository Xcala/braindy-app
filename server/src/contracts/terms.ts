// Contract terms: the values Nicolas sets per brand (defaults below), the contractor profile (admin) and
// the client data typed at signing. fill() puts them into the template's {{placeholders}}.
import { TEMPLATE_V1 } from './template.js';
import { amountInWords } from './words.js';

/** Defaults agreed with Nicolas on 2026-10-30. Editable per contract while it is a draft. */
export const DEFAULT_TERMS = {
  objeto: '',
  'propuesta.id': '',
  'propuesta.fecha': '',
  'plazo.meses': '3',
  'plazo.inicio': '',
  'valor.monto': '',
  'valor.moneda': 'COP',
  'pago.frecuencia': 'mensualmente',
  'pago.cuota': '',
  'pago.diasHabiles': '5',
  'terceros.incluidos': '',
  horario: 'lunes a viernes, de 9:00 a 18:00',
  zonaHoraria: 'Bogotá (GMT-5)',
  festivos: 'Colombia',
  'cliente.contacto': '',
  'cliente.aprobadores': '',
  revisiones: '2',
  'urgencia.recargo': '30 %',
  'reuniones.frecuencia': 'una reunión semanal',
  'reuniones.duracion': '1 hora',
  'capacitacion.personas': '2',
  'sla.respuesta': '8',
  'sla.entregaMin': '48',
  'sla.ajustes': '24',
  'cliente.slaInfo': '5',
  'cliente.slaAprobacion': '3',
  'silencio.dias': '5',
  'silencio.diasPausa': '10',
  'mora.diasPausa': '15',
  'mora.diasTerminacion': '45',
  'mora.diasReanudar': '3',
  'informe.frecuencia': 'mensual',
  territorio: 'todo el mundo',
  'confidencialidad.anios': '2',
  'terminacion.preaviso': '30',
  'cierre.meses': '6',
  domicilio: 'Bogotá D.C.',
} as const;

export type TermKey = keyof typeof DEFAULT_TERMS;
export type Terms = Record<TermKey, string>;
export const TERM_KEYS = Object.keys(DEFAULT_TERMS) as TermKey[];

/** Contractor (Nicolas, natural person). Lives in config/contractor, admin only. */
export const CONTRACTOR_KEYS = ['nombre', 'tipoDoc', 'doc', 'correo', 'direccion'] as const;
export type Contractor = Record<(typeof CONTRACTOR_KEYS)[number], string>;

/** Client data typed by the legal representative when signing. */
export const CLIENT_KEYS = ['razonSocial', 'nit', 'direccion', 'representante', 'tipoDoc', 'doc', 'cargo', 'correo'] as const;
export type ClientData = Record<(typeof CLIENT_KEYS)[number], string>;

const clean = (v: unknown, max = 600) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, max);

export function pickTerms(input: unknown, base: Partial<Terms> = {}): Terms {
  const src = (input ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_TERMS, ...base } as Terms;
  for (const k of TERM_KEYS) if (k in src) out[k] = clean(src[k], k === 'objeto' || k === 'terceros.incluidos' ? 1500 : 300);
  return out;
}

export function pickRecord<K extends string>(keys: readonly K[], input: unknown, max = 200): Record<K, string> {
  const src = (input ?? {}) as Record<string, unknown>;
  return Object.fromEntries(keys.map((k) => [k, clean(src[k], max)])) as Record<K, string>;
}

/** Terms that must be set before the contract is sent to the client. */
export function missingTerms(t: Terms): TermKey[] {
  const required: TermKey[] = ['objeto', 'plazo.meses', 'plazo.inicio', 'valor.monto', 'pago.cuota', 'cliente.contacto', 'cliente.aprobadores'];
  return required.filter((k) => !t[k].trim());
}

export function formatMoney(amount: string, currency: string) {
  const n = Number(String(amount).replace(/[^\d]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return '';
  return `$${n.toLocaleString('es-CO')} ${currency}`;
}

/** Fills the template. Missing client data stays as a visible blank line until the client signs. */
export function fill(terms: Terms, contractor: Partial<Contractor>, client: Partial<ClientData> | null): string {
  const n = Number(String(terms['valor.monto']).replace(/[^\d]/g, ''));
  const values: Record<string, string> = {
    ...terms,
    'valor.total': formatMoney(terms['valor.monto'], terms['valor.moneda']),
    'valor.letras': n > 0 ? amountInWords(n, terms['valor.moneda']) : '',
    'terceros.incluidos': terms['terceros.incluidos'] ? `Sí están incluidos: ${terms['terceros.incluidos']}` : '',
  };
  for (const k of CONTRACTOR_KEYS) values[`contratista.${k}`] = contractor[k] ?? '';
  for (const k of CLIENT_KEYS) values[`cliente.${k}`] = client?.[k] ?? '';
  const optional = new Set(['terceros.incluidos', 'propuesta.id', 'propuesta.fecha']);
  return TEMPLATE_V1
    .replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => values[key]?.trim() || (optional.has(key) ? '' : '________'))
    .replace(/ +\n/g, '\n').replace(/aceptada  del /, 'aceptada del ').replace(/aceptada del \./, 'aceptada.');
}
