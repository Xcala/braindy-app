import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ADDONS, CHECKOUT, ENTERPRISE, MODULES, WEB_PLANS, type Bill, type Cur, type WebPlan } from './hostingData';
import { Compare, Featured, Finder, Plan, PriceCards, useL } from './HostingParts';
import { Faq, Glossary, Sign, Tech } from './HostingInfo';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
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
export function HostingPlans({ current, brandName }: { current?: WebPlan | null; brandName: string }) {
  const { lang } = useI18n();
  const L = useL();
  const wa = useNicoWhatsApp();
  const [tab, setTab] = useState<'web' | 'ent'>('web');
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  const [bill, setBill] = useState<Bill>('m');
  const ref = useLadder(`${tab}${cur}${bill}${lang}`);

  return (
    <div ref={ref} className="hp" aria-labelledby="hp-title">
      <header className="hp-hero">
        <span className="hp-eyebrow">{L(['Braindy · Planes de sitio web y Enterprise', 'Braindy · Website and Enterprise plans'])}</span>
        <h2 id="hp-title"><span>{L(['Tu sitio, ', 'Your site, '])}</span><b>{L(['en tus manos', 'in your hands'])}</b></h2>
        <p>{L(['Diseñamos y publicamos tu sitio. Después, ', 'We design and publish your site. Then '])}<b>{L(['tu equipo lo edita por su cuenta', 'your team edits it on its own'])}</b>{L([', sin código, y nosotros nos encargamos de que siempre esté en línea, rápido y seguro.', ', no code, and we keep it always online, fast and secure.'])}</p>
      </header>

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
                {current !== p.id && (
                  <div className="hp-buy">
                    <a className={`hp-btn${p.top ? ' primary' : ''}`} href={`${CHECKOUT}?plan=${p.id}&cur=${cur}&bill=${bill}`} target="_blank" rel="noreferrer">{current ? L(['Cambiar a este plan', 'Switch to this plan']) : L(['Quiero este plan', 'I want this plan'])}</a>
                    <a className="hp-alt" href={wa(`Hosting ${p.name} · ${brandName}`)} target="_blank" rel="noreferrer">{L(['o escríbenos por WhatsApp', 'or write us on WhatsApp'])}</a>
                  </div>
                )}
              </Plan>
            ))}
          </div>
          <PriceCards title={[['Complementos ', 'Add-ons '], ['para cualquier plan', 'for any plan']]} lead={['Agrégalos cuando los necesites y quítalos cuando quieras. Se suman al valor mensual de tu plan.', 'Add them when you need them and remove them anytime. They add to your monthly plan.']} items={ADDONS} cur={cur} plus two>
            <Featured cur={cur} brandName={brandName} />
          </PriceCards>
          <Finder brandName={brandName} />
          <Compare current={current} />
          <aside className="hp-agency" aria-label="Fee">
            <h3>{L(['¿Ya tienes ', 'Already have a '])}<b>{L(['fee mensual de agencia', 'monthly agency fee'])}</b>{L([' con Braindy?', ' with Braindy?'])}</h3>
            <p>{L(['Entonces ', 'Then '])}<b>{L(['nosotros nos encargamos de todo', 'we take care of everything'])}</b>{L([': diseño, montaje, páginas nuevas y cambios de contenido, dentro de tu fee. El plan de hosting se paga aparte del fee: cubre que el sitio esté en línea, rápido y seguro, sin importar quién edite.', ': design, build, new pages and content changes, within your fee. Hosting is paid apart from the fee: it keeps the site online, fast and secure, no matter who edits.'])}</p>
          </aside>
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
          <PriceCards title={[['Módulos ', 'Development '], ['de desarrollo', 'modules']]} lead={['Se suman a cualquier plan Enterprise. El valor mensual cubre operación, infraestructura y soporte del módulo. El desarrollo inicial se cotiza una vez, según lo que necesites.', 'They add to any Enterprise plan. The monthly fee covers the module’s operation, infrastructure and support. The initial build is quoted once, based on what you need.']} items={MODULES} cur={cur} />
        </div>
      )}

      <Glossary />
      <Faq />
      <Tech />
      <Sign />
    </div>
  );
}
