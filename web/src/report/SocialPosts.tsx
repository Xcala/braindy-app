import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { StatPost } from './useSocialStats';
import { NetBadge, netInfo } from '../calendar/PostBits';
import { Link } from 'react-router';
import { askMoreHref } from './askMore';

type Sort = 'views' | 'interactions' | 'reach' | 'date';
const SORTS: Sort[] = ['views', 'interactions', 'reach', 'date'];
const TYPE: Record<string, StringKey> = { reel: 'cal.type.REEL', post: 'cal.type.POST', carousel: 'cal.type.CAROUSEL', story: 'cal.type.STORY', video: 'cal.type.VIDEO', short: 'cal.type.SHORT', album: 'cal.type.CAROUSEL' };

/** The period's posts: the six best by the chosen measure as cards, and every post in a table. */
export function SocialPosts({ posts, network }: { posts: StatPost[]; network: string }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [sort, setSort] = useState<Sort>('views');
  const [all, setAll] = useState(false);
  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v));
  const day = (s: string) => new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const by = (a: StatPost, b: StatPost) => (sort === 'date' ? b.date.localeCompare(a.date) : (b[sort] ?? -1) - (a[sort] ?? -1));
  const feed = posts.filter((p) => p.type !== 'story').sort(by);
  const type = (p: StatPost) => (TYPE[p.type] ? t(TYPE[p.type]!) : p.type);
  if (!posts.length) return <div className="card t-sm t-mute">{t('soc.noPosts')}</div>;

  return (
    <div className="card col g12">
      <div className="row between g8 wrap">
        <h3 className="h3">{t('soc.best')}</h3>
        <select className="input print:hidden" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('soc.sortBy')}>
          {SORTS.map((s) => <option key={s} value={s}>{t(`soc.s.${s}` as StringKey)}</option>)}
        </select>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        {feed.slice(0, 6).map((p) => (
          <div key={p.id} className="col g6">
          <a href={p.url || undefined} target="_blank" rel="noreferrer" className="col g6" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ aspectRatio: network === 'linkedin' || network === 'youtube' ? '16 / 9' : '4 / 5', borderRadius: '0.75rem', overflow: 'hidden', background: 'var(--hielo)' }}>
              {p.image && <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <span className="t-xs t-mute row g4" style={{ alignItems: 'center' }}>{p.network && <NetBadge network={p.network} />}{type(p)} · {day(p.date)}</span>
            <span className="t-sm w7">{fmt(p.views)} {t('soc.k.views').toLowerCase()} · {fmt(p.interactions)} {t('soc.k.interactions').toLowerCase()}</span>
            {p.text && <span className="t-xs t-mute" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</span>}
          </a>
          <Link className="t-xs w7 print:hidden self-start" style={{ color: 'var(--azul)' }} to={askMoreHref(t('rp.moreText', { title: (p.text || type(p)).slice(0, 120) }), p.url)}>{t('rp.more')} →</Link>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm print:hidden" style={{ alignSelf: 'flex-start' }} aria-expanded={all} onClick={() => setAll(!all)}>
        {all ? t('soc.hideAll') : t('soc.seeAll', { n: posts.length })}
      </button>
      {all && (
        <div style={{ overflowX: 'auto' }}>
          <table className="t-sm" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '35rem' }}>
            <thead><tr className="t-xs t-mute" style={{ textAlign: 'left' }}>
              {(['soc.t.post', 'soc.k.views', 'soc.k.reach', 'soc.t.likes', 'soc.t.comments', 'soc.t.saves', 'soc.t.shares', 'soc.k.interactions'] as StringKey[]).map((k, i) => <th key={k} style={{ padding: '0.375rem 0.5rem', textAlign: i ? 'right' : 'left', fontWeight: 700 }}>{t(k)}</th>)}
            </tr></thead>
            <tbody>
              {[...posts].sort(by).map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '0.375rem 0.5rem', maxWidth: '16.25rem' }}>
                    <a href={p.url || undefined} target="_blank" rel="noreferrer" className="w7">{p.network ? `${netInfo(p.network).label} · ` : ''}{type(p)} · {day(p.date)}</a>
                    {p.text && <div className="t-xs t-mute" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.text}</div>}
                  </td>
                  {[p.views, p.reach, p.likes, p.comments, p.saves, p.shares, p.interactions].map((v, i) => <td key={i} style={{ padding: '0.375rem 0.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
