import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { KIND_COLOR } from './BrainCanvas';
import type { BrainEvent } from './useBrainEvents';
import { plainLine } from '../lib/scan';

type T = (key: StringKey, vars?: Record<string, string | number>) => string;

/** One line for an event, in the reader's language (the Mi marca, meeting and session texts are composed here). */
export function eventText(e: BrainEvent, t: T) {
  if (e.kind === 'identity' && e.parts?.includes('version')) return t('bb.txt.version', { text: e.text ?? '' });
  if (e.kind === 'identity') return t('bb.txt.identity', { parts: (e.parts ?? []).map((p) => t(`bb.part.${p}` as StringKey)).join(', ') });
  if (e.kind === 'meeting') return t('bb.txt.meeting');
  if (e.kind === 'session') return e.text ? t('bb.txt.sessionOn', { text: e.text }) : t('bb.txt.session');
  if (e.kind === 'signed') return t('bb.txt.signed');
  if (e.kind === 'file' && (e.count ?? 1) > 1) return t('bb.txt.files', { n: e.count!, text: e.text ?? '' });
  return e.text ?? '';
}

export function ago(d: Date | null, t: T) {
  if (!d) return t('bb.never');
  const m = Math.max(0, Math.round((Date.now() - +d) / 60000));
  return m < 1 ? t('bb.now') : m < 60 ? t('bb.minAgo', { n: m }) : m < 1440 ? t('bb.hAgo', { n: Math.round(m / 60) }) : t('bb.dAgo', { n: Math.round(m / 1440) });
}

/** What it learned, newest first. Items that arrive while the page is open slide in and flash. */
export function BrainFeed({ events, fresh }: { events: BrainEvent[]; fresh: Set<string> }) {
  const { t, lang } = useI18n();
  const day = (d: Date | null) => d?.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';
  return (
    <section className="card bb-feed col" aria-labelledby="h-bb-feed">
      <header className="row between g8" style={{ alignItems: 'flex-start' }}>
        <div className="col g4"><h2 className="h3" id="h-bb-feed">{t('bb.learned')}</h2><p className="t-sm t-mute">{t('bb.learnedSub')}</p></div>
        <span className="bb-live t-xs w7">{t('bb.live')}</span>
      </header>
      {events.length === 0 && <p className="t-sm t-mute" style={{ padding: '8px 4px' }}>{t('bb.empty')}</p>}
      <ul className="bb-list">
        {events.map((e) => {
          const text = eventText(e, t);
          return (
            <li key={e.id} className={`bb-item${fresh.has(e.id) ? ' is-new' : ''}`}>
              <span className="bb-chip" style={{ ['--c' as string]: KIND_COLOR[e.kind] }}>{t(`bb.kind.${e.kind}` as StringKey)}</span>
              <div className="col g4 grow">
                {e.requestId ? <Link to={`/requests/${e.requestId}`} className="t-sm bb-txt"><FeedText text={text} /></Link> : <span className="t-sm bb-txt"><FeedText text={text} /></span>}
                <span className="t-xs t-mute"><b className="w7">{t(`bb.area.${e.area}` as StringKey)}</b> · {day(e.at)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
/** An event in the feed: the request in bold, then the gist on up to three lines (no markdown, no line breaks). */
function FeedText({ text }: { text: string }) {
  const line = plainLine(text);
  const m = /^(.{2,90}?):\s+(.+)$/.exec(line);
  return m ? <><strong className="w7">{m[1]}</strong><span className="bb-gist"> · {m[2]}</span></> : <>{line}</>;
}
