// The team at work, for real: request.work.steps holds one step per Brain (Researcher → Marketer → Creator → Builder).
// The session doing the request (the PC worker or Nicolas's own Claude Code) moves them with braindy_work_step:
// each Brain starts, finishes and leaves one line for the client, which is also its handoff to the next Brain.
// The client sees it live on the request and on Home (TeamAtWork).
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from '../connector/store.js';
import { brainBlock } from './knowledge.js';
import { monthOf } from '../usage.js';

export const RELAY = ['researcher', 'marketer', 'creator', 'builder'] as const;
export type StepBrain = (typeof RELAY)[number];
export type StepState = 'todo' | 'doing' | 'done' | 'skip';
export type Step = { brain: StepBrain; task: string; state: StepState; note?: string; at?: number };

const NAME: Record<StepBrain, string> = { researcher: 'researcher', marketer: 'marketer', creator: 'creator', builder: 'builder' };

/** One step per Brain. Its task: the plan line that names it, else what it said in the team meeting, else empty (the app shows its usual task). */
export function seedSteps(r: FirebaseFirestore.DocumentData): Step[] {
  const scope: string[] = Array.isArray(r.plan?.scope) ? r.plan.scope.map(String) : [];
  return RELAY.map((b) => {
    const line = scope.find((s) => s.toLowerCase().includes(NAME[b]));
    return { brain: b, task: String(line ?? r.teamNotes?.[b] ?? '').slice(0, 300), state: 'todo' as const };
  });
}

/** Seeds the steps if the request has none (or they belong to an older round) and returns them. */
export async function ensureSteps(ref: DocumentReference, fresh = false): Promise<Step[]> {
  const r = (await ref.get()).data();
  if (!r) throw new Error('No existe esa solicitud.');
  const have = r.work?.steps as Step[] | undefined;
  if (have?.length === RELAY.length && !fresh) return have;
  const steps = seedSteps(r);
  // A new round also starts a new brand check.
  await ref.update({ 'work.steps': steps, 'work.current': null, ...(fresh ? { quality: FieldValue.delete() } : {}) });
  return steps;
}

/** Moves one Brain's step. Starting one closes whoever was still working (the piece passed on). */
export async function setStep(ref: DocumentReference, brain: StepBrain, state: Exclude<StepState, 'todo'>, note?: string, ask?: string) {
  const steps = await ensureSteps(ref);
  const at = Date.now();
  const next = steps.map((s) => {
    if (s.brain === brain) return { ...s, state, at, ...(note?.trim() ? { note: note.trim().slice(0, 400) } : {}) };
    if (state === 'doing' && s.state === 'doing') return { ...s, state: 'done' as const, at };
    return s;
  });
  // A question for the client shows above the strip until they answer it; an empty one clears it.
  const q = ask === undefined ? {} : { 'work.ask': ask.trim() ? { brain, text: ask.trim().slice(0, 300), at } : null };
  await ref.update({ 'work.steps': next, 'work.current': state === 'doing' ? brain : null, ...q, updatedAt: FieldValue.serverTimestamp() });
  return next;
}

const show = (steps: Step[]) => steps.map((s, i) => `${i + 1}. ${s.brain}: ${s.state}${s.note ? ` — ${s.note}` : ''}`).join('\n');

export function registerStepTools(server: McpServer) {
  server.registerTool('braindy_work_step', {
    title: 'Mover el paso de un Brain en una solicitud',
    description: 'El equipo trabaja por turnos en cada solicitud: researcher → marketer → creator → builder. Llama esto al empezar el turno de un Brain (state "doing"; la respuesta trae el cerebro de la marca: léelo y aplícalo) y al terminarlo (state "done", con una nota de una línea para el cliente: qué encontró o hizo, en el idioma de la marca, sin claves ni datos internos). Usa "skip" si ese Brain no tiene nada que hacer en esta solicitud. Si necesitas un dato del cliente para seguir, ponlo en ask (una pregunta corta; el cliente la responde en el pedido y su respuesta llega como detalle agregado; ask vacío la quita). El cliente lo ve en vivo, en una franja compacta.',
    inputSchema: {
      brandId: z.string(), requestId: z.string(),
      brain: z.enum(RELAY), state: z.enum(['doing', 'done', 'skip']),
      note: z.string().max(400).optional().describe('Una línea para el cliente (al terminar)'),
      ask: z.string().max(300).optional().describe('Pregunta corta para el cliente cuando falta un dato; vacío la quita'),
      credits: z.number().int().min(0).max(2000).optional()
        .describe('Solo builder al terminar un ajuste del cliente: créditos Braindy que gasta de su cupo mensual. Guía: 50 un texto o color, 100 una foto o un cambio pequeño, 200 un bloque, 300 una sección nueva, 400 un formulario o arreglo con datos; 0 si era repetido o se cotiza aparte. Por defecto 100.'),
    },
  }, async (a) => {
    try {
      await requireBrand(a.brandId);
      const ref = db.doc(`brands/${a.brandId}/requests/${a.requestId}`);
      const steps = await setStep(ref, a.brain, a.state, a.note, a.ask);
      // A client's site adjustment takes its real size from the monthly quota once Builder finishes it.
      let charged = '';
      if (a.brain === 'builder' && a.state === 'done' && (await ref.get()).get('billable') === true) {
        const credits = a.credits ?? 100;
        await ref.update({ credits, creditsMonth: monthOf() });
        charged = `\nCupo: ${credits} créditos este mes.`;
      }
      // Every Brain starts its turn with the brand's brain in front of it.
      const brain = a.state === 'doing' ? await brainBlock(a.brandId, `Antes de trabajar, ${a.brain}: lee y aplica el cerebro de la marca; manda sobre tus criterios generales`) : '';
      return { content: [{ type: 'text' as const, text: `Listo. Pasos ahora:\n${show(steps)}${charged}${brain}` }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });
}
