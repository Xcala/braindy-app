// When a request arrives, its lead Brain proposes the plan (scope, first delivery, note). Nicolas still
// approves it at the plan gate: the proposal is saved with approved: false.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { runBrain } from './run.js';
import type { BrainId } from './prompts.js';

type Plan = { scope: string[]; firstDelivery: string | null; note: string };

const LEAD_STEP: Record<BrainId, { es: string; en: string }> = {
  researcher: { es: 'El Researcher entrega los hallazgos con sus fuentes', en: 'Researcher delivers the findings with sources' },
  marketer: { es: 'El Marketer escribe el mensaje y los textos', en: 'Marketer writes the message and the copy' },
  creator: { es: 'El Creator diseña las piezas con su porqué', en: 'Creator designs the pieces with their rationale' },
  builder: { es: 'El Builder lo construye y lo conecta', en: 'Builder builds and connects it' },
};

/** First piece in 72 hours (business days), never after the client's due date. */
function firstDeliveryDate(due?: string | null) {
  const d = new Date();
  for (let added = 0; added < 3;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
  const iso = d.toISOString().slice(0, 10);
  return due && due < iso ? due : iso;
}

export async function proposePlan(brandId: string, requestId: string) {
  const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
  const r = (await ref.get()).data();
  if (!r || r.plan?.approved) return null;
  const lead = r.leadBrain as BrainId;
  const es = !/^en/i.test(String(r.language ?? '')) ;
  const fallback = (): Plan => ({
    scope: [
      es ? 'El Researcher lee el contexto de la marca y las referencias' : 'Researcher reads the brand context and the references',
      LEAD_STEP[lead][es ? 'es' : 'en'],
      es ? 'El Builder prepara los archivos finales y actualiza el Brand Brain' : 'Builder prepares the final files and updates the Brand Brain',
    ],
    firstDelivery: firstDeliveryDate(r.dueDate), note: '',
  });
  const { output, ai } = await runBrain<Plan>({
    brain: lead, brandId, kind: 'plan', title: String(r.title ?? ''),
    ask: `A client asked for: ${r.formatType || r.title} (${r.category}/${r.subcategory}). Due date: ${r.dueDate || 'not set'}. Format: ${r.format || 'not set'}.
Product: ${r.cards?.product?.text || '-'}\nApplication: ${r.cards?.application?.text || '-'}\nScene: ${r.cards?.scene?.text || '-'}
Helper Brains: ${(r.helperBrains ?? []).join(', ') || 'none'}.
Propose the plan as {"scope": [3 to 6 short steps, each starting with the Brain that does it], "firstDelivery": "YYYY-MM-DD" (first piece within 3 business days, never after the due date), "note": "one line on the approach or what is missing from the brief"}.`,
    fallback,
  });
  const plan = {
    scope: (Array.isArray(output.scope) ? output.scope : fallback().scope).map((s) => String(s).slice(0, 300)).filter(Boolean).slice(0, 8),
    firstDelivery: /^\d{4}-\d{2}-\d{2}$/.test(String(output.firstDelivery)) ? output.firstDelivery : fallback().firstDelivery,
    note: String(output.note ?? '').slice(0, 600), approved: false, proposedBy: lead, proposedWithAi: ai, proposedAt: FieldValue.serverTimestamp(),
  };
  await ref.update({ plan, updatedAt: FieldValue.serverTimestamp() });
  return plan;
}
