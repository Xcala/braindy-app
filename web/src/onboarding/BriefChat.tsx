import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { onboardingApi } from './api';
import { QUESTIONS } from './questions';

const AVATAR = '/brand/proposal/b3d-researcher.jpg';

/** Day 0-1 · Brief with the Researcher (design 17): eight questions, answered once, remembered forever. */
export function BriefChat({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t, lang } = useI18n();
  const brief = useBrandDoc(brandId, 'context/brief');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (brief.data?.answers) setAnswers(brief.data.answers as Record<string, string>); }, [brief.data]);
  const done = QUESTIONS.filter((q) => answers[q.key]?.trim()).length;
  const next = QUESTIONS.find((q) => !answers[q.key]?.trim());
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [done]);

  async function send(skip = false) {
    if (!next) return;
    const value = skip ? '—' : text.trim();
    if (!value) return;
    setBusy(true); setError(null);
    try {
      await onboardingApi.answer(brandId, next.key, value);
      setAnswers((a) => ({ ...a, [next.key]: value })); setText('');
    } catch { setError(t('ob.sendError')); } finally { setBusy(false); }
  }
  async function finish() {
    setBusy(true); setError(null);
    try { await onboardingApi.complete(brandId); } catch { setError(t('ob.finishError')); } finally { setBusy(false); }
  }

  const Bubble = ({ who, children }: { who: string; children: React.ReactNode }) => (
    <div className="row g12" style={{ alignItems: 'flex-start' }}>
      <img src={AVATAR} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', background: '#05070D', flex: 'none' }} />
      <div className="col g8" style={{ maxWidth: 560 }}><span className="t-xs t-mute w7">{who}</span>
        <div className="card" style={{ padding: '14px 16px', borderRadius: '4px 16px 16px 16px' }}>{children}</div></div>
    </div>
  );
  const Mine = ({ children }: { children: React.ReactNode }) => (
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      <div style={{ background: '#2F4DE0', color: '#fff', borderRadius: '16px 4px 16px 16px', padding: '14px 16px', maxWidth: 460, whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  );

  return (
    <section className="col g20" aria-labelledby="brief-h">
      <div className="col g8"><p className="t-sm t-mute w7">{t('ob.day01')} · {t('ob.s.brief')}</p><h1 className="h1" id="brief-h">{t('ob.briefTitle')}</h1><p className="t-mute">{t('ob.briefSub')}</p></div>
      <div className="row g12"><div className="bar grow" role="progressbar" aria-valuemin={0} aria-valuemax={8} aria-valuenow={done}><i style={{ width: `${(done / 8) * 100}%` }} /></div><span className="t-sm w7">{t('ob.ofN', { n: done, total: 8 })}</span></div>
      <div className="col g16" aria-live="polite">
        <Bubble who="Researcher">{t('ob.hello', { name: brandName })}</Bubble>
        {QUESTIONS.filter((q) => answers[q.key]?.trim()).map((q, i) => (
          <div key={q.key} className="col g16">
            <Bubble who={`Researcher · ${i + 1} ${t('ob.of')} 8`}>{q.ask[lang]}</Bubble>
            <Mine>{answers[q.key]}</Mine>
          </div>
        ))}
        {next && <Bubble who={`Researcher · ${done + 1} ${t('ob.of')} 8`}>{next.ask[lang]}</Bubble>}
        {!next && <Bubble who="Researcher">{t('ob.allDone')}</Bubble>}
        <div ref={end} />
      </div>
      {next ? (
        <form className="glass row g12 wrap" style={{ borderRadius: 18, padding: '10px 10px 10px 18px' }} onSubmit={(e) => { e.preventDefault(); send(); }}>
          <label className="sr" htmlFor="brief-in">{next.topic[lang]}</label>
          <textarea id="brief-in" className="grow" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('ob.placeholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ border: 0, background: 'transparent', resize: 'none', font: 'inherit', minWidth: 200, outline: 'none' }} />
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => send(true)}>{t('ob.skip')}</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{t('ob.send')}</button>
        </form>
      ) : (
        <div className="row g12 wrap"><button className="btn btn-primary" disabled={busy} onClick={finish}>{busy ? t('ob.building') : t('ob.buildBrain')}</button></div>
      )}
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
    </section>
  );
}
