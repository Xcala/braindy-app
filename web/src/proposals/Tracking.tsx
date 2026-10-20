import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { fmtWhen } from './ActivityLine';
import { useEvents, useSends } from './useProposals';
import { SECTION_KEYS, type Send } from './types';
import type { StringKey } from '../i18n/strings';

const minutes = (s: number) => (s < 60 ? `${s} s` : `${Math.round(s / 60)} min`);
const gap = (a?: Date, b?: Date) => {
  if (!a || !b) return '';
  const h = (b.getTime() - a.getTime()) / 3_600_000;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} d`;
};

export function Tracking({ id }: { id: string }) {
  const { t } = useI18n();
  const sends = useSends(id);
  return (
    <section className="card col g20" aria-labelledby="ptrack">
      <div className="row between"><h2 className="h3" id="ptrack">{t('proposals.tracking')}</h2><span className="t-sm t-mute">{t('proposals.perSend')}</span></div>
      {sends.length === 0 ? <p className="t-sm t-mute">{t('proposals.noSends')}</p> : sends.map((s) => <SendCard key={s.id} proposalId={id} send={s} />)}
    </section>
  );
}

function SendCard({ proposalId, send }: { proposalId: string; send: Send }) {
  const { t, lang } = useI18n();
  const events = useEvents(proposalId, send.id);
  const sentAt = send.createdAt?.toDate();
  const opens = events.filter((e) => e.type === 'open');
  const section = (n: number) => t(`proposals.section.${SECTION_KEYS[Math.min(n, SECTION_KEYS.length - 1)]}` as StringKey);

  return (
    <div className="col g12" style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
      <div className="row between g8 wrap">
        <span className="row g8"><Icon name={send.channel === 'link' ? 'link' : 'external'} /><span className="w7">{t(`proposals.sendTo.${send.channel}`, { to: send.to || '—' })}</span></span>
        <span className={`chip ${send.opens ? 'c-sent' : 'c-draft'}`}>{t('proposals.opens', { n: send.opens })}</span>
      </div>
      <div className="tl">
        <Item on icon="arrowLeft" title={t(`proposals.sentBy.${send.channel}`)} meta={fmtWhen(sentAt, lang)} />
        {opens.map((e, i) => (
          <Item key={e.id} ok icon="search"
            title={i === 0 ? t('proposals.openedAfter', { gap: gap(sentAt, e.at?.toDate()) }) : t('proposals.openedAgain')}
            meta={[fmtWhen(e.at?.toDate(), lang), e.seconds ? t('proposals.viewing', { time: minutes(e.seconds) }) : '', e.maxSection ? t('proposals.readTo', { section: section(e.maxSection) }) : '', e.device ? t(`proposals.device.${e.device}` as StringKey) : ''].filter(Boolean).join(' · ')} />
        ))}
        {events.filter((e) => e.type === 'accepted').map((e) => (
          <Item key={e.id} ok icon="check" title={t('proposals.acceptedBy', { name: e.name ?? '' })} meta={fmtWhen(e.at?.toDate(), lang)} />
        ))}
        {!opens.length && <Item icon="search" muted title={t('proposals.notOpened')} meta={t('proposals.followUp')} />}
      </div>
    </div>
  );
}

function Item({ title, meta, icon, on, ok, muted }: { title: string; meta?: string; icon: 'arrowLeft' | 'search' | 'check'; on?: boolean; ok?: boolean; muted?: boolean }) {
  return (
    <div className="tl-item">
      <span className={`tl-dot ${on ? 'on' : ok ? 'ok' : ''}`}><Icon name={icon} size={14} /></span>
      <div className="col g4"><span className="w7" style={muted ? { color: 'var(--graphite)' } : undefined}>{title}</span>{meta && <span className="t-sm t-mute">{meta}</span>}</div>
    </div>
  );
}
