import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { brainName } from '../components/BrainStack';
import type { BrainId } from '../requests/taxonomy';
import { brainsApi, useInsights } from './useBrains';

const when = (lang: string, d?: Date) => d?.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';

/** Home · what the Brains noticed lately (competitor changes, group readings). */
export function InsightsCard({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const list = useInsights(brandId, undefined, 3);
  if (!list.length) return null;
  return (
    <div className="card col g12" aria-labelledby="h-insights">
      <h2 className="h3" id="h-insights">{t('brains.news')}</h2>
      {list.map((i) => (
        <div key={i.id} className="col g4" style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
          <span className="t-xs t-mute">{brainName(i.brain as BrainId)} · {when(lang, i.at?.toDate())}</span>
          <span className="t-sm w7">{i.title}</span>
          {i.body && <span className="t-sm t-mute">{i.body}</span>}
          {i.url && <a className="t-xs" href={i.url} target="_blank" rel="noreferrer">{new URL(i.url).hostname}</a>}
        </div>
      ))}
    </div>
  );
}

/** My brand · what the Brains learned from approvals and change requests. */
export function LearningsSection({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const doc = useBrandDoc(brandId, 'context/learnings');
  const items = ((doc.data?.items as Array<{ kind: string; text: string; brain?: string; at?: string }>) ?? []).slice(-8).reverse();
  if (!items.length) return null;
  return (
    <section className="col g16" aria-labelledby="h-learned">
      <div className="col g4"><h2 className="h2" id="h-learned">{t('brains.learned')}</h2><p className="t-sm t-mute">{t('brains.learnedSub')}</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((l, i) => (
          <div key={i} className="card card-tight col g4">
            <span className={`chip self-start ${l.kind === 'liked' ? 'c-approved' : 'c-approve'}`}>{t(l.kind === 'liked' ? 'brains.liked' : 'brains.changed')}</span>
            <span className="t-sm">{l.text}</span>
            <span className="t-xs t-mute">{[l.brain && brainName(l.brain as BrainId), l.at && when(lang, new Date(l.at))].filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Group overview · the Researcher reads every brand of the group together (owners and admin can ask). */
export function GroupAnalysis({ groupId, canAsk }: { groupId: string; canAsk: boolean }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const last = useInsights(groupId, 'group_analysis', 1)[0];
  const ask = async () => { setBusy(true); setError(false); try { await brainsApi.analyzeGroup(groupId); } catch { setError(true); } finally { setBusy(false); } };
  return (
    <div className="card col g12">
      <div className="row between g8 wrap">
        <div className="col"><h3 className="h3">{t('brains.groupTitle')}</h3><span className="t-xs t-mute">{last ? `${t('brains.byResearcher')} · ${when(lang, last.at?.toDate())}` : t('brains.groupSub')}</span></div>
        {canAsk && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={ask}>{busy ? t('brains.analyzing') : last ? t('brains.analyzeAgain') : t('brains.analyze')}</button>}
      </div>
      {last && (
        <>
          <p className="t-sm w7">{last.title}</p>
          {(last.insights ?? []).map((s, i) => <p key={i} className="t-sm" style={{ borderLeft: '3px solid var(--line)', paddingLeft: 10 }}>{s}</p>)}
          {(last.opportunities ?? []).length > 0 && <p className="label">{t('brains.opportunities')}</p>}
          {(last.opportunities ?? []).map((s, i) => <p key={i} className="t-sm" style={{ borderLeft: '3px solid #8B5CF6', paddingLeft: 10 }}>{s}</p>)}
        </>
      )}
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('brains.error')}</p>}
    </div>
  );
}
