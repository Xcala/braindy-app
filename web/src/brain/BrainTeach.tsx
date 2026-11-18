import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Area } from './knowledge';

/** What can be taught in words (server/src/brains/teach.ts). Logos, colors, typefaces and work come through a request. */
export type Topic = 'voice' | 'position' | 'audiences' | 'goals' | 'competitors' | 'avoid';
const GAP_TOPIC: Partial<Record<string, Topic>> = {
  'bb.gap.voice': 'voice', 'bb.gap.position': 'position', 'bb.gap.audiences': 'audiences', 'bb.gap.avoid': 'avoid', 'bb.gap.competitors': 'competitors',
};
export const AREA_TOPICS: Record<Area, Topic[]> = {
  voice: ['voice'], strategy: ['position', 'audiences', 'goals', 'competitors'], rules: ['avoid'], identity: [], work: [], talks: [],
};

/** «Lo que aún no sabe»: each gap with its way to teach it (a question in words, or a request for files). */
export function BrainGaps({ gaps, onTeach }: { gaps: StringKey[]; onTeach: (topics: Topic[]) => void }) {
  const { t } = useI18n();
  return (
    <section className="card card-tight col g12" aria-labelledby="h-bb-gaps">
      <div className="col g4"><h2 className="h3" id="h-bb-gaps">{t('bb.gaps')}</h2><p className="t-sm t-mute">{t('bb.gapsSub')}</p></div>
      {gaps.length ? (
        <ul className="bb-gaps">
          {gaps.slice(0, 8).map((g) => {
            const topic = GAP_TOPIC[g];
            return (
              <li key={g} className="row between g8 t-sm">
                <span>{t(g)}</span>
                {topic
                  ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => onTeach([topic])}>{t('bb.teach')}</button>
                  : g !== 'bb.gap.talks' && <Link to="/requests?new=1" className="btn btn-ghost btn-sm">{t('bb.teachByRequest')}</Link>}
              </li>
            );
          })}
        </ul>
      ) : <p className="t-sm t-mute">{t('bb.gapsNone')}</p>}
    </section>
  );
}

/** One short question; the answer goes into the Brand Brain and the Brains read it from the next piece on. */
export function TeachDialog({ brandId, topics, onClose }: { brandId: string; topics: Topic[]; onClose: () => void }) {
  const { t } = useI18n();
  const [topic, setTopic] = useState<Topic | undefined>(topics[0]);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  if (!topic) {
    return <ConfirmDialog title={t('bb.teach')} confirmLabel={t('bb.teachByRequest')} onCancel={onClose} onConfirm={() => { window.location.assign('/requests?new=1'); }}>{t('bb.teachFiles')}</ConfirmDialog>;
  }
  const save = async () => {
    if (text.trim().length < 2) return;
    setState('busy');
    try {
      await api(`/v1/brands/${brandId}/brain/teach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, text }) });
      onClose();
    } catch { setState('error'); }
  };
  return (
    <ConfirmDialog title={t(`bb.q.${topic}` as StringKey)} confirmLabel={t('bb.teachSave')} busy={state === 'busy' || text.trim().length < 2} onCancel={onClose} onConfirm={save}>
      <div className="col g12" style={{ color: 'var(--ink)' }}>
        {topics.length > 1 && (
          <div className="row g8 wrap" role="radiogroup" aria-label={t('bb.teach')}>
            {topics.map((x) => <button key={x} type="button" role="radio" aria-checked={x === topic} className="bb-topic" onClick={() => setTopic(x)}>{t(`bb.topic.${x}` as StringKey)}</button>)}
          </div>
        )}
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t(`bb.qd.${topic}` as StringKey)}</p>
        <textarea className="input" rows={4} maxLength={1200} value={text} onChange={(e) => setText(e.target.value)} data-autofocus aria-label={t(`bb.q.${topic}` as StringKey)} />
        <p className="t-xs t-mute" style={{ margin: 0 }}>{state === 'error' ? t('bb.teachError') : t('bb.teachNote')}</p>
      </div>
    </ConfirmDialog>
  );
}
