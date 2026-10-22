// When a request arrives, the four Brains meet (like an agency team): each brings its angle, and the plan
// comes out of that meeting, led by the request's protagonist. NickMark approves it at the plan gate
// (saved with approved: false). The meeting notes stay on the request as teamNotes (shown to NickMark).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { runBrain } from './run.js';
import type { BrainId } from './prompts.js';

type Notes = Record<BrainId, string>;
type Meeting = { team: Notes; scope: string[]; firstDelivery: string | null; note: string };

const LEAD_STEP: Record<BrainId, { es: string; en: string }> = {
  researcher: { es: 'El Researcher entrega los hallazgos con sus fuentes', en: 'Researcher delivers the findings with sources' },
  marketer: { es: 'El Marketer escribe el mensaje y los textos', en: 'Marketer writes the message and the copy' },
  creator: { es: 'El Creator diseña las piezas con su porqué', en: 'Creator designs the pieces with their rationale' },
  builder: { es: 'El Builder lo construye y lo conecta', en: 'Builder builds and connects it' },
};

// What each Brain brings to every meeting, when AI is not connected.
const ANGLE: Record<BrainId, { es: string; en: string }> = {
  researcher: { es: 'Reviso el Brand Brain, lo aprendido con la marca y las referencias del brief.', en: 'I review the Brand Brain, what we learned with the brand and the brief references.' },
  marketer: { es: 'Defino el mensaje principal y dónde se va a usar la pieza.', en: 'I set the main message and where the piece will be used.' },
  creator: { es: 'Propongo la dirección visual dentro del Brainline de la marca.', en: 'I propose the visual direction within the brand Brainline.' },
  builder: { es: 'Preparo formatos, tamaños y archivos finales para producción.', en: 'I prepare formats, sizes and final files for production.' },
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
  const lang = /^en/i.test(String(r.language ?? '')) ? 'en' : 'es';
  const fallback = (): Meeting => ({
    team: { researcher: ANGLE.researcher[lang], marketer: ANGLE.marketer[lang], creator: ANGLE.creator[lang], builder: ANGLE.builder[lang] },
    scope: [
      lang === 'es' ? 'El Researcher lee el contexto de la marca y las referencias' : 'Researcher reads the brand context and the references',
      LEAD_STEP[lead][lang],
      lang === 'es' ? 'El Builder prepara los archivos finales y actualiza el Brand Brain' : 'Builder prepares the final files and updates the Brand Brain',
    ],
    firstDelivery: firstDeliveryDate(r.dueDate), note: '',
  });
  const { output, ai } = await runBrain<Meeting>({
    brain: lead, brandId, kind: 'plan', title: String(r.title ?? ''), team: true, maxTokens: 2200,
    ask: `Team meeting for a new request: ${r.formatType || r.title} (${r.category}/${r.subcategory}). Protagonist: the ${lead}. Due date: ${r.dueDate || 'not set'}. Format: ${r.format || 'not set'}.
Product: ${r.cards?.product?.text || '-'}\nApplication: ${r.cards?.application?.text || '-'}\nScene: ${r.cards?.scene?.text || '-'}
Each Brain brings its angle in one or two lines (Researcher: context and data; Marketer: message and strategy; Creator: visual direction; Builder: format and production), using the team memory. Then agree the plan for NickMark to approve.
Return {"team": {"researcher": "...", "marketer": "...", "creator": "...", "builder": "..."}, "scope": [3 to 6 short steps, each starting with the Brain that does it], "firstDelivery": "YYYY-MM-DD" (first piece within 3 business days, never after the due date), "note": "one line for NickMark: the approach, or what is missing from the brief"}.`,
    fallback,
  });
  const fb = fallback();
  const team = Object.fromEntries((['researcher', 'marketer', 'creator', 'builder'] as BrainId[])
    .map((b) => [b, String(output.team?.[b] ?? fb.team[b]).slice(0, 500)])) as Notes;
  const plan = {
    scope: (Array.isArray(output.scope) ? output.scope : fb.scope).map((s) => String(s).slice(0, 300)).filter(Boolean).slice(0, 8),
    firstDelivery: /^\d{4}-\d{2}-\d{2}$/.test(String(output.firstDelivery)) ? output.firstDelivery : fb.firstDelivery,
    note: String(output.note ?? '').slice(0, 600), approved: false, proposedBy: lead, proposedWithAi: ai, proposedAt: FieldValue.serverTimestamp(),
  };
  await ref.update({ plan, teamNotes: { ...team, ai, at: FieldValue.serverTimestamp() }, updatedAt: FieldValue.serverTimestamp() });
  return plan;
}
