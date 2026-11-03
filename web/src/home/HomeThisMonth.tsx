import { useMemo } from 'react';
import { Link } from 'react-router';
import type { Timestamp } from 'firebase/firestore';
import { useI18n } from '../i18n/I18nProvider';
import { BrainStack } from '../components/BrainStack';
import { useSocialPosts } from '../calendar/useSocialPosts';
import { useSiteChanges } from '../links/SiteChanges';
import type { ScopedRequest } from '../requests/useBrandsRequests';

type K = 'tm.delivered' | 'tm.deliveredOne' | 'tm.published' | 'tm.publishedOne' | 'tm.adjusted' | 'tm.adjustedOne';
const ms = (x?: Timestamp) => x?.toMillis?.() ?? 0;

/**
 * "The work, done": the month in three numbers, what was delivered, published and adjusted, signed by NickMark
 * with his Brains. The client sees the outcome, not the tools. Hidden while the month is still empty.
 */
export function HomeThisMonth({ brandId, requests }: { brandId: string; requests: ScopedRequest[] }) {
  const { t } = useI18n();
  const [from, to] = useMemo(() => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 1)]; }, []);
  const { posts } = useSocialPosts(brandId, from, to);
  const changes = useSiteChanges(brandId);

  const since = +from;
  const delivered = requests.filter((r) => r.status !== 'in_production' && ms(r.updatedAt) >= since).length;
  const published = posts.filter((p) => p.status === 'published').length;
  const scheduled = posts.filter((p) => p.status === 'scheduled').length;
  const adjusted = changes.filter((c) => c.status === 'delivered' && ms(c.updatedAt) >= since).length;
  if (!delivered && !published && !scheduled && !adjusted) return null;

  const all: Array<{ n: number; k: K; to: string; sub?: string }> = [
    { n: delivered, k: delivered === 1 ? 'tm.deliveredOne' : 'tm.delivered', to: '/requests' },
    { n: published, k: published === 1 ? 'tm.publishedOne' : 'tm.published', to: '/calendar', sub: scheduled ? t('tm.scheduled', { n: scheduled }) : '' },
    { n: adjusted, k: adjusted === 1 ? 'tm.adjustedOne' : 'tm.adjusted', to: '/apps' },
  ];
  const stats = all.filter((s) => s.n || s.sub);

  return (
    <section className="card col g16" aria-labelledby="h-month">
      <div className="row between g12 wrap">
        <div className="col g4">
          <p className="label">{t('tm.label')}</p>
          <h2 className="h3" id="h-month" style={{ margin: 0 }}><span className="w9">{t('tm.title')}</span></h2>
        </div>
        <BrainStack label={t('tm.sign')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.k} to={s.to} className="col g4" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <span className="w9" style={{ fontSize: 40, lineHeight: '44px', letterSpacing: '-.03em' }}>{s.n}</span>
            <span className="t-sm w7">{t(s.k)}</span>
            {s.sub && <span className="t-xs t-mute">{s.sub}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
