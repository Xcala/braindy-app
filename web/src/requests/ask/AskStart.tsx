import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { dateLabel } from '../../lib/dates';
import { useSocialPosts } from '../../calendar/useSocialPosts';
import { INTENTS, ideasFor, intentForCategory, type Answers } from './intents';
import type { BrandRequest } from '../types';

export type Seed = { intent: string; answers: Answers; text: string; category?: string; sub?: string; formatType?: string; links?: string[] };

/**
 * First step of "New request": no blank box. Five intents to tap, up to three ideas made from the brand's own
 * calendar and season, and the last delivered pieces to ask for again. "Write it directly" skips all of it.
 */
export function AskStart({ brandId, list, onPick }: { brandId: string; list: BrandRequest[]; onPick: (s: Seed) => void }) {
  const { t, lang } = useI18n();
  const [from, to, now] = useMemo(() => { const n = new Date(); return [new Date(+n - 60 * 864e5), new Date(+n + 14 * 864e5), n]; }, []);
  const { posts } = useSocialPosts(brandId, from, to);
  const ideas = ideasFor({ now, lang, postedRecently: posts.filter((p) => p.date < now).length, scheduledSoon: posts.filter((p) => p.date >= now).length });
  const delivered = list.filter((r) => (r.status === 'approved' || r.status === 'published') && !r.archived)
    .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0))
    .filter((r, i, all) => all.findIndex((x) => x.title === r.title) === i).slice(0, 3);
  const repeat = (r: BrandRequest) => onPick({
    intent: intentForCategory(r.category), answers: {}, category: r.category, sub: r.subcategory, formatType: r.formatType,
    text: t('as.repeatText', { title: r.title }), links: [`${window.location.origin}/requests/${r.id}`],
  });

  return (
    <div className="col g24">
      <div className="col g12" data-tour="ask-what">
        <p className="label" style={{ margin: 0 }}>{t('as.intentsLabel')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTENTS.map((i) => (
            <button key={i.id} type="button" className="ask-intent" onClick={() => onPick({ intent: i.id, answers: {}, text: '' })}>
              <span className="ask-intent-ico"><Icon name={i.icon} /></span>
              <span className="col min-w-0"><span className="w7">{i.label[lang]}</span><span className="t-xs t-mute">{i.sub[lang]}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div className="col g12">
        <p className="label" style={{ margin: 0 }}>{t('as.ideasLabel')}</p>
        {ideas.map((d) => (
          <button key={d.id} type="button" className="ask-idea" onClick={() => onPick({ intent: d.intent, answers: d.answers, text: d.text[lang] })}>
            <Icon name="spark" size={16} />
            <span className="col grow min-w-0"><span className="t-sm w7">{d.title[lang]}</span><span className="t-xs t-mute">{d.sub[lang]}</span></span>
            <Icon name="chevronRight" size={16} />
          </button>
        ))}
      </div>

      {delivered.length > 0 && (
        <div className="col g8">
          <p className="label" style={{ margin: 0 }}>{t('as.repeatLabel')}</p>
          {delivered.map((r) => (
            <button key={r.id} type="button" className="ask-idea" onClick={() => repeat(r)}>
              <Icon name="repeat" size={16} />
              <span className="col grow min-w-0"><span className="t-sm w7 truncate">{r.title}</span><span className="t-xs t-mute">{t('rr.deliveredOn', { day: dateLabel((r.approvedAt ?? r.updatedAt)?.toDate(), lang) })}</span></span>
              <span className="t-xs w7" style={{ color: 'var(--azul)' }}>{t('as.repeat')}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => onPick({ intent: '', answers: {}, text: '' })}>{t('as.direct')}</button>
    </div>
  );
}
