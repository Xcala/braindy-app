import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { dayLabel } from '../lib/dates';

type Meeting = { id: string; title: string; date: string; notes: string; source?: string; webUrl?: string | null; attendees?: string[] };
type Report = { filed?: number; unmatched?: string[]; skipped?: boolean; error?: string };
const SHOW = 5;

/** Home, NickMark only: the meeting history with this client, fed by its Granola folder; manual notes as a fallback. */
export function HomeMeetings({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const [list, setList] = useState<Meeting[]>([]);
  const [all, setAll] = useState(false);
  const [pull, setPull] = useState<'idle' | 'busy' | Report>('idle');
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'meetings'), orderBy('date', 'desc')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Meeting)), () => setList([])), [brandId]);
  // Opening the Home pulls new notes from the Granola folders (the server throttles it to every 10 minutes).
  useEffect(() => { api('/v1/admin/granola/folders', { method: 'POST', body: '{}' }).catch(() => {}); }, [brandId]);

  async function bring() {
    setPull('busy');
    try { setPull(await api<Report>('/v1/admin/granola/folders?force=1', { method: 'POST', body: '{}' })); }
    catch (e) { setPull({ error: (e as Error).message }); }
  }
  const shown = all ? list : list.slice(0, SHOW);
  return (
    <section className="col g12" aria-labelledby="h-meetings">
      <div className="row between g8 wrap">
        <div className="row g8"><h2 className="h3" id="h-meetings">{t('team.meetings')}</h2><span className="chip c-group">{t('role.admin')}</span></div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={pull === 'busy'} onClick={bring}>{pull === 'busy' ? t('mt.pulling') : t('mt.pull')}</button>
      </div>
      <p className="t-sm t-mute">{t('mt.sub')}</p>
      {typeof pull === 'object' && (
        <p className="t-xs" role="status" style={{ color: pull.error ? 'var(--danger)' : 'var(--success)' }}>
          {pull.error ?? t('mt.pulled', { filed: String(pull.filed ?? 0) })}
          {!!pull.unmatched?.length && <span className="t-mute"> · {t('mt.unmatched', { list: pull.unmatched.join(', ') })}</span>}
        </p>
      )}
      {list.length === 0 && <div className="card t-mute">{t('mt.empty')}</div>}
      {shown.map((m) => (
        <details key={m.id} className="card col" style={{ padding: '14px 18px' }}>
          <summary className="row between g12" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <span className="col g4" style={{ minWidth: 0 }}>
              <span className="w7 truncate">{m.title}</span>
              <span className="t-xs t-mute">{dayLabel(m.date, lang)}{m.attendees?.length ? ` · ${t('mt.people', { n: String(m.attendees.length) })}` : ''}</span>
            </span>
            {m.source === 'granola' && <span className="chip c-type">Granola</span>}
          </summary>
          <div className="col g8" style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <p className="t-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{m.notes.replace(/^#+\s*/gm, '').replace(/\*\*(.+?)\*\*/g, '$1')}</p>
            <div className="row g8 wrap">
              {m.webUrl && <a href={m.webUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>{t('mt.open')} ↗</a>}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => api(`/v1/admin/brands/${brandId}/brains/meetings/${m.id}`, { method: 'DELETE' })}>{t('acc.delete')}</button>
            </div>
          </div>
        </details>
      ))}
      {!all && list.length > SHOW && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setAll(true)}>{t('mt.more', { n: String(list.length - SHOW) })}</button>}
      <ManualMeeting brandId={brandId} />
    </section>
  );
}

function ManualMeeting({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api(`/v1/admin/brands/${brandId}/brains/meetings`, { method: 'POST', body: JSON.stringify({ title, date, notes }) }); setTitle(''); setNotes(''); } finally { setBusy(false); }
  }
  return (
    <details>
      <summary className="t-sm w7" style={{ cursor: 'pointer' }}>+ {t('mt.manual')}</summary>
      <form className="col g8" style={{ marginTop: 10 }} onSubmit={add}>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('team.meetingTitle')} aria-label={t('team.meetingTitle')} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('team.meetingDate')} />
        </div>
        <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('team.meetingNotesPh')} aria-label={t('team.meetingNotes')} style={{ height: 'auto', paddingTop: 10 }} />
        <button className="btn btn-primary btn-sm self-start" disabled={busy || !notes.trim()}>{t('team.meetingAdd')}</button>
      </form>
    </details>
  );
}
