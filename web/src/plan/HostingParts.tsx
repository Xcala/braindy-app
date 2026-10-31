import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { CONTACT } from '../proposals/public/copy';
import { COMPARE, FINDER, PICKS, WEB_PLANS, type Bill, type Cur, type PlanCard } from './hostingData';

export type Tx = readonly [string, string];
export const useL = () => { const { lang } = useI18n(); return (x: Tx) => x[lang === 'es' ? 0 : 1]; };
export const wa = (text: string) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
export const fmt = (n: number, cur: Cur) => `$${(cur === 'usd' ? Math.round(n * 100) / 100 : Math.round(n / 100) * 100).toLocaleString('es-CO')}`;

const T = {
  ideal: ['Ideal para:', 'Best for:'], perMonth: ['/ mes', '/ month'], from: ['desde', 'from'], billedM: ['Facturado cada mes', 'Billed every month'],
  year: ['al año · ', 'a year · '], save: ['ahorras ', 'you save '], yours: ['Tu plan actual', 'Your current plan'],
  pick: ['Te recomendamos', 'We recommend'], start: ['Empezar por WhatsApp', 'Start on WhatsApp'], yes: ['Sí', 'Yes'], no: ['No', 'No'],
} satisfies Record<string, Tx>;

/** One plan card, as on the pricing page: dot, name, ideal for, price with the yearly saving, features, specs and the action. */
export function Plan({ p, cur, bill, mine, children }: { p: PlanCard; cur: Cur; bill: Bill; mine?: boolean; children: React.ReactNode }) {
  const L = useL();
  const base = p.price[cur], yearly = base * 10;
  return (
    <article className={`hp-plan${p.top ? ' top' : ''}${mine ? ' mine' : ''}`} style={{ '--c': p.color } as React.CSSProperties}>
      {p.badge && <span className="hp-badge">{L(p.badge)}</span>}
      <div className="hp-head">
        {mine && <span className="hp-mine">{L(T.yours)}</span>}
        <div className="hp-name"><span className="hp-dot" aria-hidden /><h3>{p.name}</h3></div>
        <p className="hp-ideal"><b>{L(T.ideal)}</b> {L(p.ideal)}</p>
      </div>
      <div className="hp-price">
        <div className="hp-price-main">
          {p.id === 'medida' && <span className="hp-per">{L(T.from)}</span>}
          <span className="hp-amount">{fmt(bill === 'm' ? base : yearly / 12, cur)}</span><span className="hp-cur">{cur.toUpperCase()}</span><span className="hp-per">{L(T.perMonth)}</span>
        </div>
        <p className="hp-note">{bill === 'm' ? L(T.billedM) : <>{fmt(yearly, cur)} {L(T.year)}<b>{L(T.save)}{fmt(base * 2, cur)}</b></>}</p>
      </div>
      {p.lead && <p className="hp-inherits">{L(p.lead)}</p>}
      <ul className="hp-key">{p.features.map((f, i) => <li key={i}><b>{L(f.b)}</b>{f.rest && L(f.rest)}</li>)}</ul>
      <dl className="hp-specs">{p.specs.map(([k, v], i) => <div key={i}><dt>{L(k)}</dt><dd>{L(v)}</dd></div>)}</dl>
      {children}
    </article>
  );
}

/** "Which one fits me?": four yes/no questions and the plan they point to. */
export function Finder({ brandName }: { brandName: string }) {
  const L = useL();
  const [a, setA] = useState({ pages: false, team: false, chat: false, app: false });
  const key = a.app ? 'ent' : a.chat ? 'ultra' : a.pages || a.team ? 'pro' : 'esencial';
  return (
    <section>
      <h2>{L(['¿Cuál ', 'Which one '])}<b>{L(['me sirve?', 'fits me?'])}</b></h2>
      <div className="hp-finder">
        <div>
          {FINDER.map((q) => (
            <div key={q.id} className="hp-q"><p>{L(q.q)}</p>
              <div className="hp-seg">{[true, false].map((v) => <button key={String(v)} type="button" aria-pressed={a[q.id] === v} onClick={() => setA({ ...a, [q.id]: v })}>{L(v ? T.yes : T.no)}</button>)}</div>
            </div>
          ))}
        </div>
        <div className="hp-result" aria-live="polite">
          <span className="hp-eyebrow">{L(T.pick)}</span>
          <span className="hp-r-name">{PICKS[key].name}</span>
          <p>{L(PICKS[key].why)}</p>
          <a className="hp-btn primary" href={wa(`${PICKS[key].name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(T.start)}</a>
        </div>
      </div>
    </section>
  );
}

/** The three web plans side by side; the current one is shaded. */
export function Compare({ current }: { current?: string | null }) {
  const L = useL();
  const hi = current ?? 'ultra';
  return (
    <section>
      <h2>{L(['Compara ', 'Compare '])}<b>{L(['los tres planes', 'the three plans'])}</b></h2>
      <div className="hp-table">
        <table>
          <thead><tr><th scope="col" />{WEB_PLANS.map((p) => <th key={p.id} scope="col" className={p.id === hi ? 'hp-us' : undefined}>{p.name}</th>)}</tr></thead>
          {COMPARE.map((g) => (
            <tbody key={g.group[0]}>
              <tr className="hp-group"><th colSpan={4} scope="colgroup">{L(g.group)}</th></tr>
              {g.rows.map(([label, ...cells]) => (
                <tr key={label[0]}>
                  <th scope="row">{L(label)}</th>
                  {cells.map((c, i) => <td key={i} className={[WEB_PLANS[i].id === hi && 'hp-us', c[0] === '✓' && 'hp-ok', c[0] === '–' && 'hp-no'].filter(Boolean).join(' ') || undefined}>{L(c)}</td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="hp-small">{L(['Soporte técnico en todos los planes: caídas, errores del sitio o del editor, certificado HTTPS, dominio y actualizaciones de seguridad. Por WhatsApp, correo o solicitud en Braindy App, de lunes a viernes de 8:00 a 18:00, hora Colombia. Los cambios de contenido los hace tu equipo.', 'Technical support on every plan: outages, site or editor errors, HTTPS certificate, domain and security updates. By WhatsApp, email or a request in Braindy App, Monday to Friday 8:00–18:00 Colombia time. Content changes are made by your team.'])}</p>
    </section>
  );
}

/** Add-on or module cards: name, monthly price, what it does and the fine print. */
export function PriceCards({ title, lead, items, cur, plus }: {
  title: [Tx, Tx]; lead: Tx; cur: Cur; plus?: boolean;
  items: Array<{ name: Tx; for?: string; price: Record<Cur, number>; body: Tx; note?: Tx }>;
}) {
  const L = useL();
  return (
    <section>
      <h2>{L(title[0])}<b>{L(title[1])}</b></h2>
      <p className="hp-lead">{L(lead)}</p>
      <div className="hp-grid3">
        {items.map((x) => (
          <article key={x.name[0]} className="hp-card">
            {x.for && <span className="hp-where">{x.for}</span>}
            <div className="hp-card-top"><h3>{L(x.name)}</h3><span className="hp-m-price">{plus ? '+' : ''}{fmt(x.price[cur], cur)} <span>{cur.toUpperCase()} {L(T.perMonth)}</span></span></div>
            <p>{L(x.body)}</p>
            {x.note && <p className="hp-extra">{L(x.note)}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
