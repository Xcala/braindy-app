// Task runner: every piece of Brainwork is a brainTasks doc (admin-only) and moves the Brain's public status
// (brains/{id}: working or ready, never what or for whom). With Claude configured the Brain writes it;
// without, the task's fallback runs, so the flow works today and gets smarter when the key arrives.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { aiConfigured, claudeJson } from '../ai.js';
import { logError } from '../guard.js';
import { brandContext } from './context.js';
import { systemPrompt, teamPrompt, type BrainId } from './prompts.js';

const now = () => FieldValue.serverTimestamp();

async function setStatus(brain: BrainId) {
  const running = await db.collection('brainTasks').where('brain', '==', brain).where('status', '==', 'running').limit(1).get();
  await db.doc(`brains/${brain}`).set({ status: running.empty ? 'ready' : 'working', updatedAt: now() }, { merge: true });
}

/**
 * Runs one task. `ask` is the instruction (the Brand Brain is added automatically); `fallback` produces the
 * same shape without AI. Returns the output and whether AI wrote it.
 */
export async function runBrain<T>(o: {
  brain: BrainId; brandId: string; kind: string; title: string; ask: string; fallback: () => T | Promise<T>; maxTokens?: number;
  /** All four Brains in one meeting (the lead still owns the task). */
  team?: boolean;
}): Promise<{ output: T; ai: boolean; taskId: string }> {
  const task = db.collection('brainTasks').doc();
  await task.set({ brain: o.brain, brandId: o.brandId, kind: o.kind, title: o.title.slice(0, 160), status: 'running', ai: aiConfigured(), createdAt: now() });
  await setStatus(o.brain);
  let output: T; let ai = false;
  try {
    if (aiConfigured()) {
      const ctx = await brandContext(o.brandId);
      output = await claudeJson<T>(o.team ? teamPrompt() : systemPrompt(o.brain), `Brand Brain:\n${ctx.text}\n\nWrite in ${ctx.lang === 'en' ? 'English' : 'Spanish'}.\n\n${o.ask}`, o.maxTokens ?? 1800);
      ai = true;
    } else output = await o.fallback();
  } catch (e) {
    logError(e, { where: 'brain', brain: o.brain, kind: o.kind });
    output = await o.fallback();
  }
  await task.update({ status: 'done', ai, finishedAt: now() });
  await setStatus(o.brain);
  return { output, ai, taskId: task.id };
}
