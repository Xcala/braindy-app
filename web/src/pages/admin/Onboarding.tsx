import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands, type Brand } from '../../brands/BrandProvider';
import { useBrandDoc } from '../../brands/useBrandDoc';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { BrainCards } from '../../onboarding/BrainCards';
import { NoticesList } from '../../onboarding/NoticesList';
import { brainsApi } from '../../brains/useBrains';
import { onboardingApi, type BrainDraft } from '../../onboarding/api';

/** Admin · onboarding queue and "review and sign the Brand Brain" (design 18). */
export function AdminOnboarding() {
  const { brands } = useBrands();
  const { t, lang } = useI18n();
  const inFlight = brands.filter((b) => b.onboarding && b.onboarding.step !== 'live');
  const [sel, setSel] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; brandId: string; at: Date }>>([]);
  const [startId, setStartId] = useState('');
  useEffect(() => {
    getDocs(query(collection(db, 'sessions'), where('at', '>=', new Date()), orderBy('at'))).then((s) =>
      setSessions(s.docs.map((d) => ({ id: d.id, brandId: d.get('brandId'), at: d.get('at').toDate() })))).catch(() => setSessions([]));
  }, []);
  const selected = inFlight.find((b) => b.id === sel) ?? inFlight[0] ?? null;
  const fmt = (d: Date) => d.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });

  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="col g16">
        <div className="card col g8">
          <h2 className="h3">{t('ob.a.queue')}</h2>
          {inFlight.length === 0 && <p className="t-sm t-mute">{t('ob.a.queueEmpty')}</p>}
          {inFlight.map((b) => (
            <button key={b.id} onClick={() => setSel(b.id)} className={`menu-item text-left ${selected?.id === b.id ? 'is-on' : ''}`} style={{ border: 0, cursor: 'pointer', background: selected?.id === b.id ? 'var(--niebla)' : 'none', height: 'auto', padding: '8px 10px' }}>
              <span className="sel" style={{ border: 0, padding: 0, height: 'auto', background: 'none' }}><BrandMark brand={b} /></span>
              <span className="col"><span className="w7 t-sm">{b.name}</span><span className="t-xs t-mute">{t(`ob.a.step.${b.onboarding!.step}`)}</span></span>
            </button>
          ))}
        </div>
        <div className="card col g8">
          <h2 className="h3">{t('ob.a.sessions')}</h2>
          {sessions.length === 0 && <p className="t-sm t-mute">{t('ob.a.noSessions')}</p>}
          {sessions.map((s) => <div key={s.id} className="row between t-sm"><span>{fmt(s.at)}</span><span className="w7 truncate">{brands.find((b) => b.id === s.brandId)?.name}</span></div>)}
        </div>
        <div className="card col g8">
          <h2 className="h3">{t('ob.a.start')}</h2>
          <select className="input" value={startId} onChange={(e) => setStartId(e.target.value)} aria-label={t('ob.a.start')}>
            <option value="">{t('ob.a.pickBrand')}</option>
            {brands.filter((b) => !b.onboarding && b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" disabled={!startId} onClick={() => onboardingApi.start(startId).then(() => { setSel(startId); setStartId(''); })}>{t('ob.a.startBtn')}</button>
        </div>
      </aside>
      {selected ? <SignPanel key={selected.id} brand={selected} /> : <div className="card t-mute">{t('ob.a.queueEmpty')}</div>}
    </div>
  );
}

function SignPanel({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const doc = useBrandDoc(brand.id, 'context/brain');
  const [draft, setDraft] = useState<BrainDraft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (doc.data && !draft) setDraft(doc.data as BrainDraft); }, [doc.data, draft]);
  const step = brand.onboarding!.step;
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg(ok); } catch { setMsg(t('ob.a.error')); } finally { setBusy(false); }
  };

  return (
    <section className="col g20">
      <div className="col g8">
        <p className="t-sm t-mute w7">{brand.name} · {t(`ob.a.step.${step}`)}</p>
        <div className="row g12 wrap"><h1 className="h1">{t('ob.a.title')}</h1><span className="chip c-draft">{t('ob.namePending')}</span></div>
      </div>
      <NoticesList brandId={brand.id} />
      {!draft ? <div className="card t-mute">{step === 'brief' ? t('ob.a.briefInProgress') : t('common.loading')}</div> : (
        <>
          <BrainCards brain={draft} onChange={setDraft} />
          <div className="card row between g16 wrap" style={{ padding: 22 }}>
            <div className="row g12"><img src="/brand/proposal/nicolas.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="col"><span className="w7">{t('sig.card')}</span><span className="t-xs t-mute">{t('ob.a.signNote')}</span></div></div>
            <div className="row g8 wrap">
              <button className="btn btn-secondary" disabled={busy} onClick={() => run(() => onboardingApi.saveBrain(brand.id, draft), t('ob.a.saved'))}>{t('ob.a.save')}</button>
              {(draft.competitors ?? []).some((c) => c.url) && <button className="btn btn-ghost" disabled={busy} onClick={async () => { setBusy(true); setMsg(t('brains.watching')); try { await onboardingApi.saveBrain(brand.id, draft); const r = await brainsApi.watch(brand.id); const n = (s: string) => String(r.results.filter((x) => x.status === s).length); setMsg(t('brains.watchDone', { changed: n('changed'), same: n('unchanged'), first: n('baseline') })); } catch { setMsg(t('brains.error')); } finally { setBusy(false); } }}>{t('brains.watchNow')}</button>}
              {draft.status !== 'signed'
                ? <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => { await onboardingApi.saveBrain(brand.id, draft); await onboardingApi.sign(brand.id); setDraft({ ...draft, status: 'signed' }); }, t('ob.a.signed'))}>{t('ob.a.sign')}</button>
                : <button className="btn btn-primary" disabled={busy} onClick={() => run(() => onboardingApi.live(brand.id), t('ob.a.liveDone'))}>{t('ob.a.markLive')}</button>}
            </div>
          </div>
          {msg && <p className="t-sm" role="status">{msg}</p>}
        </>
      )}
    </section>
  );
}
