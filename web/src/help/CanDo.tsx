import { useI18n } from '../i18n/I18nProvider';
import { useRequests } from '../requests/useRequests';
import { STEPS, useFirstSteps } from './firstSteps';

/** What a card does when tapped: ask a real example question, open «Your chats», or start the composer's tool. */
type Act = { kind: 'ask'; q: string } | { kind: 'hist' } | { kind: 'tool'; tool: 'attach' | 'dictate' };
const CARDS = [
  { icon: '📊', k: 'status' }, { icon: '📝', k: 'work' }, { icon: '✅', k: 'approve' },
  { icon: '🌐', k: 'site' }, { icon: '🎙️', k: 'media' }, { icon: '🕘', k: 'chats' },
] as const;

/**
 * The empty chat teaches by doing (2026-11-20): six cards with everything the assistant can do, each one trying a real
 * example on the person's brand; what is waiting for them goes first («You have 2 to approve»). Clients also see their
 * first five steps, ticked when they really do each one, gone once all are done.
 */
export function CanDo({ brandId, client, onAsk, onHist }: { brandId: string; client: boolean; onAsk: (q: string) => void; onHist: () => void }) {
  const { t } = useI18n();
  const { list } = useRequests(brandId);
  const done = useFirstSteps();
  const open = list.filter((r) => !r.archived && !r.cancelled);
  const toApprove = open.filter((r) => r.status === 'to_approve').length;
  const inProd = open.filter((r) => r.status === 'in_production').length;

  const act = (k: (typeof CARDS)[number]['k']): Act => k === 'chats' ? { kind: 'hist' } : k === 'media' ? { kind: 'tool', tool: 'dictate' } : { kind: 'ask', q: t(`cd.${k}Q`) };
  const run = (a: Act) => {
    if (a.kind === 'ask') onAsk(a.q);
    else if (a.kind === 'hist') onHist();
    else window.dispatchEvent(new Event(a.tool === 'attach' ? 'bd-help-attach' : 'bd-help-dictate'));
  };
  // Right now: what is waiting for them comes first, as its own suggestion.
  const now = toApprove > 0 ? t(toApprove === 1 ? 'cd.nowApprove1' : 'cd.nowApprove', { n: toApprove })
    : inProd > 0 ? t(inProd === 1 ? 'cd.nowProd1' : 'cd.nowProd', { n: inProd }) : null;
  const nowQ = toApprove > 0 ? t('cd.approveQ') : t('cd.statusQ');
  const order = toApprove > 0 ? ['approve', 'status', 'work', 'site', 'media', 'chats'] as const : CARDS.map((c) => c.k);

  return (
    <div className="cd">
      {now && (
        <button type="button" className="cd-now" onClick={() => onAsk(nowQ)}>
          <span className="cd-dot" aria-hidden="true" /><span>{now}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
      <h3 className="cd-h">{t('cd.title')}</h3>
      <div className="cd-grid">
        {order.map((k) => {
          const c = CARDS.find((x) => x.k === k)!;
          return (
            <button key={k} type="button" className="cd-card" onClick={() => run(act(k))}>
              <span className="cd-ic" aria-hidden="true">{c.icon}</span>
              <b>{t(`cd.${k}`)}</b>
              <span className="cd-try">{t(`cd.${k}Try`)}</span>
            </button>
          );
        })}
      </div>
      {client && done.length < STEPS.length && (
        <section className="cd-steps" aria-labelledby="cd-steps-t">
          <h3 id="cd-steps-t" className="cd-h">{t('cd.stepsTitle')}</h3>
          <ol>
            {STEPS.map((s) => {
              const ok = done.includes(s);
              return (
                <li key={s} className={ok ? "is-done" : ""} aria-label={`${t(`cd.step_${s}`)}: ${t(ok ? "cd.stepDone" : "cd.stepTodo")}`}>
                  <span className="cd-check" aria-hidden="true">{ok ? '✓' : ''}</span>
                  <span>{t(`cd.step_${s}`)}</span>
                </li>
              );
            })}
          </ol>
          <p className="t-xs t-mute">{t('cd.stepsHint')}</p>
        </section>
      )}
    </div>
  );
}
