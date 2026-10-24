import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { BrandMark } from '../brands/BrandMark';
import { publicReviewApi, type PublicReview as Data } from '../review/api';

const BRAIN: Record<string, string> = { researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
const isImage = (t?: string) => !!t && t.startsWith('image/');

/** Review by link (design 31): one delivery, one person, approve or ask for changes. No login. */
export function PublicReview() {
  const { token = '' } = useParams();
  const { t, lang } = useI18n();
  const [data, setData] = useState<Data | null>(null);
  const [fail, setFail] = useState<'not_found' | 'expired' | null>(null);
  const [changes, setChanges] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'approved' | 'changes_requested' | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    publicReviewApi.load(token).then(setData).catch((e: { status?: number }) => setFail(e.status === 410 ? 'expired' : 'not_found'));
  }, [token]);

  async function decide(state: 'approved' | 'changes_requested') {
    setBusy(true); setError(false);
    try { await publicReviewApi.decide(token, state, note.trim()); setDone(state); }
    catch { setError(true); } finally { setBusy(false); }
  }

  const shell = (body: React.ReactNode) => (
    <div className="min-h-full" style={{ background: 'var(--niebla)' }}>
      <header className="row between g12" style={{ padding: '16px 20px' }}>
        <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: 24 }} />
        <LangToggle />
      </header>
      <main className="mx-auto col g20 w-full max-w-[720px] px-4 pb-16">{body}</main>
    </div>
  );

  if (fail) return shell(<div className="card col g8"><h1 className="h2">{t(fail === 'expired' ? 'rev.expired' : 'rev.notFound')}</h1><p className="t-mute">{t('rev.askNew')}</p></div>);
  if (!data) return shell(<p className="t-mute" aria-busy="true">{t('common.loading')}…</p>);

  const until = new Date(data.expiresAt).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric' });
  const decided = done ?? (data.used ? data.version.approval?.state : null);
  const brain = BRAIN[data.version.brain ?? data.request.leadBrain] ?? 'Braindy';

  return shell(
    <>
      <p className="t-xs t-mute" role="note">{t('rev.scope', { date: until })}</p>
      <div className="row g12"><span className="sel" style={{ border: 0, padding: 0, height: 'auto', background: 'none' }}><BrandMark brand={data.brand} /></span><span className="w7">{data.brand.name}</span></div>
      <div className="col g4">
        <h1 className="h1">{data.request.title}</h1>
        <p className="t-mute">{t('home.version', { n: data.version.n })} · {data.request.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain })}</p>
      </div>
      <div className="col g12">
        {data.version.files.map((f, i) => f.url && isImage(f.contentType)
          ? <img key={i} src={f.url} alt={f.name} className="w-full rounded-2xl" style={{ background: '#fff' }} />
          : <a key={i} className="card row between g12" href={f.url ?? '#'} target="_blank" rel="noreferrer"><span className="w7 truncate">{f.name}</span><span className="t-sm">{t('rev.openFile')}</span></a>)}
      </div>
      {data.version.notes && <p className="t-sm">{data.version.notes}</p>}
      {data.version.reason && (
        <div className="card col g4"><p className="label">{t('req.whyItWorks')}</p><p className="t-sm">{data.version.reason}</p></div>
      )}
      {decided ? (
        <div className="card col g8" role="status">
          <h2 className="h3">{t(decided === 'approved' ? 'rev.doneApproved' : 'rev.doneChanges')}</h2>
          <p className="t-sm t-mute">{t('rev.doneBody')}</p>
        </div>
      ) : changes ? (
        <div className="card col g12">
          <label className="field"><span className="w7">{t('rev.whatToChange')}</span>
            <textarea className="input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} style={{ height: 'auto', paddingTop: 10 }} autoFocus /></label>
          <div className="row g12 wrap">
            <button className="btn btn-primary" disabled={busy || !note.trim()} onClick={() => decide('changes_requested')}>{t('rev.sendChanges')}</button>
            <button className="btn btn-ghost" onClick={() => setChanges(false)}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        <div className="row g12 wrap">
          <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => decide('approved')}>{t('rev.approve')}</button>
          <button className="btn btn-secondary btn-lg" onClick={() => setChanges(true)}>{t('rev.requestChanges')}</button>
        </div>
      )}
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('rev.decideError')}</p>}
      <p className="t-xs t-mute">{t('rev.fullApp')} <a href="/login" className="w7">{t('rev.signIn')}</a></p>
    </>
  );
}
