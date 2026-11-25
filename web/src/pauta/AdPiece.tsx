import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Ad, Creative, Format } from './usePauta';

const ORDER: Format[] = ['vertical', 'feed', 'horizontal', 'chat', 'text', 'audio'];
const host = (u?: string) => { try { return u ? new URL(u).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };

/**
 * The real piece of an ad, seen the way it shows: vertical (stories, reels, TikTok), feed, horizontal, the sponsored card
 * inside a chat (ChatGPT, Perplexity) or a search result (text only). A row of buttons switches between the formats it has.
 */
export function AdPiece({ ad, urls }: { ad: Ad; urls: Record<string, string> }) {
  const { t } = useI18n();
  const formats = ORDER.filter((f) => (f === 'text' ? !!(ad.text.headlines?.length || (!ad.creatives.length && ad.text.headline)) : ad.creatives.some((c) => c.format === f)));
  const [fmt, setFmt] = useState<Format>(formats[0] ?? 'feed');
  const cr = ad.creatives.find((c) => c.format === fmt) ?? ad.creatives[0];

  return (
    <div className="col g8">
      {formats.length > 1 && (
        <div className="pa-fmts" role="group" aria-label={t('pa.formats')}>
          {formats.map((f) => <button key={f} type="button" className={fmt === f ? 'is-on' : ''} aria-pressed={fmt === f} onClick={() => setFmt(f)}>{t(`pa.f.${f}`)}</button>)}
        </div>
      )}
      {fmt === 'text' ? <SearchAd ad={ad} /> : fmt === 'chat' ? <ChatAd ad={ad} cr={cr} urls={urls} /> : (
        <div className={`pa-frame is-${fmt}`}>{cr ? <Media cr={cr} urls={urls} label={ad.name} /> : <span className="t-xs t-mute">{t('pa.noPiece')}</span>}</div>
      )}
    </div>
  );
}

function Media({ cr, urls, label }: { cr: Creative; urls: Record<string, string>; label: string }) {
  const src = urls[cr.path];
  if (!src) return <span className="pa-loading" aria-hidden="true" />;
  if (cr.kind === 'video') return <video src={src} poster={cr.thumbPath ? urls[cr.thumbPath] : undefined} controls playsInline preload="metadata" aria-label={label} />;
  return <img src={src} alt={label} loading="lazy" />;
}

/** A search ad: «Sponsored», the site, the headlines joined as the search engine shows them, the description. */
function SearchAd({ ad }: { ad: Ad }) {
  const { t } = useI18n();
  const heads = ad.text.headlines?.length ? ad.text.headlines.slice(0, 3).join(' | ') : ad.text.headline;
  const desc = ad.text.descriptions?.[0] ?? ad.text.description;
  return (
    <div className="pa-search">
      <span className="t-xs w7">{t('pa.sponsored')}</span>
      <span className="t-xs t-mute">{host(ad.text.link)}</span>
      <b>{heads}</b>
      {desc && <p>{desc}</p>}
    </div>
  );
}

/** A sponsored card inside an AI chat (ChatGPT, Perplexity): the answer above, the card below it. */
function ChatAd({ ad, cr, urls }: { ad: Ad; cr?: Creative; urls: Record<string, string> }) {
  const { t } = useI18n();
  return (
    <div className="pa-chat">
      <span className="pa-chat-answer" aria-hidden="true" />
      <span className="pa-chat-answer is-short" aria-hidden="true" />
      <div className="pa-chat-card">
        <span className="t-xs t-mute">{t('pa.sponsored')} · {host(ad.text.link)}</span>
        {cr && <div className="pa-chat-img"><Media cr={cr} urls={urls} label={ad.name} /></div>}
        {ad.text.headline && <b>{ad.text.headline}</b>}
        {(ad.text.description || ad.text.primary) && <p>{ad.text.description || ad.text.primary}</p>}
        {ad.text.cta && <span className="pa-cta">{ad.text.cta}</span>}
      </div>
    </div>
  );
}
