import type { CSSProperties } from 'react';
import { BOS, BOS_KEYS, PHASES, PHASE_KEYS, ADDONS, money, phaseBlocks, projectTotal, tr, type Block, type Lang, type Offer } from '../offer/catalog';

const S = (lang: Lang) => (es: string, en: string) => (lang === 'es' ? es : en);
const brainColor = (b: string): CSSProperties => ({ ['--c' as string]: `var(--${b})` });

function Blocks({ blocks, lang }: { blocks: readonly Block[]; lang: Lang }) {
  return (
    <div className="col g12">
      {blocks.map(([t, items]) => (
        <div key={t[0]} className="col" style={{ gap: '0.25rem' }}>
          <b className="t-sm">{tr(t, lang)}</b>
          <ul className="offer-sub">{items.map((i) => <li key={i[0]}>{tr(i, lang)}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/** 04 · How we do it: the same for every client. Three Neuro phases, each led by a Brain and signed by NickMark, then BOS. */
export function HowWeWork({ lang, offer }: { lang: Lang; offer: Offer }) {
  const s = S(lang);
  return (
    <section className="col g32 px-5 py-16 sm:px-14" data-section="4">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g12"><span className="sec-num">04</span>
          <h2 className="d-lg"><span className="w9">{s('Cómo lo hacemos.', 'How we do it.')}</span> {s('Primero construimos, luego operamos.', 'First we build, then we run it.')}</h2></div>
        <p className="t-mute" style={{ maxWidth: '28rem' }}>{s('Cada fase la lidera un Brain y la firma NicoMarca. Al terminar, seguimos al frente con BOS.', 'A Brain leads each phase and NickMark signs it. When it is done, we stay in charge with BOS.')}</p>
      </div>
      <p className="label">{offer.kind === 'rebuild' ? s('ReBuild your Brand · renovar', 'ReBuild your Brand · renew') : s('Build your Brand · marca nueva', 'Build your Brand · new brand')}</p>
      <div className="grid gap-5 lg:grid-cols-3">
        {PHASE_KEYS.map((k, i) => (
          <article key={k} className="card col g16 offer-phase" style={brainColor(PHASES[k].brain)}>
            <div className="row between"><span className="sec-num">{s('Fase', 'Phase')} {i + 1}</span><span className="t-xs t-mute">{tr(PHASES[k].weeks, lang)}</span></div>
            <h3 className="h2 w9">{PHASES[k].name}</h3>
            <Blocks blocks={phaseBlocks(k, offer.kind)} lang={lang} />
          </article>
        ))}
      </div>
      <div className="stage col g24 rounded-[1.75rem] p-6 sm:p-10">
        <div className="col g8"><p className="label">BOS · Brand Operating System</p>
          <h3 className="d-lg" style={{ color: '#fff', fontSize: '2.25rem', lineHeight: '2.5rem' }}><span className="w9">{s('NicoMarca al frente de tu marca,', 'NickMark running your brand,')}</span> {s('cada mes.', 'every month.')}</h3>
          <p className="muted" style={{ margin: 0, maxWidth: '42rem' }}>{s('Diseño, web, apps, redes, pauta, empaques y espacios: lo que la marca necesite, hecho por él con sus Brains. Tú apruebas.', 'Design, web, apps, social, ads, packaging and spaces: whatever the brand needs, done by him with his Brains. You approve.')}</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {BOS_KEYS.map((k) => (
            <div key={k} className="col g8 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.06)', border: offer.bos === k ? '1.5px solid #fff' : '1px solid rgba(255,255,255,.14)' }}>
              <span className="row between"><b>{BOS[k].name}</b>{offer.bos === k && <span className="chip c-sent">{s('Tu plan', 'Your plan')}</span>}</span>
              <span className="t-sm muted">{tr(BOS[k].focus, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 05 · Your proposal: only what this client takes, at this client's price, and one way to say yes. */
export function OfferSummary({ lang, offer, cur, onAccept, accepted }: { lang: Lang; offer: Offer; cur: string; onAccept: () => void; accepted: boolean }) {
  const s = S(lang);
  const phases = PHASE_KEYS.filter((k) => k in offer.phases);
  const total = projectTotal(offer);
  const m = (n?: number | null) => money(n, cur, lang);
  return (
    <section id="options" className="col g32 px-5 py-16 sm:px-14" data-section="5">
      <div className="col g12"><span className="sec-num">05</span><h2 className="d-lg"><span className="w9">{s('Tu propuesta.', 'Your proposal.')}</span></h2></div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {phases.length > 0 && (
          <div className="card col g16">
            <p className="label">{offer.kind === 'rebuild' ? 'ReBuild your Brand' : 'Build your Brand'} · {s('un proyecto', 'one project')}</p>
            {phases.map((k) => (
              <div key={k} className="row between g12" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
                <span className="col" style={{ gap: 2 }}><b>{PHASES[k].name}</b><span className="t-xs t-mute">{tr(PHASES[k].weeks, lang)}</span></span>
                <b>{offer.phases[k] != null ? m(offer.phases[k]) : s('Incluida', 'Included')}</b>
              </div>
            ))}
            {total > 0 && <div className="row between"><span className="w7">{s('Total del proyecto', 'Project total')}</span><span className="h2 w9">{m(total)}</span></div>}
            <ul className="offer-sub t-sm">
              <li>{s('Pago: 50 % al empezar, 30 % a la mitad y 20 % al entregar.', 'Payment: 50% to start, 30% midway and 20% on delivery.')}</li>
              <li>{s('3 meses del plan Pro de hosting incluidos.', '3 months of the Pro hosting plan included.')}</li>
            </ul>
          </div>
        )}
        {offer.bos && (
          <div className="card col g16" style={{ borderColor: 'var(--azul)', boxShadow: '0 0 0 1px var(--azul)' }}>
            <p className="label">BOS · {BOS[offer.bos].name}</p>
            <div className="row between g12 wrap"><span className="h2 w9">{m(offer.bosMonthly)}<span className="t-sm t-mute w4"> / {s('mes', 'month')}</span></span>
              {offer.bosMonths ? <span className="chip">{offer.bosMonths} {s('meses', 'months')}</span> : null}</div>
            {BOS[offer.bos].plus && <p className="t-sm t-mute" style={{ margin: 0 }}>{tr(BOS[offer.bos].plus!, lang)}</p>}
            <Blocks blocks={BOS[offer.bos].blocks} lang={lang} />
          </div>
        )}
      </div>
      {offer.note && <p className="t-sm" style={{ margin: 0 }}><b>{offer.note}</b></p>}
      <div className="row g12 wrap">{!accepted && <button className="btn btn-primary" onClick={onAccept}>{s('Aceptar y firmar', 'Accept and sign')}</button>}</div>
      <div className="card card-tight col g8" style={{ background: 'var(--hielo)', borderColor: 'transparent' }}>
        <p className="label" style={{ margin: 0 }}>{s('Cuando quieras sumarlo · precio fijo', 'Add any time · fixed price')}</p>
        <p className="t-sm" style={{ margin: 0 }}><b>{s('Hosting y editor del sitio:', 'Website hosting and editor:')}</b> {ADDONS.site.map(([n, c, u]) => `${n} ${m(cur === 'cop' ? c : u)}`).join(' · ')} {s('al mes', 'a month')}</p>
        <p className="t-sm" style={{ margin: 0 }}><b>{s('Studio, piezas con los Brains:', 'Studio, pieces with the Brains:')}</b> {ADDONS.studio.map(([n, c, u]) => `${n} ${s('créditos', 'credits')} ${m(cur === 'cop' ? c : u)}`).join(' · ')} {s('al mes', 'a month')}</p>
      </div>
    </section>
  );
}
