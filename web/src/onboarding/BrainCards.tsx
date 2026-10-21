import { useI18n } from '../i18n/I18nProvider';
import type { BrainDraft } from './api';
import type { StringKey } from '../i18n/strings';

type TextKey = 'voice' | 'audiences' | 'lookAndFeel' | 'goals' | 'avoid' | 'position' | 'criterio';
const CARDS: Array<{ key: TextKey; title: StringKey; source: StringKey; adminOnly?: boolean }> = [
  { key: 'voice', title: 'ob.b.voice', source: 'ob.b.fromAnswers' },
  { key: 'audiences', title: 'ob.b.audiences', source: 'ob.b.fromAnswers' },
  { key: 'lookAndFeel', title: 'ob.b.look', source: 'ob.b.fromFiles' },
  { key: 'goals', title: 'ob.b.goals', source: 'ob.b.fromAnswers' },
  { key: 'avoid', title: 'ob.b.avoid', source: 'ob.b.fromAnswers' },
  { key: 'position', title: 'ob.b.position', source: 'ob.b.nicolasWrites', adminOnly: true },
  { key: 'criterio', title: 'ob.b.criterio', source: 'ob.b.everyPiece', adminOnly: true },
];

/** Brand Brain cards (design 17 day 1 / 18). Read-only for clients; editable for Nicolas before signing. */
export function BrainCards({ brain, onChange }: { brain: BrainDraft; onChange?: (d: BrainDraft) => void }) {
  const { t } = useI18n();
  const edit = !!onChange;
  const comps = brain.competitors ?? [];
  const setComp = (i: number, k: 'name' | 'promise' | 'price' | 'url', v: string) =>
    onChange?.({ ...brain, competitors: comps.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CARDS.filter((c) => edit || !c.adminOnly || brain[c.key]).map((c) => (
        <div key={c.key} className="card col g8" style={{ padding: 22 }}>
          <div className="row between g8"><h3 className="h3">{t(c.title)}</h3><span className="t-xs t-mute">{t(c.source)}</span></div>
          {edit
            ? <textarea className="input" rows={4} value={brain[c.key] ?? ''} onChange={(e) => onChange!({ ...brain, [c.key]: e.target.value })} aria-label={t(c.title)} style={{ height: 'auto', paddingTop: 10 }} />
            : <p className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>{brain[c.key] || <span className="t-mute">{t('ob.b.empty')}</span>}</p>}
        </div>
      ))}
      <div className="card col g8 md:col-span-2" style={{ padding: 22 }}>
        <div className="row between g8"><h3 className="h3">{t('ob.b.competitors')}</h3><span className="t-xs t-mute">{t('ob.b.researcherRead')}</span></div>
        <div className="table overflow-x-auto">
          <div className="trow head label min-w-[480px]" style={{ gridTemplateColumns: edit ? '1fr 1.4fr 1fr 1.2fr' : '1fr 1.4fr 1fr' }}><span>{t('ob.b.name')}</span><span>{t('ob.b.promise')}</span><span>{t('ob.b.price')}</span>{edit && <span>{t('brains.site')}</span>}</div>
          {comps.length === 0 && <p className="t-sm t-mute" style={{ padding: 12 }}>{t('ob.b.empty')}</p>}
          {comps.map((c, i) => (
            <div key={i} className="trow min-w-[480px]" style={{ gridTemplateColumns: edit ? '1fr 1.4fr 1fr 1.2fr' : '1fr 1.4fr 1fr' }}>
              {(edit ? ['name', 'promise', 'price', 'url'] as const : ['name', 'promise', 'price'] as const).map((k) => edit
                ? <input key={k} className="input" style={{ height: 36 }} value={c[k] ?? ''} placeholder={k === 'url' ? 'https://' : undefined} onChange={(e) => setComp(i, k, e.target.value)} aria-label={`${k === 'url' ? t('brains.site') : t(`ob.b.${k}`)} ${i + 1}`} />
                : <span key={k} className="t-sm">{c[k] || '—'}</span>)}
            </div>
          ))}
        </div>
        {edit && <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange!({ ...brain, competitors: [...comps, { name: '', promise: '', price: '' }] })}>{t('ob.b.addCompetitor')}</button>}
      </div>
    </div>
  );
}
