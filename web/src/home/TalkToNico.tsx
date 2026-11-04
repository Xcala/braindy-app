import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { NICO_EMAIL, nicoPhone, nicoWhatsApp } from '../lib/nicoWhatsApp';
import { noticesApi } from '../review/api';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { BookMeeting } from './BookMeeting';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 6h14v14H5zM5 10h14M9 3v4M15 3v4" /></svg>
);
const TextIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 5h14v10H10l-4 4v-4H5zM9 10h6" /></svg>
);

/**
 * "Contact Nick": one button, every way to reach him, plus booking 30 minutes in his calendar. The brand's WhatsApp group first (or, without one,
 * add it as admin / ask for it as a client), then his WhatsApp, email and text message.
 */
export function TalkToNico({ brandName }: { brandName: string }) {
  const { t } = useI18n();
  const { current } = useBrands();
  const admin = useAuth().profile?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setGroup(null);
    if (current) noticesApi.get(current.id).then((s) => setGroup((s.groups ?? []).find((g) => g.url)?.url ?? null)).catch(() => setGroup(null));
  }, [current?.id]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const phone = nicoPhone(current);
  const close = () => setOpen(false);
  const ext = { target: '_blank', rel: 'noreferrer', onClick: close, role: 'menuitem', className: 'menu-item' } as const;

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn btn-primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t('home.talkNico')}<Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="menu absolute left-0 top-[52px] z-40 flex w-[min(300px,calc(100vw-32px))] flex-col gap-0.5" role="menu" aria-label={t('home.talkNico')}>
          {group
            ? <a href={group} {...ext}><span className="talk-ico is-wa"><WhatsAppIcon /></span>{t('hg.group')}</a>
            : admin
              ? <Link to="/settings?tab=notices" onClick={close} role="menuitem" className="menu-item"><span className="talk-ico is-wa"><WhatsAppIcon /></span>{t('hg.groupAdd')}</Link>
              : <a href={nicoWhatsApp(current, t('hg.groupAskText', { brand: brandName }))} {...ext}><span className="talk-ico is-wa"><WhatsAppIcon /></span>{t('hg.groupAsk')}</a>}
          <a href={nicoWhatsApp(current)} {...ext}><span className="talk-ico is-wa"><WhatsAppIcon /></span>{t('hg.waNico')}</a>
          <a href={`mailto:${NICO_EMAIL}?subject=${encodeURIComponent(`Braindy · ${brandName}`)}`} {...ext} target={undefined}><span className="talk-ico"><MailIcon /></span><span className="col"><span>{t('hg.emailNico')}</span><span className="t-xs t-mute">{NICO_EMAIL}</span></span></a>
          <a href={`sms:+${phone}`} {...ext} target={undefined}><span className="talk-ico"><TextIcon /></span><span className="col"><span>{t('hg.textNico')}</span><span className="t-xs t-mute">+{phone}</span></span></a>
          {current && (
            <button type="button" role="menuitem" className="menu-item w-full text-left" style={{ border: 0, background: undefined, cursor: 'pointer', borderTop: '1px solid var(--line)', borderRadius: 0, marginTop: 4, paddingTop: 10 }} onClick={() => { close(); setBooking(true); }}>
              <span className="talk-ico is-cal"><CalIcon /></span>{t('hg.book')}
            </button>
          )}
        </div>
      )}
      {booking && current && <BookMeeting brandId={current.id} onClose={() => setBooking(false)} />}
    </div>
  );
}
