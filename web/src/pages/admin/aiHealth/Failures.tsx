import { errorLabel } from '../../../costs/useAiHealth';
import type { StringKey } from '../../../i18n/strings';
import { RequestLink, useFmt, type Failure } from './kit';

/** Counts per name, most first: «Sanuteam (2), Milohas (1)». */
const tally = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1]).map(([x, n]) => (n > 1 ? `${x} (${n})` : x)).join(', ');

/** SA1: failures grouped by cause; each group says how many, where, and whether you must act. A tap opens its failures (SA4: each to its request). */
export function Failures({ errors, failed, calls, period }: { errors: Failure[]; failed: number; calls: number; period: string }) {
  const f = useFmt();
  const { t } = f;
  if (!failed) return <div className="ast-note is-ok" role="status">✓ {t('aih.noFail', { p: period })}</div>;

  const groups = new Map<StringKey, Failure[]>();
  for (const e of errors) { const k = errorLabel(e.error); groups.set(k, [...(groups.get(k) ?? []), e]); }
  const list = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  return (
    <section className="col g8" aria-label={t('aih.failHead', { n: failed, p: period, pct: f.pct(failed, calls) })}>
      <h2 className="h3">{t('aih.failHead', { n: failed, p: period, pct: f.pct(failed, calls) })}</h2>
      <div className="ast-list">
        {list.map(([label, items]) => {
          const doKey = label.replace('aih.e.', 'aih.do.') as StringKey;
          return (
            <details key={label} className="ast-group">
              <summary className="ast-item" style={{ borderBottom: 0 }}>
                <div className="ast-top"><span className="ast-fail">{t(label)}</span><span>{items.length}</span></div>
                <span className="ast-sub">{t(doKey)}</span>
                <span className="ast-sub">{tally(items.map((e) => f.kind(e.kind)))} · {tally(items.map((e) => f.brand(e.brandId)))} · {t('aih.last', { when: f.when(items[0]!.at) })}</span>
              </summary>
              <div className="ast-in">
                {items.map((e, i) => (
                  <div key={`${e.at}-${i}`}>
                    <span className="col" style={{ minWidth: 0 }}>
                      <span className="w7">{f.kind(e.kind)} · {f.brand(e.brandId)}</span>
                      <span className="t-xs t-mute">{f.when(e.at)} · {t('aih.tries', { n: e.attempts })}</span>
                    </span>
                    <RequestLink requestId={e.requestId} brandId={e.brandId} label={t('aih.seeRequest')} />
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
