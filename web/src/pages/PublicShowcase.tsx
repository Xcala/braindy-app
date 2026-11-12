import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { publicShareApi, type PublicBrand, type ShowcaseItem } from '../share/api';
import '../share/share.css';

/** Showcase (idea from Air): the work a brand approved, read-only, to show it to a boss or partners. No login. */
export function PublicShowcase() {
  const { token = '' } = useParams();
  const { t, lang } = useI18n();
  const [data, setData] = useState<{ brand: PublicBrand; items: ShowcaseItem[] } | null>(null);
  const [gone, setGone] = useState(false);
  useEffect(() => { publicShareApi.showcase(token).then(setData, () => setGone(true)); }, [token]);
  const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  return (
    <div className="pub-page">
      <header className="row between g12 pub-head">
        <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: '1.5rem' }} />
        <LangToggle />
      </header>
      <main className="pub-main is-wide">
        {gone ? <div className="card"><p className="h3">{t('sh.gone')}</p></div> : !data ? <div className="skel" style={{ height: '26.25rem' }} /> : (
          <div className="col g24">
            <div className="row g12">
              {data.brand.logoUrl && <img src={data.brand.logoUrl} alt="" className="pub-logo" />}
              <div className="col g4">
                <h1 className="h1" style={{ margin: 0 }}><span className="w9">{data.brand.name}</span></h1>
                <p className="t-mute" style={{ margin: 0 }}>{t('sh.pageLead')}</p>
              </div>
            </div>
            {data.items.length === 0 && <p className="t-mute">{t('sh.empty')}</p>}
            <div className="sh-grid">
              {data.items.map((it) => {
                const [first, ...rest] = it.files;
                return (
                  <article key={it.id} className="card sh-card">
                    <div className="sh-media">
                      {first.contentType.startsWith('video/') ? <video src={first.url} controls preload="metadata" />
                        : first.contentType === 'application/pdf' ? <iframe src={first.url} title={first.name} />
                        : <img src={first.url} alt={first.name} loading="lazy" />}
                    </div>
                    {rest.some((f) => f.contentType.startsWith('image/')) && (
                      <div className="sh-thumbs">
                        {rest.filter((f) => f.contentType.startsWith('image/')).slice(0, 4).map((f) => <a key={f.url} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} loading="lazy" /></a>)}
                      </div>
                    )}
                    <div className="col g4" style={{ padding: '0.875rem 1rem' }}>
                      <h2 className="h3" style={{ margin: 0 }}>{it.title}</h2>
                      <span className="t-xs t-mute">{[day(it.approvedAt) && t('sh.approvedOn', { date: day(it.approvedAt) }), it.total > 1 && t('sh.files', { n: it.total })].filter(Boolean).join(' · ')}</span>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="t-sm t-mute">{t('sh.madeBy')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
