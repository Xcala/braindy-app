import { followPointer } from './followPointer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuickDial } from './QuickDial';
import { Link, useLocation, useNavigate } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { nicoWhatsApp } from '../lib/nicoWhatsApp';
import { api } from '../lib/api';
import { HelpText } from './HelpText';
import { DraftCard, type Draft } from './DraftCard';
import { ChatCards, type ChatCard } from './ChatCards';
import { ActionCard, type ActCard } from './ActionCard';
import { viewingSite } from '../links/viewingSite';
import { Composer } from './Composer';
import { ChatHistory } from './ChatHistory';
import { CapabilitiesMenu } from './CapabilitiesMenu';
import { canVoice, useVoiceMode } from './useVoiceMode';
import { CanDo } from './CanDo';
import { markStep } from './firstSteps';
import { useChatTour } from './useChatTour';
import type { AttachedFile } from '../requests/types';
import './help.css';

type AnyCard = ChatCard | ActCard;
type Msg = { role: 'user' | 'assistant'; content: string; files?: AttachedFile[]; next?: 'nico' | 'request' | null; error?: boolean; draft?: Draft | null; sent?: string; cards?: AnyCard[]; old?: boolean; follow?: string[] };
const isAct = (c: AnyCard): c is ActCard => c.kind === 'act';
/** One line per card it showed, so «and that one?» or «open the second» can be followed on the next turn. */
const cardLine = (c: AnyCard) => c.kind === 'act' ? `propuesta ${c.act} «${c.title}»${'requestId' in c ? ` pedido ${c.requestId}` : ''} (${c.done ? 'ya confirmada' : 'sin confirmar'})`
  : c.kind === 'request' ? `pedido ${c.id} «${c.title}» ${c.status}` : c.kind === 'file' ? `archivo «${c.title}»`
  : c.kind === 'post' ? `post ${c.date.slice(0, 10)} «${c.text.slice(0, 60)}»` : c.kind === 'change' ? `ajuste ${c.key} «${c.title}» ${c.status}` : `${c.label}: ${c.value}`;
/** What goes back to the model: a draft travels with its answer so «change the date» works on the next turn; cards too. */
const asTurn = (m: Msg) => ({ role: m.role, content: `${m.content}${m.role === 'user' && m.files?.length ? ` [[ADJUNTÉ ${m.files.map((x) => x.name).join(', ')}]]` : ''}${m.cards?.length ? `
[[MOSTRÉ ${m.cards.map(cardLine).join(' | ')}]]` : ''}${m.draft ? `
[[BORRADOR ${JSON.stringify(m.draft)}]]${m.sent ? ' (ya enviado)' : ''}` : ''}` });
type Saved = { msgs: Msg[]; chatId: string | null };
/** A chat reopened from «Your chats»: what was said and shown, but old proposals and drafts come back as plain text, never as buttons. */
const restore = (view: Msg[]): Msg[] => view.map((v) => ({ role: v.role, content: v.content, files: v.files, old: true,
  cards: v.cards?.filter((c) => !isAct(c)) }));

const KEY = (brandId: string) => `bd-help-${brandId}`;
const load = (brandId: string): Saved => { try { return JSON.parse(sessionStorage.getItem(KEY(brandId)) ?? '') as Saved; } catch { return { msgs: [], chatId: null }; } };
const save = (brandId: string, s: Saved) => { try { sessionStorage.setItem(KEY(brandId), JSON.stringify(s)); } catch { /* private mode: the chat just isn't kept */ } };

const BRAINS = ['researcher', 'marketer', 'creator', 'builder'] as const;
const INTRO = 'bd-help-intro';
const DOCK = 'bd-help-dock';
const DESK = '(min-width: 768px)';
const dockSaved = () => { try { return window.matchMedia(DESK).matches && localStorage.getItem(DOCK) === '1'; } catch { return false; } };
const introSeen = () => { try { return localStorage.getItem(INTRO) === '1'; } catch { return true; } };

/** The AI assistant: a chat that knows how Braindy works and hands off to Nick when it can't help. On computers it docks as a
 * tinted panel on the left that pushes the app (open or closed is remembered); on phones it is a bottom sheet. */
export function HelpChat() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { current } = useBrands();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpenState] = useState(dockSaved);
  const [desk, setDesk] = useState(() => window.matchMedia(DESK).matches);
  const setOpen = useCallback((v: boolean | ((o: boolean) => boolean)) => setOpenState((o) => {
    const next = typeof v === 'function' ? v(o) : v;
    try { if (window.matchMedia(DESK).matches) localStorage.setItem(DOCK, next ? '1' : '0'); } catch { /* private mode */ }
    return next;
  }), []);
  const [s, setS] = useState<Saved>({ msgs: [], chatId: null });
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState(false);
  // A question coming from outside the panel (Home's box, a push alert's ?asistente=): asked in a new chat once the brand is ready.
  const [pending, setPending] = useState<{ q: string; brand?: string } | null>(null);
  const askRef = useRef<(q: string, files?: AttachedFile[], fresh?: boolean) => void>(() => undefined);
  const [intro, setIntro] = useState(() => !introSeen());
  const dismissIntro = () => { setIntro(false); try { localStorage.setItem(INTRO, '1'); } catch { /* private mode */ } };
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const brandId = current?.id ?? '';
  // The corner button is a menu now (QuickDial): Ask Braindy is one of its actions.
  const [dial, setDial] = useState(false);
  const closeDial = useCallback(() => setDial(false), []);
  const openAi = useCallback(() => { setIntro(false); try { localStorage.setItem(INTRO, '1'); } catch { /* private mode */ } setOpen(true); }, [setOpen]);
  useEffect(() => { setDial(false); }, [pathname]);
  useEffect(() => {
    const mq = window.matchMedia(DESK);
    const on = () => setDesk(mq.matches);
    mq.addEventListener('change', on);
    const toggle = () => { setIntro(false); setOpen((o) => !o); };
    const fromOutside = (e: Event) => { const q = (e as CustomEvent<string>).detail; if (q?.trim()) { setIntro(false); setHist(false); setOpen(true); setPending({ q: q.trim().slice(0, 1500) }); } };
    window.addEventListener('bd-help-toggle', toggle);
    window.addEventListener('bd-help-ask', fromOutside);
    const show = () => { setIntro(false); setHist(false); setOpen(true); };
    window.addEventListener('bd-help-open', show);
    return () => { mq.removeEventListener('change', on); window.removeEventListener('bd-help-toggle', toggle); window.removeEventListener('bd-help-ask', fromOutside); window.removeEventListener('bd-help-open', show); };
  }, [setOpen]);
  const shown = !!current && !pathname.startsWith('/ask');
  const docked = open && desk && shown;
  const lastMsg = s.msgs[s.msgs.length - 1];
  const voice = useVoiceMode(lang, lastMsg?.role === 'assistant' && !lastMsg.error ? { key: `${s.chatId}:${s.msgs.length}`, text: lastMsg.content } : null, open);
  useEffect(() => {
    document.documentElement.classList.toggle('help-docked', docked);
    return () => document.documentElement.classList.remove('help-docked');
  }, [docked]);

  useEffect(() => { if (brandId) { setS(load(brandId)); setHist(false); } }, [brandId]);
  useEffect(() => {
    const p = new URLSearchParams(search);
    const a = p.get('asistente');
    if (a == null) return;
    // An alert says what to ask (aprobar:<requestId>) and for which brand; the question is written in the person's language.
    const [kind, id] = a.split(':');
    const q = kind === 'aprobar' && id && /^[\w-]{4,60}$/.test(id) ? t('help.askApprove', { id }) : a.slice(0, 300);
    if (q.trim()) { setIntro(false); setHist(false); setOpen(true); setPending({ q, brand: p.get('brand') ?? undefined }); }
    const rest = new URLSearchParams(search); rest.delete('asistente');
    navigate({ pathname, search: rest.toString() ? `?${rest}` : '' }, { replace: true });
  }, [search, pathname, navigate, setOpen, t]);
  useEffect(() => { if (pending && brandId && !busy && (!pending.brand || pending.brand === brandId)) { askRef.current(pending.q, [], true); setPending(null); } }, [pending, brandId, busy]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useChatTour(open && !hist && s.msgs.length === 0 && !!current);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [s.msgs.length, busy, open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, setOpen]);

  if (!shown || !current) return null;

  const update = (next: Saved) => { setS(next); save(brandId, next); };
  async function ask(q: string, files: AttachedFile[] = [], fresh = false) {
    const question = q.trim();
    if (!question || busy) return;
    const base: Saved = fresh ? { msgs: [], chatId: null } : s;
    const msgs: Msg[] = [...base.msgs, { role: 'user', content: question, ...(files.length ? { files } : {}) }];
    update({ ...base, msgs });
    setBusy(true); setHist(false); markStep('ask');
    try {
      const r = await api<{ text: string; next: Msg['next']; draft?: Draft | null; cards?: AnyCard[]; follow?: string[]; chatId: string }>('/v1/help/chat', {
        method: 'POST',
        body: JSON.stringify({ brandId, lang, path: pathname, chatId: base.chatId, tools: true, site: viewingSite() ?? undefined, files, messages: msgs.filter((m) => !m.error).map(asTurn) }),
      });
      update({ chatId: r.chatId, msgs: [...msgs, { role: 'assistant', content: r.text, next: r.next, draft: r.draft ?? null, cards: r.cards ?? [], follow: r.follow ?? [], ...(files.length ? { files } : {}) }] });
    } catch (e) {
      const code = String((e as Error).message);
      const key = code.includes('429') || code.includes('limit') ? 'help.limit' : code.includes('503') || code.includes('ai_off') ? 'help.off' : 'help.error';
      update({ ...base, msgs: [...msgs, { role: 'assistant', content: t(key), next: 'nico', error: true }] });
    } finally { setBusy(false); }
  }

  askRef.current = (q, files, fresh) => void ask(q, files, fresh);
  async function pick(id: string) {
    try {
      const r = await api<{ id: string; view: Msg[] }>(`/v1/help/chats/${encodeURIComponent(id)}`);
      update({ chatId: r.id, msgs: restore(r.view) }); setHist(false);
    } catch { /* the list shows the error state on the next open */ }
  }
  const voiceBtn = (cls: string) => canVoice() ? (
    <button type="button" className={`${cls}${voice.on ? ' is-voice' : ''}`} onClick={voice.toggle} aria-pressed={voice.on} aria-label={t(voice.on ? 'help.voiceOff' : 'help.voiceOn')} title={t(voice.on ? 'help.voiceOff' : 'help.voiceOn')}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" />{voice.on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}</svg>
    </button>
  ) : null;
  const histBtn = (cls: string) => (
    <button type="button" className={cls} data-tour="help-hist" onClick={() => setHist((h) => !h)} aria-pressed={hist} aria-label={t(hist ? 'help.histBack' : 'help.histOpen')} title={t(hist ? 'help.histBack' : 'help.histOpen')}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
    </button>
  );
  const newChat = () => { setHist(false); update({ msgs: [], chatId: null }); input.current?.focus(); };
  const admin = (profile as { role?: string } | null)?.role === 'admin';
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
      {(!open || docked) && (
        <button type="button" className={`help-fab${dial ? ' is-open' : ''}`} onPointerMove={followPointer} onClick={() => { dismissIntro(); setDial((d) => !d); }}
          aria-expanded={dial} aria-label={t(dial ? 'dial.close' : 'dial.label')} title={t(dial ? 'dial.close' : 'dial.label')}>
          <span className="help-core"><svg className="qd-plus" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
        </button>
      )}
      {(!open || docked) && dial && <QuickDial onClose={closeDial} onAi={openAi} />}
      {open && (
        <section className={`help-panel${docked ? ' is-dock' : ''}`} role={docked ? 'complementary' : 'dialog'} aria-modal={docked ? undefined : false} aria-labelledby="help-title">
          {docked ? (
            <header className="help-dhead">
              <CapabilitiesMenu id="help-title" className="help-dtitle" admin={admin} onAsk={(q) => void ask(q)} />
              {voiceBtn('help-dbtn')}
              {histBtn('help-dbtn')}
              <button type="button" className="help-dbtn" onClick={newChat} aria-label={t('help.new')} title={t('help.new')}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
              <button type="button" className="help-dbtn" onClick={() => setOpen(false)} aria-label={t('help.close')} title={t('help.close')}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </header>
          ) : (
          <header className="help-head">
            <div className="col" style={{ minWidth: 0 }}>
              <CapabilitiesMenu id="help-title" className="help-title" admin={admin} onAsk={(q) => void ask(q)} />
              <p className="t-xs t-mute">{t('help.sub')}</p>
              <span className="help-brains" aria-hidden="true">{BRAINS.map((b) => <img key={b} src={`/brand/brains/${b}.png`} alt="" />)}</span>
              {s.msgs.length > 0 && <button type="button" className="help-new" onClick={() => update({ msgs: [], chatId: null })}>{t('help.new')}</button>}
            </div>
            {voiceBtn('help-x')}
            {histBtn('help-x')}
            <button type="button" className="help-x" onClick={() => setOpen(false)} aria-label={t('help.close')}>×</button>
          </header>
          )}
          <div className="help-body" aria-live="polite">
            {hist ? <ChatHistory brandId={brandId} current={s.chatId} onPick={(id) => void pick(id)} onNew={newChat} onDeleted={(id) => { if (id === s.chatId) update({ msgs: [], chatId: null }); }} /> : <>
            {docked ? (
              <div className="help-welcome">
                <span className="help-brains" aria-hidden="true">{BRAINS.map((b) => <img key={b} src={`/brand/brains/${b}.png`} alt="" />)}</span>
                <b>{t('help.welcome', { name: first ? `, ${first}` : '' })}</b>
                <p>{t('help.welcomeSub')}</p>
              </div>
            ) : <div className="help-msg is-bot"><p>{t('help.hello', { name: first ? ` ${first}` : '' })}</p></div>}
            {s.msgs.length === 0 && <CanDo brandId={brandId} client={profile?.role !== 'admin'} onAsk={(q) => void ask(q)} onHist={() => setHist(true)} />}
            {s.msgs.map((m, i) => (
              <div key={i} className={`help-msg ${m.role === 'user' ? 'is-me' : 'is-bot'}`}>
                {m.role === 'user' ? <p>{m.content}</p> : <HelpText text={m.content} onNavigate={close} />}
                {m.role === 'user' && !!m.files?.length && <span className="help-sentfiles">{m.files.map((x) => <span key={x.assetId}>📎 {x.name}</span>)}</span>}
                {m.role === 'assistant' && !!m.cards?.some((c) => !isAct(c)) && <ChatCards brandId={brandId} cards={m.cards.filter((c): c is ChatCard => !isAct(c))} onOpen={close} />}
                {m.role === 'assistant' && m.cards?.filter(isAct).map((c) => (
                  <ActionCard key={`${i}-${c.ref}-${c.done ?? ''}`} brandId={brandId} card={c} files={m.files} onOpen={close}
                    onDone={(done, text) => { if (c.act === 'approve' || c.act === 'site') markStep(c.act); update({ ...s, msgs: s.msgs.map((x, j) => (j === i ? { ...x, cards: x.cards?.map((y) => (y === c ? { ...c, done, text } : y)) } : x)) }); }} />
                ))}
                {m.role === 'assistant' && m.draft && (
                  <DraftCard key={`${i}-${m.sent ?? ''}`} brandId={brandId} draft={m.draft} files={m.files} sentId={m.sent} onClose={close}
                    onSent={(id, d) => update({ ...s, msgs: s.msgs.map((x, j) => (j === i ? { ...x, draft: d, sent: id } : x)) })} />
                )}
                {m.role === 'assistant' && i === s.msgs.length - 1 && m.next === 'nico' && (
                  <a className="btn btn-secondary btn-sm help-next" href={nicoWhatsApp(current, t('help.waText', { q: lastQuestion.slice(0, 300) }))} target="_blank" rel="noreferrer" onClick={toNico}>{t('help.toNico')}</a>
                )}
                {m.role === 'assistant' && i === s.msgs.length - 1 && m.next === 'request' && (
                  <Link className="btn btn-primary btn-sm help-next" to="/ask" onClick={close}>{t('help.toAsk')}</Link>
                )}
                {m.role === 'assistant' && i === s.msgs.length - 1 && !busy && !!m.follow?.length && (
                  <div className="help-follow">{m.follow.map((f) => <button key={f} type="button" onClick={() => void ask(f)}>{f}</button>)}</div>
                )}
              </div>
            ))}
            {s.msgs[0]?.old && <p className="t-xs t-mute">{t('help.histOld')}</p>}
            {busy && <div className="help-msg is-bot"><p className="t-mute">{t('help.thinking')}</p></div>}
            </>}
            <div ref={end} />
          </div>
          <Composer ref={input} brandId={brandId} busy={busy} ph={hist ? t('help.newChatPh') : undefined} onSend={(q, files) => void ask(q, files, hist)} />
          <p className="help-ainote">{t('help.aiNote')}</p>
        </section>
      )}
    </>
  );
}
