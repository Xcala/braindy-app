import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { dayLabel } from '../lib/dates';
import { MeetingNotes, topics } from './MeetingNotes';

type Meeting = { id: string; title: string; date: string; notes: string; source?: string; webUrl?: string | null; attendees?: string[]; people?: number; hidden?: boolean };
type Report = { filed?: number; unmatched?: string[]; skipped?: boolean; error?: string };
const SHOW = 5;

/**
 * Home: the meeting history with this client and its notes, fed by its Granola folder (manual notes as a fallback).
 * The client reads it through the API, without the meetings Nicolas hid; the admin reads it live and can hide, pull or delete.
 */
export function HomeMeetings({ brandId, admin }: { brandId: string; admin: boolean }) {
  const { t, lang } = useI18n();
  const [list, setList] = useState<Meeting[]>([]);
  const [all, setAll] = useState(false);
  const [pull, setPull] = useState<'idle' | 'busy' | Report>('idle');
  useEffect(() => {
    if (!admin) {
      let on = true;
      api<{ items: Meeting[] }>(`/v1/brands/${brandId}/meetings`).then((r) => on && setList(r.items)).catch(() => on && setList([]));
      return () => { on = false; };
    }
    return onSnapshot(query(collection(db, 'brands', brandId, 'meetings'), orderBy('date', 'desc')),
      (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Meeting)), () => setList([]));
  }, [brandId, admin]);
  // Opening the Home (as admin) pulls new notes from the Granola folders (the server throttles it to every 10 minutes).
  useEffect(() => { if (admin) api('/v1/admin/granola/folders', { method: 'POST', body: '{}' }).catch(() => {}); }, [brandId, admin]);

  async function bring() {
    setPull('busy');
    try { setPull(await api<Report>('/v1/admin/granola/folders?force=1', { method: 'POST', body: '{}' })); }
    catch (e) { setPull({ error: (e as Error).message }); }
  }
  // Delete waits for the toast: Undo inside those seconds keeps the meeting (the server cannot bring it back).
  const toast = useToast();
  const [gone, setGone] = useState<string[]>([]);
  function remove(m: Meeting) {
    setGone((g) => [...g, m.id]);
    const timer = window.setTimeout(() => api(`/v1/admin/brands/${brandId}/brains/meetings/${m.id}`, { method: 'DELETE' }).catch(() => setGone((g) => g.filter((x) => x !== m.id))), 6500);
    toast({ text: t('mt.deleted', { title: m.title }), undo: () => { window.clearTimeout(timer); setGone((g) => g.filter((x) => x !== m.id)); } });
  }
  const visible = list.filter((m) => !gone.includes(m.id));
  const shown = all ? visible : visible.slice(0, SHOW);
  return (
    <section className="col g12" aria-labelledby="h-meetings">
      <div className="row between g8 wrap">
        <h2 className="h3" id="h-meetings">{t(admin ? 'team.meetings' : 'hg.history')}</h2>
        {admin && <button type="button" className="btn btn-secondary btn-sm" disabled={pull === 'busy'} onClick={bring}>{pull === 'busy' ? t('mt.pulling') : t('mt.pull')}</button>}
      </div>
      <p className="t-sm t-mute">{t(admin ? 'mt.sub' : 'mt.subClient')}</p>
      {typeof pull === 'object' && (
        <p className="t-xs" role="status" style={{ color: pull.error ? 'var(--danger)' : 'var(--success)' }}>
          {pull.error ?? t('mt.pulled', { filed: String(pull.filed ?? 0) })}
          {!!pull.unmatched?.length && <span className="t-mute"> · {t('mt.unmatched', { list: pull.unmatched.join(', ') })}</span>}
        </p>
      )}
      {list.length === 0 && <div className="card t-mute">{t(admin ? 'mt.empty' : 'hg.noHistory')}</div>}
      {shown.map((m) => {
        const d = new Date(`${m.date.slice(0, 10)}T12:00:00`);
        const tps = topics(m.notes);
        return (
        <details key={m.id} className="card mcard" style={m.hidden ? { opacity: 0.6 } : undefined}>
          <summary className="mcard-s">
            <span className="mdate" aria-hidden="true">
              <b>{d.getDate()}</b><span>{d.toLocaleDateString(lang, { month: 'short' }).replace('.', '')}</span>
            </span>
            <span className="col g4 grow" style={{ minWidth: 0 }}>
              <span className="w7 truncate">{m.title}</span>
              <span className="t-xs t-mute">{dayLabel(m.date, lang)}{(m.attendees?.length ?? m.people) ? ` · ${t('mt.people', { n: String(m.attendees?.length ?? m.people) })}` : ''}{admin && m.source === 'granola' ? ' · Granola' : ''}{m.hidden ? ` · ${t('mt.hidden')}` : ''}</span>
              {tps.length > 0 && <span className="mtags">{tps.slice(0, 3).map((x) => <span key={x}>{x}</span>)}{tps.length > 3 && <span>+{tps.length - 3}</span>}</span>}
            </span>
            <span className="mchev" aria-hidden="true" />
          </summary>
          <div className="mcard-b">
            <MeetingNotes notes={m.notes} />
            {admin && <div className="row g8 wrap">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => api(`/v1/admin/brands/${brandId}/brains/meetings/${m.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !m.hidden }) })}>{t(m.hidden ? 'mt.show' : 'mt.hide')}</button>
              {m.webUrl && <a href={m.webUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>{t('mt.open')} ↗</a>}
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(m)}>{t('acc.delete')}</button>
            </div>}
          </div>
        </details>
        );
      })}
      {!all && list.length > SHOW && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setAll(true)}>{t('mt.more', { n: String(list.length - SHOW) })}</button>}
      {admin && <ManualMeeting brandId={brandId} />}
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
      <form className="col g8" style={{ marginTop: '0.625rem' }} onSubmit={add}>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('team.meetingTitle')} aria-label={t('team.meetingTitle')} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('team.meetingDate')} />
        </div>
        <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('team.meetingNotesPh')} aria-label={t('team.meetingNotes')} style={{ height: 'auto', paddingTop: '0.625rem' }} />
        <button className="btn btn-primary btn-sm self-start" disabled={busy || !notes.trim()}>{t('team.meetingAdd')}</button>
      </form>
    </details>
  );
}
