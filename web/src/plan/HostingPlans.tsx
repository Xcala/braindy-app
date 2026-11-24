import { useConfirm } from '../components/useConfirm';
import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ADDONS, CHECKOUT, ENTERPRISE, MODULES, WEB_PLANS, type Bill, type Cur, type WebPlan } from './hostingData';
import { Compare, Finder, Plan, PriceCards, useL } from './HostingParts';
import { Faq, Glossary, Tech } from './HostingInfo';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
import { billingApi, type Plan as Billing } from '../billing/useBilling';
import { HostingStatus } from './HostingStatus';
import './hosting.css';

const STEP = 72;
/** Staircase, as on the pricing page: on desktop each card is at least STEP px taller than the one before. */
function useLadder(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => ref.current?.querySelectorAll<HTMLElement>('.hp-plans').forEach((group) => {
      const cards = [...group.querySelectorAll<HTMLElement>('.hp-plan')];
      cards.forEach((c) => c.style.removeProperty('--h'));
      if (window.innerWidth <= 900) return;
      let prev = 0;
      cards.forEach((c, i) => { const h = i === 0 ? c.offsetHeight : Math.max(c.offsetHeight, prev + STEP); c.style.setProperty('--h', `${h}px`); prev = h; });
    });
    fit();
    void document.fonts?.ready.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [dep]);
  return ref;
}

/** In Mi plan · The website hosting offer with the pricing page's design: Sitios web and Enterprise tabs, currency and billing
 *  toggles, plan cards (the brand's current plan marked), plan finder, comparison, add-ons, agency note and modules. */
export function HostingPlans({ current, brandName, brandId, paid, billing }: { current?: WebPlan | null; brandName: string; brandId?: string; paid?: boolean; billing?: Billing | null }) {
  const { lang } = useI18n();
  const [dialog, ask] = useConfirm();
  const L = useL();
  const wa = useNicoWhatsApp();
  const [tab, setTab] = useState<'web' | 'ent'>('web');
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  const [bill, setBill] = useState<Bill>('m');
  // The plans stay in view; add-ons, the comparison and the questions open on request so Mi plan stays short.
  const [more, setMore] = useState(false);
  // Paid: the status card is enough, the plans open on «Cambiar de plan». Unpaid or no plan: the plans show, to pay.
  const [plans, setPlans] = useState(!paid);
  const plansRef = useRef<HTMLDivElement>(null);
  const moreBtn = (
    <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'center' }} aria-expanded={more} onClick={() => setMore((m) => !m)}>
      {more ? L(['Ver menos', 'See less']) : L(['Ver complementos, comparación y preguntas', 'See add-ons, comparison and questions'])}
    </button>
  );
  // Signed in: the payment is tied to the brand (Stripe Checkout, or a prorated switch if hosting is already paid).
  const [busy, setBusy] = useState<WebPlan | null>(null);
  const back = new URLSearchParams(window.location.search).get('hosting');
  const [msg, setMsg] = useState<{ ok: boolean; text: string; plan: string } | null>(back === 'ok'
    ? { ok: true, text: L(['Recibimos tu pago. Tu plan de hosting queda activo en unos segundos.', 'We got your payment. Your hosting plan turns active in a few seconds.']), plan: '' }
    : back === 'canceled' ? { ok: false, text: L(['No se hizo ningún cobro. Puedes intentarlo de nuevo o escribirnos.', 'Nothing was charged. Try again or write us.']), plan: '' } : null);
  const buy = async (p: WebPlan, name: string, c: Cur = cur, b: Bill = bill) => {
    if (!brandId) return;
    if (paid && current && !(await ask({ title: L(['¿Cambiar tu hosting al plan ' + name + '?', 'Switch your hosting to ' + name + '?']), body: L(['La diferencia se ajusta en tu próximo cobro.', 'The difference is adjusted on your next charge.']), confirmLabel: L(['Cambiar de plan', 'Switch plan']) }))) return;
    setBusy(p); setMsg(null);
    try {
      const r = await billingApi.hosting(brandId, { plan: p, cur: c, bill: b });
      if (r.url) { window.location.assign(r.url); return; }
      setMsg({ ok: true, text: L(['Listo: tu hosting ahora es ' + name + '.', 'Done: your hosting is now ' + name + '.']), plan: name });
    } catch {
      setMsg({ ok: false, text: L(['No pudimos abrir el pago en línea. Escríbenos y lo activamos contigo.', 'We could not open online payment. Write us and we set it up with you.']), plan: name });
    }
    setBusy(null);
  };
  const ref = useLadder(`${tab}${cur}${bill}${lang}${plans}`);
  const late = billing?.hostingPaused || billing?.hostingStatus === 'past_due';
  // Overdue: straight to paying (Stripe portal) in the plan's own currency. Otherwise open the plans and bring them into view.
  const onAct = () => {
    if (late && current) { void buy(current, current, billing?.hostingCur ?? cur, billing?.hostingBill ?? bill); return; }
    setPlans(true); setTimeout(() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div ref={ref} className="hp" aria-labelledby="hp-title">
      {dialog}
      {brandId && current && <HostingStatus plan={billing ?? null} onAct={onAct} />}
      {late && !plans && msg && <p role="status" className={`hp-msg${msg.ok ? ' ok' : ''}`}>{msg.text}</p>}

      {plans && <div ref={plansRef} className="col g24" style={{ scrollMarginTop: '5rem' }}>
      <div className="hp-bar">
        <div className="hp-seg hp-tabs" role="tablist">
          {(['web', 'ent'] as const).map((k) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{k === 'web' ? L(['Sitios web', 'Websites']) : 'Enterprise'}</button>)}
        </div>
        <div className="hp-toggles">
          <div className="hp-seg" role="group" aria-label="Currency">{(['usd', 'cop'] as const).map((c) => <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}>{c.toUpperCase()}</button>)}</div>
          <div className="hp-seg" role="group" aria-label="Billing">
            <button type="button" aria-pressed={bill === 'm'} onClick={() => setBill('m')}>{L(['Mensual', 'Monthly'])}</button>
            <button type="button" aria-pressed={bill === 'y'} onClick={() => setBill('y')}>{L(['Anual', 'Yearly'])} <span className="hp-save">{L(['2 meses gratis', '2 months free'])}</span></button>
          </div>
        </div>
      </div>

      {tab === 'web' ? (
        <div className="hp-panel" role="tabpanel">
          <div className="hp-plans">
            {WEB_PLANS.map((p) => (
              <Plan key={p.id} p={p} cur={cur} bill={bill} mine={current === p.id}>
                {(current !== p.id || (brandId && !paid)) && (
                  <div className="hp-buy">
                    {brandId
                      ? <button type="button" className={`hp-btn${p.top || current === p.id ? ' primary' : ''}`} disabled={!!busy} onClick={() => void buy(p.id, p.name)}>{busy === p.id ? L(['Abriendo el pago…', 'Opening payment…']) : current === p.id ? L(['Activar el pago de mi plan', 'Start paying my plan']) : current ? L(['Cambiar a este plan', 'Switch to this plan']) : L(['Quiero este plan', 'I want this plan'])}</button>
                      : <a className={`hp-btn${p.top ? ' primary' : ''}`} href={`${CHECKOUT}?plan=${p.id}&cur=${cur}&bill=${bill}`} target="_blank" rel="noreferrer">{current ? L(['Cambiar a este plan', 'Switch to this plan']) : L(['Quiero este plan', 'I want this plan'])}</a>}
                    <a className="hp-alt" href={wa(`Hosting ${p.name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(['o escríbenos por WhatsApp', 'or write us on WhatsApp'])}</a>
                  </div>
                )}
              </Plan>
            ))}
          </div>
          {msg && <p role="status" className={`hp-msg${msg.ok ? ' ok' : ''}`}>{msg.text}{!msg.ok && <> <a href={wa(`Hosting ${msg.plan} · ${brandName}`)} target="_blank" rel="noreferrer">WhatsApp</a></>}</p>}
          {moreBtn}
          {more && <>
          <PriceCards title={[['Complementos ', 'Add-ons '], ['para cualquier plan', 'for any plan']]} lead={['Agrégalos cuando los necesites y quítalos cuando quieras. Se suman al valor mensual de tu plan.', 'Add them when you need them and remove them anytime. They add to your monthly plan.']} items={ADDONS} cur={cur} plus two />
          <Finder brandName={brandName} />
          <Compare current={current} />
          <aside className="hp-agency" aria-label="Fee">
            <h3>{L(['¿Ya tienes ', 'Already have a '])}<b>{L(['fee mensual de agencia', 'monthly agency fee'])}</b>{L([' con Braindy?', ' with Braindy?'])}</h3>
            <p>{L(['Entonces ', 'Then '])}<b>{L(['nosotros nos encargamos de todo', 'we take care of everything'])}</b>{L([': diseño, montaje, páginas nuevas y cambios de contenido, dentro de tu fee. El plan de hosting se paga aparte del fee: cubre que el sitio esté en línea, rápido y seguro, sin importar quién edite.', ': design, build, new pages and content changes, within your fee. Hosting is paid apart from the fee: it keeps the site online, fast and secure, no matter who edits.'])}</p>
          </aside>
          </>}
        </div>
      ) : (
        <div className="hp-panel" role="tabpanel">
          <header className="hp-hero">
            <span className="hp-eyebrow">{L(['Enterprise · Apps, dashboards y plataformas', 'Enterprise · Apps, dashboards and platforms'])}</span>
            <h2>{L(['Cuando tu sitio ', 'When your site '])}<b>{L(['se vuelve una app', 'becomes an app'])}</b></h2>
            <p>{L(['Para medios digitales con mucho tráfico, áreas privadas con login, onboarding de clientes, emailing, dashboards y apps. Cada plan corre en un ', 'For high-traffic media, private areas with login, client onboarding, emailing, dashboards and apps. Each plan runs in its '])}<b>{L(['proyecto de Google Cloud propio', 'own Google Cloud project'])}</b>{L([', separado de los demás clientes.', ', apart from other clients.'])}</p>
          </header>
          <div className="hp-plans">
            {ENTERPRISE.map((p) => (
              <Plan key={p.id} p={p} cur={cur} bill={bill}>
                <a className="hp-btn primary" href={wa(`Enterprise ${p.name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(['Agenda una llamada', 'Book a call'])}</a>
              </Plan>
            ))}
          </div>
          {moreBtn}
          {more && <PriceCards title={[['Módulos ', 'Development '], ['de desarrollo', 'modules']]} lead={['Se suman a cualquier plan Enterprise. El valor mensual cubre operación, infraestructura y soporte del módulo. El desarrollo inicial se cotiza una vez, según lo que necesites.', 'They add to any Enterprise plan. The monthly fee covers the module’s operation, infrastructure and support. The initial build is quoted once, based on what you need.']} items={MODULES} cur={cur} />}
        </div>
      )}

      {more && <><Glossary /><Faq /><Tech /></>}
      </div>}
    </div>
  );
}
