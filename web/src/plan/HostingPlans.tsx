import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { CONTACT } from '../proposals/public/copy';
import { ADDONS, CHECKOUT, COMPARE, ENTERPRISE, WEB_PLANS, type Bill, type Cur, type PlanCard, type WebPlan } from './hostingData';

type Tx = readonly [string, string];
const wa = (text: string) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
const fmt = (n: number, cur: Cur) => `$${(cur === 'usd' ? Math.round(n * 100) / 100 : Math.round(n)).toLocaleString('es-CO')}`;
const UI = {
  title: ['Planes de tu sitio web', 'Your website plans'], sub: ['Diseñamos y publicamos tu sitio. Después, tu equipo lo edita por su cuenta, sin código, y nosotros nos encargamos de que siempre esté en línea, rápido y seguro.', 'We design and publish your site. Then your team edits it on its own, no code, and we keep it online, fast and secure.'],
  monthly: ['Mensual', 'Monthly'], yearly: ['Anual · 2 meses gratis', 'Yearly · 2 months free'], perMonth: ['/ mes', '/ month'],
  billedM: ['Facturado cada mes', 'Billed every month'], yearNote: ['{y} al año · ahorras {s}', '{y} a year · you save {s}'],
  ideal: ['Ideal para: ', 'Best for: '], want: ['Quiero este plan', 'I want this plan'], orWa: ['o escríbenos por WhatsApp', 'or write us on WhatsApp'],
  yours: ['Tu plan', 'Your plan'], change: ['Cambiar a este plan', 'Switch to this plan'], none: ['Tu sitio aún no tiene plan de hosting. Elige el que va con qué tan seguido lo cambias.', 'Your site has no hosting plan yet. Pick the one that fits how often you change it.'],
  compare: ['Compara los tres planes', 'Compare the three plans'], support: ['Soporte técnico en todos los planes: caídas, errores del sitio o del editor, HTTPS, dominio y actualizaciones de seguridad. De lunes a viernes de 8:00 a 18:00, hora Colombia. Los cambios de contenido los hace tu equipo.', 'Technical support on every plan: outages, site or editor errors, HTTPS, domain and security updates. Monday to Friday 8:00–18:00 Colombia time. Content changes are made by your team.'],
  addons: ['Complementos para cualquier plan', 'Add-ons for any plan'], addonsSub: ['Agrégalos cuando los necesites y quítalos cuando quieras. Se suman al valor mensual de tu plan.', 'Add them when you need them and remove them anytime. They add to your monthly plan.'],
  fee: ['¿Tienes fee mensual de agencia con Braindy? Entonces nosotros nos encargamos de todo: diseño, montaje, páginas nuevas y cambios de contenido, dentro de tu fee. El hosting se paga aparte: cubre que el sitio esté en línea, rápido y seguro.', 'Do you have a monthly agency fee with Braindy? Then we take care of everything: design, build, new pages and content changes, within your fee. Hosting is paid apart: it keeps the site online, fast and secure.'],
  ent: ['Enterprise · cuando tu sitio se vuelve una app', 'Enterprise · when your site becomes an app'], entSub: ['Para medios con mucho tráfico, áreas privadas con login, emailing, dashboards y apps. Cada plan corre en un proyecto de Google Cloud propio.', 'For high-traffic media, private areas with login, emailing, dashboards and apps. Each plan runs in its own Google Cloud project.'],
  call: ['Agenda una llamada', 'Book a call'], from: ['desde ', 'from '],
} satisfies Record<string, Tx>;

function Price({ p, cur, bill, from }: { p: PlanCard; cur: Cur; bill: Bill; from?: boolean }) {
  const { lang } = useI18n();
  const L = (x: Tx) => x[lang === 'es' ? 0 : 1];
  const base = p.price[cur], yearly = base * 10;
  return (
    <div className="col g4">
      <span className="row g4" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
        {from && <span className="t-sm t-mute">{L(UI.from)}</span>}
        <span className="w9" style={{ fontSize: 34, lineHeight: '38px', letterSpacing: '-.03em' }}>{fmt(bill === 'm' ? base : yearly / 12, cur)}</span>
        <span className="t-sm t-mute">{cur.toUpperCase()} {L(UI.perMonth)}</span>
      </span>
      <span className="t-xs t-mute">{bill === 'm' ? L(UI.billedM) : L(UI.yearNote).replace('{y}', fmt(yearly, cur)).replace('{s}', fmt(base * 2, cur))}</span>
    </div>
  );
}

function Card({ p, cur, bill, mine, other, cta }: { p: PlanCard; cur: Cur; bill: Bill; mine?: boolean; other?: boolean; cta: React.ReactNode }) {
  const { lang } = useI18n();
  const L = (x: Tx) => x[lang === 'es' ? 0 : 1];
  return (
    <article className="card col g16" style={mine ? { borderColor: '#2F4DE0', boxShadow: '0 0 0 2px #2F4DE0' } : other ? { opacity: 0.8 } : undefined}>
      <div className="row g8" style={{ justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
        <span className="h3">{p.name}</span>
        {mine ? <span className="chip c-active">{L(UI.yours)}</span> : p.badge && <span className="chip" style={{ background: '#EEF1FD', color: '#2F4DE0' }}>{L(p.badge)}</span>}
      </div>
      <p className="t-sm" style={{ margin: 0 }}><b>{L(UI.ideal)}</b>{L(p.ideal)}</p>
      <Price p={p} cur={cur} bill={bill} from={p.id === 'medida'} />
      <div className="col g8" style={{ flex: 1 }}>
        {p.lead && <span className="t-sm w7">{L(p.lead)}</span>}
        <ul className="col g8" style={{ margin: 0, paddingLeft: 18 }}>
          {p.features.map((f, i) => <li key={i} className="t-sm"><b>{L(f.b)}</b>{f.rest && L(f.rest)}</li>)}
        </ul>
      </div>
      <dl className="grid grid-cols-2 gap-2" style={{ margin: 0, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        {p.specs.map(([k, v], i) => <div key={i} className="col"><dt className="t-xs t-mute">{L(k)}</dt><dd className="t-sm w7" style={{ margin: 0 }}>{L(v)}</dd></div>)}
      </dl>
      {cta}
    </article>
  );
}

/** In Mi plan · The full website hosting offer: currency and billing toggles, Esencial · Pro · Ultra with what each includes,
 *  the comparison, add-ons and Enterprise. The brand's current plan is outlined; paying goes through the public checkout. */
export function HostingPlans({ current, brandName }: { current?: WebPlan | null; brandName: string }) {
  const { lang } = useI18n();
  const L = (x: Tx) => x[lang === 'es' ? 0 : 1];
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  const [bill, setBill] = useState<Bill>('m');
  const seg = (on: boolean) => ({ border: 0, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: on ? '#0B1220' : 'transparent', color: on ? '#fff' : 'var(--ink)' });
  const pill = { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 999, background: 'var(--niebla, #EEF1F6)' };

  return (
    <section className="col g24" aria-labelledby="plan-hosting">
      <div className="row g16" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="col g4" style={{ maxWidth: 640 }}>
          <h2 id="plan-hosting" className="h2">{L(UI.title)}</h2>
          <p className="t-sm t-mute" style={{ margin: 0 }}>{current ? L(UI.sub) : L(UI.none)}</p>
        </div>
        <div className="row g8" style={{ flexWrap: 'wrap' }}>
          <span style={pill} role="group" aria-label="Currency">{(['usd', 'cop'] as const).map((c) => <button key={c} type="button" aria-pressed={cur === c} style={seg(cur === c)} onClick={() => setCur(c)}>{c.toUpperCase()}</button>)}</span>
          <span style={pill} role="group" aria-label="Billing">{(['m', 'y'] as const).map((b) => <button key={b} type="button" aria-pressed={bill === b} style={seg(bill === b)} onClick={() => setBill(b)}>{L(b === 'm' ? UI.monthly : UI.yearly)}</button>)}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {WEB_PLANS.map((p) => {
          const mine = current === p.id;
          return (
            <Card key={p.id} p={p} cur={cur} bill={bill} mine={mine} other={!!current && !mine} cta={!mine && (
              <div className="col g4">
                <a className={`btn ${p.id === 'pro' ? 'btn-primary' : 'btn-secondary'} btn-sm`} href={`${CHECKOUT}?plan=${p.id}&cur=${cur}&bill=${bill}`} target="_blank" rel="noreferrer">{current ? L(UI.change) : L(UI.want)}</a>
                <a className="t-xs t-mute" style={{ textAlign: 'center' }} href={wa(`Hosting ${p.name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(UI.orWa)}</a>
              </div>
            )} />
          );
        })}
      </div>

      <details className="card card-tight">
        <summary className="w7" style={{ cursor: 'pointer' }}>{L(UI.compare)}</summary>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="t-sm" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th />{WEB_PLANS.map((p) => <th key={p.id} className="w9" style={{ textAlign: 'left', padding: 8, color: current === p.id ? '#2F4DE0' : undefined }}>{p.name}</th>)}</tr></thead>
            {COMPARE.map((g) => (
              <tbody key={g.group[0]}>
                <tr><th colSpan={4} className="label" style={{ textAlign: 'left', padding: '16px 8px 6px' }}>{L(g.group)}</th></tr>
                {g.rows.map(([label, ...cells]) => (
                  <tr key={label[0]} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: 8 }}>{L(label)}</td>
                    {cells.map((c, i) => <td key={i} style={{ padding: 8, color: c[0] === '–' ? 'var(--mute, #8A93A6)' : undefined, fontWeight: c[0] === '✓' ? 900 : undefined }}>{L(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="t-xs t-mute" style={{ margin: '12px 0 0' }}>{L(UI.support)}</p>
      </details>

      <div className="col g12">
        <div className="col g4"><h3 className="h3">{L(UI.addons)}</h3><p className="t-sm t-mute" style={{ margin: 0 }}>{L(UI.addonsSub)}</p></div>
        <div className="grid gap-3 md:grid-cols-3">
          {ADDONS.map((a) => (
            <div key={a.name[0]} className="card card-tight col g8">
              <span className="t-xs t-mute">{a.for}</span>
              <div className="row g8" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}><span className="w9">{L(a.name)}</span><span className="w7">+{fmt(a.price[cur], cur)} {cur.toUpperCase()}</span></div>
              <span className="t-sm">{L(a.body)}</span>
              {a.note && <span className="t-xs t-mute">{L(a.note)}</span>}
            </div>
          ))}
        </div>
      </div>

      <p className="card card-tight t-sm" style={{ margin: 0, background: '#EEF1FD', borderColor: '#C9D2F7' }}>{L(UI.fee)}</p>

      <div className="col g12">
        <div className="col g4"><h3 className="h3">{L(UI.ent)}</h3><p className="t-sm t-mute" style={{ margin: 0, maxWidth: 720 }}>{L(UI.entSub)}</p></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {ENTERPRISE.map((p) => (
            <Card key={p.id} p={p} cur={cur} bill={bill} cta={<a className="btn btn-secondary btn-sm" href={wa(`Enterprise ${p.name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(UI.call)}</a>} />
          ))}
        </div>
      </div>
    </section>
  );
}
