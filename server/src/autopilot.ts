// Free action ("autopilot") per brand: NickMark lets a brand's requests go straight to work. The plan is approved
// on arrival and the request is queued; the worker on Nicolas's PC (server/worker/run.ts) picks it up and runs a
// Claude Code session in the brand's workspace folder for that kind of request.
// Set on brands/{id}.autopilot = { on, publish, workspaces: { web: "C:\level", default: "G:\..." } } (keys are request categories).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { logError } from './guard.js';

export type Autopilot = { on: boolean; publish: boolean; workspaces: Record<string, string> };

/** The folder for a request category: its own one, or the brand's default. */
export const workspaceFor = (a: Autopilot, category: string) => a.workspaces[category] || a.workspaces.default || null;

export async function autopilotOf(brandId: string): Promise<Autopilot | null> {
  const a = (await db.doc(`brands/${brandId}`).get()).get('autopilot') as Partial<Autopilot> | undefined;
  return a?.on && a.workspaces?.default ? { on: true, publish: !!a.publish, workspaces: { ...a.workspaces } } : null;
}

/** Queues a request for the worker. With `approvePlan`, the plan gate opens on its own. Never throws. */
export async function queueWork(brandId: string, requestId: string, reason: 'new' | 'changes' | 'comment', approvePlan = false) {
  try {
    if (!(await autopilotOf(brandId))) return false;
    const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
    const now = FieldValue.serverTimestamp();
    await ref.update({
      work: { state: 'queued', reason, queuedAt: now },
      ...(approvePlan ? { 'plan.approved': true, 'plan.approvedAt': now, 'plan.approvedBy': 'autopilot', stage: 'work' } : {}),
      updatedAt: now,
    });
    return true;
  } catch (e) {
    logError(e, { where: 'autopilot', brandId, requestId });
    return false;
  }
}
