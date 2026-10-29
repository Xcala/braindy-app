import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { BrainId } from '../requests/taxonomy';
import type { WorkItem } from '../team/useWork';
import { SEATS, type SeatId } from './geometry';
import { closeNote, sign, writeTo, type SeatView } from './useStudio';

export const SEAT_NAME: Record<SeatId, string> = { nico: 'NicoMarca', researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** The card next to a zoomed-in seat: what they are doing, their queue, and the two actions: sign and write. */
export function FocusCard({ id, view, open, allItems, readOnly = false, stateLabel }: { id: SeatId; view: SeatView; open: boolean; allItems: WorkItem[]; readOnly?: boolean; stateLabel?: string }) {
  const { t } = useI18n();
  const { brands, select } = useBrands();
  // On a client's home every item is their own brand, so the brand name is left out.
  const brand = (bid?: string) => (readOnly ? '' : brands.find((b) => b.id === bid)?.name ?? '');
  const withBrand = (title: string, bid?: string) => (readOnly ? title : `${title} · ${brand(bid)}`);
  const [tab, setTab] = useState<'work' | 'write'>('work');
  const isNico = id === 'nico';

  const openLink = (i: WorkItem) => (
    <Link to={`/requests/${i.id}`} onClick={() => select(i.brandId)} className="sd-btn ghost" style={{ textDecoration: 'none' }}>{t('st.open')}</Link>
  );

  return (
    <aside className={`sd-focus ${SEATS[id].card}`} aria-hidden={!open} aria-live="polite">
      <div className="row" style={{ borderBottom: 0, padding: 0 }}>
        <div className="flex items-center gap-2.5">
          <i style={{ width: 12, height: 12, borderRadius: '50%', background: SEATS[id].c }} />
          <div className="flex flex-col"><h3>{SEAT_NAME[id]}</h3><span className="lbl">{t(`st.role.${id}` as StringKey)}</span></div>
        </div>
      </div>
      {!readOnly && <div className="sd-seg" role="group">
        <button type="button" className={tab === 'work' ? 'on' : ''} onClick={() => setTab('work')}>{isNico ? t('st.sign') : t('st.queue')}</button>
        <button type="button" className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>{t('st.write')}</button>
      </div>}

      {tab === 'work' && <>
        {!isNico && <div className="now">
          <span className="lbl">{stateLabel ?? t(`st.state.${view.state}` as StringKey)}</span>
          <div>{view.now ? withBrand(view.now.title, view.now.brandId) : t('st.nothing')}</div>
        </div>}
        <span className="lbl">{isNico ? t(readOnly ? 'st.reviewQueue' : 'st.signQueue') : t('st.queue')}</span>
        {view.queue.length === 0 && <span style={{ color: '#8F98B2' }}>{t('st.nothing')}</span>}
        {view.queue.slice(0, 6).map((i) => (
          <div className="row" key={i.brandId + i.id}>
            <span className="min-w-0">{withBrand(i.title, i.brandId)}<br />
              <small>{isNico ? (i.stage === 'plan' ? t('st.plan') : t('st.version', { n: i.versionCount ?? 1 })) : i.dueDate ?? ''}</small></span>
            {isNico && !readOnly ? <SignButton i={i} fallback={openLink(i)} /> : openLink(i)}
          </div>
        ))}
        {!isNico && !readOnly && view.notes.length > 0 && <>
          <span className="lbl">{t('st.notes')}</span>
          {view.notes.map((n) => (
            <div className="row" key={n.id}><span className="min-w-0">{n.text}<br /><small>{brand(n.brandId)}</small></span>
              <button type="button" className="sd-btn ghost" onClick={() => closeNote(n.id)}>{t('st.done')}</button></div>
          ))}
        </>}
      </>}

      {tab === 'write' && !readOnly && <WriteBox to={isNico ? null : (id as BrainId)} items={isNico ? allItems : view.queue} brandOf={brand} />}
    </aside>
  );
}

function SignButton({ i, fallback }: { i: WorkItem; fallback: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  if (i.stage === 'plan' && !(i.plan?.scope?.length)) return <span title={t('st.noPlan')}>{fallback}</span>;
  if (state === 'done') return <span className="sd-btn ok">{t('st.signed')}</span>;
  return (
    <button type="button" className="sd-btn" disabled={state === 'busy'} title={state === 'error' ? t('st.signErr', { e: '' }) : undefined}
      onClick={async () => { setState('busy'); try { await sign(i); setState('done'); } catch { setState('error'); } }}>
      {state === 'error' ? '!' : t('st.sign')}
    </button>
  );
}

function WriteBox({ to, items, brandOf }: { to: BrainId | null; items: WorkItem[]; brandOf: (id?: string) => string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [brain, setBrain] = useState<BrainId>(to ?? 'creator');
  const [req, setReq] = useState('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');
  const target = to ?? brain;
  const picked = items.find((i) => i.brandId + '/' + i.id === req);

  async function send() {
    if (!user || !text.trim()) return;
    await writeTo(target, picked?.brandId ?? '', text, user.uid, picked?.id);
    setText(''); setSent(t('st.sent', { name: SEAT_NAME[target] }));
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="lbl">{t('st.writeTo', { name: SEAT_NAME[target] })}</span>
      {!to && (
        <select aria-label={t('st.brain')} value={brain} onChange={(e) => setBrain(e.target.value as BrainId)}>
          {BRAINS.map((b) => <option key={b} value={b}>{SEAT_NAME[b]}</option>)}
        </select>
      )}
      <select aria-label={t('st.request')} value={req} onChange={(e) => setReq(e.target.value)}>
        <option value="">{t('st.general')}</option>
        {items.map((i) => <option key={i.brandId + i.id} value={i.brandId + '/' + i.id}>{i.title} · {brandOf(i.brandId)}</option>)}
      </select>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSent(''); }} placeholder={t('st.writePh')} maxLength={2000} />
      <div className="flex items-center justify-between gap-2">
        <span style={{ color: '#7FD3A8' }}>{sent}</span>
        <button type="button" className="sd-btn" disabled={!text.trim()} onClick={send}>{t('st.send')}</button>
      </div>
    </div>
  );
}
