import { CONTACT, fill, type PublicCopy } from './copy';
import type { OptionKey } from '../types';

export interface PublicProposal {
  title: string;
  prospect: { name?: string; company?: string };
  lang: 'en' | 'es';
  validUntil?: string;
  fromA?: { today?: string; insights?: string };
  toB?: { target?: string; changes?: string };
  options?: Partial<Record<OptionKey | 'aiAgents', { price?: string }>>;
  recommended?: OptionKey;
  files: Array<{ id: string; title: string }>;
}

const img = (name: string) => `/brand/proposal/${name}.jpg`;
const wa = (c: PublicCopy) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(c.whatsapp)}`;

export function Hero({ c, p, dateLabel, validLabel, onLang, lang }: { c: PublicCopy; p: PublicProposal; dateLabel: string; validLabel?: string; onLang: (l: 'en' | 'es') => void; lang: 'en' | 'es' }) {
  const name = p.prospect.company || p.prospect.name || '';
  return (
    <section className="stage flex flex-col gap-12 px-5 py-8 sm:px-14 sm:py-12" data-section="0">
      <div className="row between g16 wrap">
        <img src="/brand/braindy-logo-light.svg" alt="Braindy" style={{ height: 32 }} />
        <div className="lang" role="group" aria-label="Language" style={{ borderColor: 'rgba(255,255,255,.3)' }}>
          {(['en', 'es'] as const).map((l) => <button key={l} aria-pressed={lang === l} className={lang === l ? 'is-on' : ''} style={lang === l ? { background: '#fff', color: 'var(--ink)' } : { color: '#fff' }} onClick={() => onLang(l)}>{l.toUpperCase()}</button>)}
        </div>
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="col g24">
          <div className="row g12 wrap"><p className="label" style={{ color: '#C9D0DE' }}>{fill(c.preparedFor, { name, date: dateLabel })}</p>{validLabel && <span className="chip chip-plain glass-clear" style={{ color: '#fff' }}>{fill(c.validUntil, { date: validLabel })}</span>}</div>
          <h1 className="d-xl" style={{ color: '#fff' }}><span className="w9">{c.hero1}</span> {c.hero2}</h1>
          <p className="t-lg muted">{c.heroBody}</p>
          <div className="row g12 wrap"><a className="btn btn-white" href="#options">{c.seeOptions}</a><a className="btn btn-outline-light" href="#talk">{c.talk}</a></div>
        </div>
        <div className="shot overflow-hidden rounded-[20px]"><img src={img('ipark-film')} alt="iPark" className="w-full" /><span className="tag">{c.watch}</span></div>
      </div>
      <div className="col g16">
        <div className="rule-line" />
        <div className="row between g16 wrap">
          <div className="row g40 wrap">{c.stats.map(([n, l]) => <span key={l} className="kicker"><b>{n}</b> {l}</span>)}</div>
          <p className="t-sm muted">{c.clients}</p>
        </div>
      </div>
    </section>
  );
}

export function Proof({ c }: { c: PublicCopy }) {
  return (
    <section className="col g32 px-5 py-16 sm:px-14" data-section="1">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g12"><span className="sec-num">01</span><h2 className="d-lg"><span className="w9">{c.proof1}</span> {c.proof2}</h2></div>
        <p className="t-mute">{c.proofSub}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {c.results.map(([n, w, d]) => <div key={w} className="card col g8"><span className="d-lg"><span className="w9">{n}</span></span><span className="w7">{w}</span><span className="t-sm t-mute">{d}</span></div>)}
      </div>
      <p className="t-xs t-mute">{c.resultsNote}</p>
      <div className="stage col g32 rounded-[28px] p-6 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="col g16"><p className="label" style={{ color: '#C9D0DE' }}>{c.caseLabel}</p><h3 className="d-lg" style={{ color: '#fff' }}><span className="w9">{c.case1}</span> {c.case2}</h3></div>
          <p className="t-lg muted self-end">{c.caseBody}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {c.caseShots.map(([f, label]) => <div key={f} className="shot overflow-hidden rounded-2xl"><img src={img(f)} alt={label} className="aspect-[4/3] w-full object-cover" loading="lazy" /><span className="tag">{label}</span></div>)}
        </div>
        <div className="rule-line" />
        <h3 className="kicker" style={{ fontSize: 22 }}><b>{c.caseAfter1}</b> {c.caseAfter2}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {c.caseEnd.map(([f, label]) => <div key={f} className="shot overflow-hidden rounded-2xl"><img src={img(f)} alt={label} className="aspect-video w-full object-cover" loading="lazy" /><span className="tag">{label}</span></div>)}
        </div>
        <p className="kicker" style={{ fontSize: 24 }}><span className="w3">{c.caseKicker1}</span> <b>{c.caseKicker2}</b></p>
      </div>
    </section>
  );
}

export function FromAtoB({ c, p }: { c: PublicCopy; p: PublicProposal }) {
  if (!p.fromA?.today && !p.toB?.target) return null;
  const name = p.prospect.company || p.prospect.name || '';
  return (
    <section className="col g32 px-5 py-16 sm:px-14" data-section="2">
      <div className="col g12"><span className="sec-num">02</span><h2 className="d-lg"><span className="w9">{c.ab1}</span> {c.ab2}</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card col g16"><p className="label">{fill(c.today, { name })}</p><p className="t-lg" style={{ whiteSpace: 'pre-line' }}>{p.fromA?.today}</p>{p.fromA?.insights && <p className="t-mute" style={{ whiteSpace: 'pre-line' }}>{p.fromA.insights}</p>}</div>
        <div className="card col g16" style={{ background: 'var(--hielo)', borderColor: 'transparent' }}><p className="label">{c.target}</p><p className="t-lg" style={{ whiteSpace: 'pre-line' }}>{p.toB?.target}</p>{p.toB?.changes && <p className="t-mute" style={{ whiteSpace: 'pre-line' }}>{p.toB.changes}</p>}</div>
      </div>
    </section>
  );
}

export function Braintrust({ c }: { c: PublicCopy }) {
  return (
    <section className="stage grid gap-10 px-5 py-16 sm:px-14 lg:grid-cols-[420px_1fr]" data-section="3">
      <div className="relative overflow-hidden rounded-[24px]">
        <img src={img('nicolas')} alt="Nicolas (NickMark)" className="h-full w-full object-cover" loading="lazy" />
        <div className="glass-dark absolute bottom-4 left-4 right-4 rounded-2xl p-4"><p className="w7">Nicolas (NickMark)</p><p className="t-sm">{c.founderRole}</p></div>
      </div>
      <div className="col g32">
        <span className="sec-num">03</span>
        <h2 className="d-lg" style={{ color: '#fff' }}><span className="w9">{c.bt1}</span> {c.bt2}</h2>
        <p className="t-lg">{c.btBody}</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {c.brains.map(([k, name, line]) => <div key={k} className="b3d col g8"><img src={img(`b3d-${k}`)} alt={name} loading="lazy" /><span className="w7">{name}</span><span className="t-sm muted">{line}</span></div>)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="widget col g4" style={{ position: 'static' }}><span className="w7">{c.brainWidget}</span><span className="t-sm">{c.brainWidgetBody}</span></div>
          <div className="widget col g4" style={{ position: 'static' }}><span className="w7">{c.aiWidget1} <b className="w9">ai</b> {c.aiWidget2}</span><span className="t-sm">{c.aiWidgetBody}</span></div>
        </div>
      </div>
    </section>
  );
}

export function Days({ c }: { c: PublicCopy }) {
  return (
    <section className="col g32 px-5 py-16 sm:px-14" data-section="4">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g12"><span className="sec-num">04</span><h2 className="d-lg"><span className="w9">{c.days1}</span> {c.days2}</h2></div>
        <p className="t-mute">{c.daysSub}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {c.days.map(([d, w, line]) => <div key={d} className="col g8"><span className="sec-num">{d}</span><span className="w7">{w}</span><span className="t-sm t-mute">{line}</span></div>)}
      </div>
      <div className="card card-tight row g12" style={{ background: 'var(--success-bg)', border: 0 }}><span><b>{c.whatsappNote1}</b> {c.whatsappNote2}</span></div>
    </section>
  );
}

export function Options({ c, p, onPick }: { c: PublicCopy; p: PublicProposal; onPick: (k: OptionKey) => void }) {
  const rec = p.recommended ?? 'transform';
  return (
    <section id="options" className="col g32 px-5 py-16 sm:px-14" data-section="5">
      <div className="col g12"><span className="sec-num">05</span><h2 className="d-lg"><span className="w9">{c.opt1}</span> {c.opt2}</h2><p className="t-mute">{c.optSub}</p></div>
      <div className="stage row g12 rounded-2xl p-4"><img className="lighten" src="/brand/brains/four-brains.jpg" alt="" style={{ height: 48 }} /><span className="t-sm"><b>{c.allBrains1}</b> {c.allBrains2}</span></div>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {(['launch', 'transform', 'continuity'] as OptionKey[]).map((k) => {
          const o = c.options[k];
          const isRec = k === rec;
          return (
            <div key={k} className="card col g16" style={isRec ? { borderColor: 'var(--azul)', boxShadow: '0 0 0 1px var(--azul)' } : undefined}>
              <div className="row between"><span className="sec-num">{o.num}</span>{isRec && <span className="chip c-sent">{c.recommended}</span>}</div>
              <div className="col" style={{ gap: 6 }}><h3 className="d-lg w9">{o.name}</h3><p>{o.lead}</p></div>
              {o.groups.map(([g, items]) => <div key={g} className="col g8"><p className="label">{g}</p><div className="row g8 wrap">{items.map((i) => <span key={i} className="chip chip-plain c-type">{i}</span>)}</div></div>)}
              <div className="col g4" style={{ marginTop: 'auto' }}><span className="d-lg w9" style={{ fontSize: 36 }}>{p.options?.[k]?.price || c.price}</span><span className="t-sm t-mute">{o.per}</span></div>
              <p className="t-sm t-mute">{o.note}</p>
              <button className={`btn ${isRec ? 'btn-primary' : 'btn-secondary'} btn-block`} onClick={() => onPick(k)}>{o.cta}</button>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card row g20"><span className="chip">{c.addMonth}</span><div className="col grow" style={{ gap: 2 }}><span className="w7">{c.aiAgents}</span><span className="t-sm t-mute">{fill(c.aiAgentsBody, { price: p.options?.aiAgents?.price || c.price })}</span></div></div>
        <div className="card row g20"><span className="chip">{c.addMonth}</span><div className="col grow" style={{ gap: 2 }}><span className="w7">{c.print}</span><span className="t-sm t-mute">{c.printBody}</span></div></div>
      </div>
    </section>
  );
}

export function Talk({ c, onAccept, files, onFile }: { c: PublicCopy; onAccept: () => void; files: PublicProposal['files']; onFile: (id: string) => void }) {
  return (
    <section id="talk" className="grid gap-10 px-5 py-16 sm:px-14 lg:grid-cols-[1fr_420px]" data-section="6">
      <div className="col g20">
        <span className="sec-num">06</span>
        <h2 className="d-lg"><span className="w9">{c.cta1}</span> {c.cta2}</h2>
        <p className="t-lg t-mute">{c.ctaBody}</p>
        <div className="row g12 wrap">
          <button className="btn btn-primary" onClick={onAccept}>{c.accept}</button>
          <a className="btn btn-secondary" href={wa(c)} target="_blank" rel="noreferrer">{c.whatsapp}</a>
        </div>
        <div className="row g16 wrap t-sm t-mute">{c.steps.map((s) => <span key={s}>{s}</span>)}</div>
        {files.length > 0 && (
          <div className="col g8"><p className="label">{c.files}</p>
            <div className="row g8 wrap">{files.map((f) => <button key={f.id} className="btn btn-secondary btn-sm" onClick={() => onFile(f.id)}>{f.title}</button>)}</div>
          </div>
        )}
      </div>
      <div className="card row g20 self-start">
        <img src={img('nicolas')} alt="" className="h-20 w-20 rounded-full object-cover" />
        <div className="col g4">
          <span className="h3">Nicolas (NickMark)</span>
          <span className="t-sm t-mute">{c.founderRole}</span>
          <a href={`mailto:${CONTACT.email}`} className="t-sm w7">{CONTACT.email}</a>
          <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="t-sm w7">{CONTACT.phone}</a>
          <span className="t-sm t-mute">braindy.co · Santa Clara, California</span>
        </div>
      </div>
    </section>
  );
}
