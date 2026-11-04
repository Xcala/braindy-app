// Same shapes as server/src/contracts (terms, schedule, checklist, signatures).
export type ContractStatus = 'draft' | 'sent' | 'clientSigned' | 'signed';
export type RowStatus = 'pending' | 'doing' | 'done' | 'blocked';
export type Tone = 'strategy' | 'brand' | 'web' | 'content' | 'agents' | 'ads' | 'knowledge';
export interface ScheduleRow { id: string; title: string; note: string; from: number; to: number; milestone: boolean; status: RowStatus; tone?: Tone; label?: string }
export interface ScheduleGroup { id: string; title: string; rows: ScheduleRow[] }
export interface Schedule { start: string; weeks: number; meeting: { weekday: number; time: string; minutes: number }; groups: ScheduleGroup[] }
export interface ChecklistItem { id: string; title: string; week: number; done: boolean; doneAt?: string | null }

export const CLIENT_FIELDS = ['razonSocial', 'nit', 'direccion', 'representante', 'tipoDoc', 'doc', 'cargo'] as const;
export type ClientField = (typeof CLIENT_FIELDS)[number];
export type ClientData = Record<ClientField | 'correo', string>;

export const CONTRACTOR_FIELDS = ['nombre', 'tipoDoc', 'doc', 'correo', 'direccion'] as const;

export interface SignatureInfo { name: string; tipoDoc: string; doc: string; cargo: string; email: string; signedAt: string; ip?: string }
export interface Contract {
  id: string;
  status: ContractStatus;
  templateVersion: string;
  terms: Record<string, string>;
  scope: string;
  schedule: Schedule;
  checklist: ChecklistItem[];
  signer: { email: string; name: string };
  sentText?: string | null;
  textHash?: string;
  client?: ClientData;
  signatures?: { client?: SignatureInfo; contractor?: SignatureInfo };
  pdf?: { fileName: string; sha256: string; size: number };
}

/** Terms Nicolas edits, in the order of the form. Keys match server DEFAULT_TERMS. */
export const TERM_GROUPS: Array<{ title: 'scope' | 'money' | 'rules' | 'times' | 'legal'; keys: string[] }> = [
  { title: 'scope', keys: ['objeto', 'propuesta.id', 'propuesta.fecha', 'plazo.meses', 'plazo.inicio'] },
  { title: 'money', keys: ['valor.monto', 'valor.moneda', 'pago.frecuencia', 'pago.cuota', 'pago.diasHabiles', 'terceros.incluidos'] },
  { title: 'rules', keys: ['horario', 'zonaHoraria', 'festivos', 'cliente.contacto', 'cliente.aprobadores', 'revisiones', 'urgencia.recargo', 'reuniones.frecuencia', 'reuniones.duracion', 'capacitacion.personas', 'informe.frecuencia'] },
  { title: 'times', keys: ['sla.respuesta', 'sla.entregaMin', 'sla.ajustes', 'cliente.slaInfo', 'cliente.slaAprobacion', 'silencio.dias', 'silencio.diasPausa'] },
  { title: 'legal', keys: ['mora.diasPausa', 'mora.diasTerminacion', 'mora.diasReanudar', 'territorio', 'confidencialidad.anios', 'terminacion.preaviso', 'cierre.meses', 'domicilio'] },
];
