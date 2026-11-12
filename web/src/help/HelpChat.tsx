import { followPointer } from './followPointer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuickDial } from './QuickDial';
import { Link, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { nicoWhatsApp } from '../lib/nicoWhatsApp';
import { api } from '../lib/api';
import { HelpText } from './HelpText';
import './help.css';

type Msg = { role: 'user' | 'assistant'; content: string; next?: 'nico' | 'request' | null; error?: boolean };
type Saved = { msgs: Msg[]; chatId: string | null };

const KEY = (brandId: string) => `bd-help-${brandId}`;
const load = (brandId: string): Saved => { try { return JSON.parse(sessionStorage.getItem(KEY(brandId)) ?? '') as Saved; } catch { return { msgs: [], chatId: null }; } };
const save = (brandId: string, s: Saved) => { try { sessionStorage.setItem(KEY(brandId), JSON.stringify(s)); } catch { /* private mode: the chat just isn't kept */ } };

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
);
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'] as const;
const INTRO = 'bd-help-intro';
const introSeen = () => { try { return localStorage.getItem(INTRO) === '1'; } catch { return true; } };

/** The small help button in the corner: a chat that knows how Braindy works and hands off to Nick when it can't help. */
export function HelpChat() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { current } = useBrands();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Saved>({ msgs: [], chatId: null });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(() => !introSeen());
  const dismissIntro = () => { setIntro(false); try { localStorage.setItem(INTRO, '1'); } catch { /* private mode */ } };
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const brandId = current?.id ?? '';
  // The corner button is a menu now (QuickDial): Ask Braindy is one of its actions.
  const [dial, setDial] = useState(false);
  const closeDial = useCallback(() => setDial(false), []);
  const openAi = useCallback(() => { setIntro(false); try { localStorage.setItem(INTRO, '1'); } catch { /* private mode */ } setOpen(true); }, []);
  useEffect(() => { setDial(false); }, [pathname]);

  useEffect(() => { if (brandId) setS(load(brandId)); }, [brandId]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [s.msgs.length, busy, open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  if (!current || pathname.startsWith('/ask')) return null;

  const update = (next: Saved) => { setS(next); save(brandId, next); };
  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const msgs: Msg[] = [...s.msgs, { role: 'user', content: question }];
    update({ ...s, msgs });
    setText(''); setBusy(true);
    try {
      const r = await api<{ text: string; next: Msg['next']; chatId: string }>('/v1/help/chat', {
        method: 'POST',
        body: JSON.stringify({ brandId, lang, path: pathname, chatId: s.chatId, messages: msgs.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) }),
      });
      update({ chatId: r.chatId, msgs: [...msgs, { role: 'assistant', content: r.text, next: r.next }] });
    } catch (e) {
      const code = String((e as Error).message);
      const key = code.includes('429') || code.includes('limit') ? 'help.limit' : code.includes('503') || code.includes('ai_off') ? 'help.off' : 'help.error';
      update({ ...s, msgs: [...msgs, { role: 'assistant', content: t(key), next: 'nico', error: true }] });
    } finally { setBusy(false); }
  }

  const lastQuestion = [...s.msgs].reverse().find((m) => m.role === 'user')?.content ?? '';
  const toNico = () => { if (s.chatId) api('/v1/help/handoff', { method: 'POST', body: JSON.stringify({ chatId: s.chatId }) }).catch(() => undefined); };
  const first = (profile as { name?: string } | null)?.name?.split(' ')[0];
  const close = () => { if (window.matchMedia('(max-width: 767px)').matches) setOpen(false); };

  return (
    <>
      {/* Never over a piece being reviewed: the intro would cover «Approve» and «Request changes». */}
      {!open && !dial && intro && !/^\/requests\/[^/]+/.test(pathname) && (
        <aside className="help-intro" aria-labelledby="help-intro-t">
          <span className="help-ai ai-tag">{t('help.introTag')}</span>
          <b id="help-intro-t">{t('help.introTitle')}</b>
          <p>{t('help.introText')}</p>
          <div className="row">
            <button type="button" className="go" onClick={() => { dismissIntro(); setOpen(true); }}>{t('help.introGo')}</button>
            <button type="button" className="later" onClick={dismissIntro}>{t('help.introLater')}</button>
          </div>
        </aside>
      )}
      {!open && (
        <button type="button" className={`help-fab${dial ? ' is-open' : ''}`} onPointerMove={followPointer} onClick={() => { dismissIntro(); setDial((d) => !d); }}
          aria-expanded={dial} aria-label={t(dial ? 'dial.close' : 'dial.label')} title={t(dial ? 'dial.close' : 'dial.label')}>
          <span className="help-core">{dial ? <span className="qd-x" aria-hidden="true">×</span> : <SparkIcon />}</span>
        </button>
      )}
      {!open && dial && <QuickDial onClose={closeDial} onAi={openAi} />}
      {open && (
        <section className="help-panel" role="dialog" aria-modal="false" aria-labelledby="help-title">
          <header className="help-head">
            <div className="col" style={{ minWidth: 0 }}>
              <h2 id="help-title" className="help-title">{t('help.title')}<span className="help-ai">{t('help.ai')}</span></h2>
              <p className="t-xs t-mute">{t('help.sub')}</p>
              <span className="help-brains" aria-hidden="true">{BRAINS.map((b) => <img key={b} src={`/brand/brains/${b}.png`} alt="" />)}</span>
              {s.msgs.length > 0 && <button type="button" className="help-new" onClick={() => update({ msgs: [], chatId: null })}>{t('help.new')}</button>}
            </div>
            <button type="button" className="help-x" onClick={() => setOpen(false)} aria-label={t('help.close')}>×</button>
          </header>
          <div className="help-body" aria-live="polite">
            <div className="help-msg is-bot"><p>{t('help.hello', { name: first ? ` ${first}` : '' })}</p></div>
            {s.msgs.length === 0 && (
              <div className="help-sugs">{(['help.s1', 'help.s2', 'help.s3'] as const).map((k) => <button key={k} type="button" className="chip" onClick={() => ask(t(k))}>{t(k)}</button>)}</div>
            )}
            {s.msgs.map((m, i) => (
              <div key={i} className={`help-msg ${m.role === 'user' ? 'is-me' : 'is-bot'}`}>
                {m.role === 'user' ? <p>{m.content}</p> : <HelpText text={m.content} onNavigate={close} />}
                {m.role === 'assistant' && i === s.msgs.length - 1 && m.next === 'nico' && (
                  <a className="btn btn-secondary btn-sm help-next" href={nicoWhatsApp(current, t('help.waText', { q: lastQuestion.slice(0, 300) }))} target="_blank" rel="noreferrer" onClick={toNico}>{t('help.toNico')}</a>
                )}
                {m.role === 'assistant' && i === s.msgs.length - 1 && m.next === 'request' && (
                  <Link className="btn btn-primary btn-sm help-next" to="/ask" onClick={close}>{t('help.toAsk')}</Link>
                )}
              </div>
            ))}
            {busy && <div className="help-msg is-bot"><p className="t-mute">{t('help.thinking')}</p></div>}
            <div ref={end} />
          </div>
          <form className="help-form" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
            <textarea ref={input} className="input help-input" rows={1} value={text} maxLength={1500} placeholder={t('help.ph')} aria-label={t('help.ph')}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(text); } }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{t('help.send')}</button>
          </form>
        </section>
      )}
    </>
  );
}
