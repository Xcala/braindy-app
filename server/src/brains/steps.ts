// The team at work, for real: request.work.steps holds one step per Brain (Researcher → Marketer → Creator → Builder).
// The session doing the request (the PC worker or Nicolas's own Claude Code) moves them with braindy_work_step:
// each Brain starts, finishes and leaves one line for the client, which is also its handoff to the next Brain.
// The client sees it live on the request and on Home (TeamAtWork).
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from '../connector/store.js';

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
export async function setStep(ref: DocumentReference, brain: StepBrain, state: Exclude<StepState, 'todo'>, note?: string) {
  const steps = await ensureSteps(ref);
  const at = Date.now();
  const next = steps.map((s) => {
    if (s.brain === brain) return { ...s, state, at, ...(note?.trim() ? { note: note.trim().slice(0, 400) } : {}) };
    if (state === 'doing' && s.state === 'doing') return { ...s, state: 'done' as const, at };
    return s;
  });
  await ref.update({ 'work.steps': next, 'work.current': state === 'doing' ? brain : null, updatedAt: FieldValue.serverTimestamp() });
  return next;
}

const show = (steps: Step[]) => steps.map((s, i) => `${i + 1}. ${s.brain}: ${s.state}${s.note ? ` — ${s.note}` : ''}`).join('\n');

export function registerStepTools(server: McpServer) {
  server.registerTool('braindy_work_step', {
    title: 'Mover el paso de un Brain en una solicitud',
    description: 'El equipo trabaja por turnos en cada solicitud: researcher → marketer → creator → builder. Llama esto al empezar el turno de un Brain (state "doing") y al terminarlo (state "done", con una nota de una línea para el cliente: qué encontró o hizo, en el idioma de la marca, sin claves ni datos internos). Usa "skip" si ese Brain no tiene nada que hacer en esta solicitud. El cliente lo ve en vivo.',
    inputSchema: {
      brandId: z.string(), requestId: z.string(),
      brain: z.enum(RELAY), state: z.enum(['doing', 'done', 'skip']),
      note: z.string().max(400).optional().describe('Una línea para el cliente (al terminar)'),
    },
  }, async (a) => {
    try {
      await requireBrand(a.brandId);
      const ref = db.doc(`brands/${a.brandId}/requests/${a.requestId}`);
      const steps = await setStep(ref, a.brain, a.state, a.note);
      return { content: [{ type: 'text' as const, text: `Listo. Pasos ahora:\n${show(steps)}` }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });
}
