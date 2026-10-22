import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import type { BrainId } from '../requests/taxonomy';

const ORDER: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** NickMark only: what each Brain brought to the team meeting before the plan. */
export function TeamNotes({ notes }: { notes: Partial<Record<BrainId, string>> & { ai?: boolean } }) {
  const { t } = useI18n();
  return (
    <details className="col g8" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <summary className="t-sm w7" style={{ cursor: 'pointer' }}>{t('team.notes')} <span className="t-xs t-mute">· {t(notes.ai ? 'brains.proposedAi' : 'brains.proposedBasic')}</span></summary>
      <div className="col g8" style={{ marginTop: 10 }}>
        {ORDER.filter((b) => notes[b]).map((b) => (
          <div key={b} className="row g12" style={{ alignItems: 'flex-start' }}>
            <span className={`brain b-${b}`} style={{ width: 32, height: 32, flex: 'none' }}><img src={`/brand/brains/${b}.png`} alt="" /></span>
            <span className="col"><span className="t-xs w7">{brainName(b)}</span><span className="t-sm">{notes[b]}</span></span>
          </div>
        ))}
      </div>
    </details>
  );
}

type Meeting = { id: string; title: string; date: string; notes: string; source?: string };

/** NickMark only: meetings with the client. Their notes become team memory for the four Brains. */
export function MeetingsCard({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [list, setList] = useState<Meeting[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'meetings'), orderBy('date', 'desc')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Meeting)), () => setList([])), [brandId]);
  const base = `/v1/admin/brands/${brandId}/brains/meetings`;
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api(base, { method: 'POST', body: JSON.stringify({ title, date, notes }) }); setTitle(''); setNotes(''); } finally { setBusy(false); }
  }
  return (
    <section className="card col g12" style={{ borderStyle: 'dashed' }} aria-labelledby="h-meetings">
      <div className="row between g8 wrap"><h2 className="h3" id="h-meetings">{t('team.meetings')}</h2><span className="chip c-group">{t('role.admin')}</span></div>
      <p className="t-sm t-mute">{t('team.meetingsSub')}</p>
      <form className="col g8" onSubmit={add}>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('team.meetingTitle')} aria-label={t('team.meetingTitle')} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('team.meetingDate')} />
        </div>
        <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('team.meetingNotesPh')} aria-label={t('team.meetingNotes')} style={{ height: 'auto', paddingTop: 10 }} />
        <button className="btn btn-primary btn-sm self-start" disabled={busy || !notes.trim()}>{t('team.meetingAdd')}</button>
      </form>
      {list.map((m) => (
        <details key={m.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
          <summary className="row between g8 t-sm" style={{ cursor: 'pointer' }}><span><b>{m.title}</b> <span className="t-mute">· {m.date}</span></span></summary>
          <p className="t-sm" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{m.notes}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => api(`${base}/${m.id}`, { method: 'DELETE' })}>{t('acc.delete')}</button>
        </details>
      ))}
    </section>
  );
}
