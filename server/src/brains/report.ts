// The Marketer drafts the monthly report: what moved the number and the plan for next month, from the pieces
// approved that month and their reasons. Numbers from outside (CRM, ads) stay for Nicolas to fill in.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { runBrain } from './run.js';

type Draft = { whatMoved: string; nextMonth: string };

export async function draftReport(brandId: string, month: string) {
  const [y, m] = month.split('-').map(Number);
  const from = Timestamp.fromDate(new Date(Date.UTC(y, m - 1, 1)));
  const to = Timestamp.fromDate(new Date(Date.UTC(y, m, 1)));
  const snap = await db.collection(`brands/${brandId}/requests`).where('approvedAt', '>=', from).where('approvedAt', '<', to).get();
  const pieces = await Promise.all(snap.docs.map(async (d) => {
    const v = d.get('latestVersion') ? await d.ref.collection('versions').doc(d.get('latestVersion')).get() : null;
    return { title: String(d.get('title') ?? ''), brain: d.get('leadBrain'), versions: Number(d.get('versionCount') ?? 1), reason: String(v?.get('reason') ?? '') };
  }));
  const report = await db.doc(`brands/${brandId}/reports/${month}`).get();
  const numbers = { leads: report.get('leads') ?? null, sales: report.get('salesAttributed') ?? null };
  const es = (await db.doc(`brands/${brandId}/settings/notices`).get()).get('lang') !== 'en';
  const fallback = (): Draft => ({
    whatMoved: pieces.length
      ? (es ? `Se aprobaron ${pieces.length} piezas este mes: ${pieces.slice(0, 4).map((p) => p.title).join(', ')}.` : `${pieces.length} pieces approved this month: ${pieces.slice(0, 4).map((p) => p.title).join(', ')}.`)
      : (es ? 'Este mes no hubo piezas aprobadas.' : 'No pieces were approved this month.'),
    nextMonth: es ? 'Qué mantenemos:\nQué dejamos:\nQué probamos:' : 'What we keep:\nWhat we stop:\nWhat we test:',
  });
  const { output, ai } = await runBrain<Draft>({
    brain: 'marketer', brandId, kind: 'report', title: `Report ${month}`,
    ask: `Draft the monthly report for ${month}. Pieces approved this month (title · Brain · versions · reason):
${pieces.map((p) => `- ${p.title} · ${p.brain} · v${p.versions} · ${p.reason || 'no reason given'}`).join('\n') || '- none'}
Numbers Nicolas entered (may be empty): leads ${numbers.leads ?? 'unknown'}, sales ${numbers.sales ?? 'unknown'}.
Return {"whatMoved": "one or two lines: what moved the number and the piece that drove it; never invent figures", "nextMonth": "three short lines: What we keep / What we stop / What we test"}.`,
    fallback,
  });
  const draft = { whatMoved: String(output.whatMoved ?? '').slice(0, 2000), nextMonth: String(output.nextMonth ?? '').slice(0, 2000) };
  await db.doc(`brands/${brandId}/reports/${month}`).set({
    month, ...draft, draftedBy: 'marketer', draftedWithAi: ai, draftedAt: FieldValue.serverTimestamp(),
    pieces: pieces.length, firstTryPct: pieces.length ? Math.round((pieces.filter((p) => p.versions <= 1).length / pieces.length) * 100) : null,
    ...(report.exists ? {} : { published: false, currency: 'COP' }),
  }, { merge: true });
  return { ...draft, ai };
}
