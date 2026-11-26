import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { STATUS_CHIP, type RequestStatus } from '../requests/types';
import { useThumbs } from '../assets/useThumbs';

/** What the assistant found with its tools (server/src/help/reads.ts ChatCard). */
export type ChatCard =
  | { kind: 'request'; ref: string; id: string; title: string; status: string; due: string | null; brain: string; versions: number }
  | { kind: 'file'; ref: string; id: string; title: string; folder: string; contentType: string }
  | { kind: 'post'; ref: string; date: string; text: string; thumb: string; networks: string[]; status: string }
  | { kind: 'change'; ref: string; key: string; title: string; status: string }
  | { kind: 'stat'; ref: string; label: string; value: number; delta: number | null };

const BRAINS = ['researcher', 'marketer', 'creator', 'builder'];
const nf = (n: number, lang: string) => n.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US');
const when = (iso: string, lang: string, time = false) => new Date(time ? iso : `${iso}T12:00:00`).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US',
  time ? { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short' });

/**
 * The cards under an assistant answer: requests, files, posts, site adjustments and numbers it looked up.
 * Each one opens the screen where the person acts (approve, download…); the chat itself changes nothing.
 */
export function ChatCards({ brandId, cards, onOpen }: { brandId: string; cards: ChatCard[]; onOpen?: () => void }) {
  const { t, lang } = useI18n();
  const images = cards.filter((c): c is Extract<ChatCard, { kind: 'file' }> => c.kind === 'file' && c.contentType.startsWith('image/'));
  const thumbs = useThumbs(brandId, images.map((f) => f.id));
  const stats = cards.filter((c): c is Extract<ChatCard, { kind: 'stat' }> => c.kind === 'stat');
  const rest = cards.filter((c) => c.kind !== 'stat');

  return (
    <div className="hc-list">
      {stats.length > 0 && (
        <div className="hc-stats">
          {stats.map((s) => (
            <div key={s.ref} className="hc-stat">
              <span className="t-xs t-mute">{s.label}</span>
              <b>{nf(s.value, lang)}</b>
              {s.delta != null && <span className={`t-xs ${s.delta >= 0 ? 'hc-up' : 'hc-down'}`}>{s.delta > 0 ? '+' : ''}{s.delta}%</span>}
            </div>
          ))}
        </div>
      )}
      {rest.map((c) => {
        if (c.kind === 'request') {
          return (
            <Link key={c.ref} to={`/requests/${c.id}`} className="hc-card" onClick={onOpen}>
              {BRAINS.includes(c.brain) && <span className={`brain b-${c.brain} hc-ico`}><img src={`/brand/brains/${c.brain}.png`} alt="" /></span>}
              <span className="hc-main">
                <b>{c.title}</b>
                <span className="row g8 wrap">
                  <span className={`chip ${STATUS_CHIP[c.status as RequestStatus] ?? ''}`}>{t(`req.status.${c.status}` as StringKey)}</span>
                  {c.due && <span className="t-xs t-mute">{t('help.cardDue', { d: when(c.due, lang) })}</span>}
                  {c.versions > 0 && <span className="t-xs t-mute">{t('help.cardVersions', { n: c.versions })}</span>}
                </span>
              </span>
            </Link>
          );
        }
        if (c.kind === 'file') {
          const src = thumbs[c.id];
          return (
            <Link key={c.ref} to={`/open/${brandId}/${c.id}`} className="hc-card" target="_blank" rel="noopener">
              <span className="hc-thumb">{src ? <img src={src} alt="" /> : <span aria-hidden="true">{(c.title.split('.').pop() ?? '').slice(0, 4).toUpperCase()}</span>}</span>
              <span className="hc-main"><b>{c.title}</b>{c.folder && <span className="t-xs t-mute">{c.folder}</span>}</span>
            </Link>
          );
        }
        if (c.kind === 'post') {
          return (
            <Link key={c.ref} to="/calendar" className="hc-card" onClick={onOpen}>
              {c.thumb ? <span className="hc-thumb"><img src={c.thumb} alt="" /></span> : null}
              <span className="hc-main">
                <span className="t-xs w7">{when(c.date, lang, true)} · {c.networks.join(', ')}</span>
                <span className="hc-text">{c.text}</span>
              </span>
            </Link>
          );
        }
        return (
          <Link key={c.ref} to="/apps" className="hc-card" onClick={onOpen}>
            <span className="hc-main">
              <b>{c.title}</b>
              <span className="row g8"><span className="t-xs t-mute">{c.key}</span><span className="chip">{t(`site.status.${c.status}` as StringKey)}</span></span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
