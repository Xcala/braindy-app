import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { NetBadge, netInfo } from './PostBits';
import type { SocialPost } from './useSocialPosts';

export const TYPES = ['POST', 'REEL', 'STORY', 'CAROUSEL', 'SHORT', 'VIDEO'];

/** One post, view only: its media, copy, date and where it went out (with the link to each network). */
export function PostDetail({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  const { t, lang } = useI18n();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const when = post.date.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal cal-detail w-full max-w-[760px]" role="dialog" aria-modal="true" aria-labelledby="cal-detail-title">
        <div className="cal-detail-media">
          {post.media.length === 0 ? <div className="cal-thumb is-text">Aa</div> : post.media.map((m) => m.kind === 'video'
            ? <video key={m.url} src={m.url} controls playsInline preload="metadata" />
            : <img key={m.url} src={m.url} alt="" />)}
        </div>
        <div className="col g12 min-w-0">
          <div className="row between g8">
            <span className={`chip cal-st is-${post.status}`}>{t(`cal.st.${post.status}` as StringKey)}</span>
            <button ref={close} type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('lb.close')}>✕</button>
          </div>
          <h2 className="h3" id="cal-detail-title" style={{ margin: 0 }}>{when}</h2>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{TYPES.includes(post.type) ? t(`cal.type.${post.type}` as StringKey) : post.type}</p>
          {post.title && <p className="w7" style={{ margin: 0 }}>{post.title}</p>}
          {post.text ? <p className="t-sm cal-copy">{post.text}</p> : <p className="t-sm t-mute">{t('cal.noCopy')}</p>}
          <ul className="col g8 cal-nets">
            {post.networks.map((n, i) => (
              <li key={i} className="row g8">
                <NetBadge network={n.network} />
                <span className="t-sm w7">{netInfo(n.network).label}</span>
                <span className={`chip cal-st is-${n.status}`}>{t(`cal.st.${n.status}` as StringKey)}</span>
                {n.url && <a className="t-sm" href={n.url} target="_blank" rel="noreferrer">{t('cal.seePost')} ↗</a>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
