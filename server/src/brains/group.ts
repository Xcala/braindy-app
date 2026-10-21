// Cross-brand analysis for multi-brand groups (the biggest clients): numbers per brand computed from the
// requests, and the Researcher's reading of them (consistency, where work gets stuck, opportunities).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { runBrain } from './run.js';

type Stat = { brandId: string; name: string; open: number; toApprove: number; approved90: number; firstTryPct: number | null; avgDays: number | null };
type Reading = { summary: string; insights: string[]; opportunities: string[] };

async function statsFor(brandId: string, name: string): Promise<Stat> {
  const since = Date.now() - 90 * 864e5;
  const snap = await db.collection(`brands/${brandId}/requests`).select('status', 'versionCount', 'createdAt', 'approvedAt').get();
  const rows = snap.docs.map((d) => d.data());
  const approved = rows.filter((r) => r.approvedAt && r.approvedAt.toMillis() >= since);
  const days = approved.filter((r) => r.createdAt).map((r) => (r.approvedAt.toMillis() - r.createdAt.toMillis()) / 864e5);
  return {
    brandId, name, open: rows.filter((r) => r.status === 'in_production').length, toApprove: rows.filter((r) => r.status === 'to_approve').length,
    approved90: approved.length, firstTryPct: approved.length ? Math.round((approved.filter((r) => Number(r.versionCount ?? 1) <= 1).length / approved.length) * 100) : null,
    avgDays: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null,
  };
}

export async function analyzeGroup(groupId: string) {
  const group = await db.doc(`brands/${groupId}`).get();
  const below = await db.collection('brands').where('ancestors', 'array-contains', groupId).get();
  const stats = await Promise.all(below.docs.filter((d) => d.get('status') !== 'archived').map((d) => statsFor(d.id, String(d.get('name') ?? d.id))));
  const es = (await db.doc(`brands/${groupId}/settings/notices`).get()).get('lang') !== 'en';
  const fallback = (): Reading => {
    const stuck = [...stats].sort((a, b) => b.toApprove - a.toApprove)[0];
    const low = stats.filter((s) => s.firstTryPct != null).sort((a, b) => (a.firstTryPct ?? 0) - (b.firstTryPct ?? 0))[0];
    return {
      summary: es
        ? `${stats.length} marcas · ${stats.reduce((n, s) => n + s.open, 0)} en producción · ${stats.reduce((n, s) => n + s.toApprove, 0)} esperando aprobación.`
        : `${stats.length} brands · ${stats.reduce((n, s) => n + s.open, 0)} in production · ${stats.reduce((n, s) => n + s.toApprove, 0)} waiting for approval.`,
      insights: [
        stuck && stuck.toApprove ? (es ? `${stuck.name} tiene más trabajo esperando aprobación (${stuck.toApprove}).` : `${stuck.name} has the most work waiting for approval (${stuck.toApprove}).`) : '',
        low ? (es ? `${low.name} tiene la aprobación al primer intento más baja (${low.firstTryPct}%): a su Brand Brain le puede faltar detalle.` : `${low.name} has the lowest first-try approval (${low.firstTryPct}%): its Brand Brain may need more detail.`) : '',
      ].filter(Boolean),
      opportunities: [],
    };
  };
  const { output, ai } = await runBrain<Reading>({
    brain: 'researcher', brandId: groupId, kind: 'group_analysis', title: `Group analysis ${group.get('name')}`,
    ask: `Analyze the brands of the group "${group.get('name')}" together. Per brand (last 90 days): ${JSON.stringify(stats)}.
Return {"summary": "one line", "insights": [up to 4 lines: consistency across brands, where work gets stuck, which brand learns fastest], "opportunities": [up to 3 lines: shared campaigns, reusable pieces, brands that should borrow from another]}. Never invent figures beyond these.`,
    fallback,
  });
  const reading = {
    summary: String(output.summary ?? '').slice(0, 400),
    insights: (output.insights ?? []).map((s) => String(s).slice(0, 300)).slice(0, 4),
    opportunities: (output.opportunities ?? []).map((s) => String(s).slice(0, 300)).slice(0, 3),
  };
  await db.collection(`brands/${groupId}/insights`).doc().set({
    brain: 'researcher', kind: 'group_analysis', title: reading.summary, ...reading, stats, ai, at: FieldValue.serverTimestamp(),
  });
  return { ...reading, stats, ai };
}
