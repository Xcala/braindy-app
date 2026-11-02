import type { Brand } from '../brands/BrandProvider';
import { inkOn } from '../brands/identity/useCopy';
import { Explainer, ExampleRow, fontOf, useBrandKit, type Kit } from './Explainer';
import { useL } from './HostingParts';

/** The top of the Summary, Site and Payments tabs of Mi plan: what each part is, told with an animation and small examples in the brand's kit. */

const Logo = ({ kit, white }: { kit: Kit; white?: boolean }) => kit.logo
  ? <img src={kit.logo} alt="" style={{ height: 16, maxWidth: 90, objectFit: 'contain', objectPosition: 'left', filter: white ? 'brightness(0) invert(1)' : undefined }} />
  : <b className="t-xs">{kit.name}</b>;
const Lines = ({ w }: { w: number[] }) => <span className="ex-lines">{w.map((x, i) => <i key={i} style={{ width: `${x}%` }} />)}</span>;

export function SummaryIntro({ brand }: { brand: Brand }) {
  const L = useL();
  const kit = useBrandKit(brand);
  const steps: Array<[string, string]> = [
    [L(['Firmas el contrato', 'You sign the contract']), L(['Aquí mismo, sin imprimir nada.', 'Right here, nothing to print.'])],
    [L(['Arrancamos', 'We kick off']), L(['Con un cronograma por semanas.', 'With a week-by-week schedule.'])],
    [L(['Recibes entregas', 'You get deliveries']), L(['Cada pieza con sus versiones.', 'Each piece with its versions.'])],
    [L(['Lanzamos', 'We launch']), L(['Tu marca y tu sitio en vivo.', 'Your brand and site go live.'])],
    [L(['Lo cuidamos', 'We take care of it']), L(['Mes a mes, si tienes plan de cuidado.', 'Month by month, with a care plan.'])],
  ];
  const ff = fontOf(kit);
  return (
    <div className="col g32">
      <Explainer label={L(['Resumen', 'Summary'])} title={L(['Tu proyecto, ', 'Your project, '])} strong={L(['de principio a fin.', 'start to finish.'])}
        lead={L(['Aquí ves lo que compraste, el contrato y cómo avanza. Todo en un solo lugar, siempre al día.', 'Here you see what you bought, the contract and how it moves. All in one place, always up to date.'])}
        steps={steps} stage={<>
          <div className="ex-layer ex-b1"><div className="ex-card sm-doc"><Logo kit={kit} /><Lines w={[90, 70, 80]} />
            <svg className="sm-sign" viewBox="0 0 120 34"><path stroke={kit.c1} d="M4 24c10-18 18-18 16 0s10-14 18-6 8 10 16-2 12-8 16 4 14-6 22-4 14 4 20 0" /></svg>
            <span className="ex-pill ex-ok" style={{ justifySelf: 'start' }}>✓ {L(['Firmado', 'Signed'])}</span></div></div>
          <div className="ex-layer ex-b2"><div className="ex-card sm-gantt">
            {[[0, 45, kit.c1], [20, 60, kit.c3], [45, 40, kit.c2], [70, 30, kit.c1]].map(([l, w, c], i) => (
              <div key={i}><span>S{i + 1}</span><span><i style={{ marginLeft: `${l}%`, width: `${w}%`, background: c as string, animationDelay: `${i * 0.15}s` }} /></span></div>
            ))}</div></div>
          <div className="ex-layer ex-b3"><div className="sm-thumbs">
            {[kit.c1, kit.c2, kit.c3].map((c, i) => <div key={i} style={{ background: c, color: inkOn(c), fontFamily: ff }}><span className="ex-pill" style={{ padding: '4px 7px' }}>v{i === 1 ? 2 : 1}</span></div>)}</div></div>
          <div className="ex-layer ex-b4"><div className="ex-card sm-live"><div className="sm-live-top"><i /><i /><i /></div>
            <div className="sm-live-body" style={{ background: kit.c1 }}><Logo kit={kit} white={inkOn(kit.c1) === '#FFFFFF'} /></div>
            <div style={{ padding: 10 }}><span className="ex-pill ex-ok"><span className="ex-dot" /> {L(['En vivo', 'Live'])}</span></div></div></div>
          <div className="ex-layer ex-b5"><div className="col g8" style={{ alignItems: 'center' }}><div className="sm-shield" style={{ background: kit.c1 }}>✓</div><span className="ex-pill">{L(['Cuidado mensual', 'Monthly care'])}</span></div></div>
          <div className="sm-track"><b style={{ background: kit.c1 }} />{[0, 25, 50, 75, 100].map((x, i) => <i key={x} className={i ? `ex-f${i + 1}` : ''} style={{ left: `${x}%`, borderColor: kit.c1 }} />)}</div>
        </>} />
      <ExampleRow title={L(['Todo tu proyecto en un lugar', 'Your whole project in one place'])} items={[
        { key: 'c', label: L(['Contrato', 'Contract']), note: L(['Lo firmas y lo descargas', 'Sign it and download it']), art: <div className="ex-card ex-art-doc"><Logo kit={kit} /><Lines w={[90, 60, 75]} /><span className="ex-pill ex-ok" style={{ justifySelf: 'start', padding: '4px 7px' }}>✓ PDF</span></div> },
        { key: 'g', label: L(['Cronograma', 'Schedule']), note: L(['Semana a semana', 'Week by week']), art: <div className="ex-card sm-gantt" style={{ width: 140 }}>{[[0, 50, kit.c1], [30, 50, kit.c3], [60, 40, kit.c2]].map(([l, w, c], i) => <div key={i}><span>S{i + 1}</span><span><i style={{ marginLeft: `${l}%`, width: `${w}%`, background: c as string, animation: 'none' }} /></span></div>)}</div> },
        { key: 'd', label: L(['Entregas', 'Deliveries']), note: L(['Con versiones y ajustes', 'With versions and changes']), art: <div className="sm-thumbs">{[kit.c2, kit.c1].map((c, i) => <div key={i} style={{ background: c, width: 56, height: 70 }}><span className="ex-pill" style={{ padding: '3px 6px' }}>v{i + 1}</span></div>)}</div> },
        { key: 'k', label: L(['Lista de arranque', 'Kickoff checklist']), note: L(['Lo que necesitamos de ti', 'What we need from you']), art: <div className="ex-card ex-art-check">{[L(['Accesos', 'Access']), L(['Logo', 'Logo']), L(['Fotos', 'Photos'])].map((x, i) => <span key={x}><i className={i < 2 ? 'on' : ''}>{i < 2 ? '✓' : ''}</i>{x}</span>)}</div> },
      ]} />
    </div>
  );
}

export function SiteIntro({ brand }: { brand: Brand }) {
  const L = useL();
  const kit = useBrandKit(brand);
  const ff = fontOf(kit);
  const steps: Array<[string, string]> = [
    [L(['Diseñamos tu sitio', 'We design your site']), L(['Con tu marca, listo para vender.', 'On-brand, ready to sell.'])],
    [L(['Tu equipo entra al editor', 'Your team opens the editor']), L(['Sin código y sin esperar a nadie.', 'No code, no waiting on anyone.'])],
    [L(['Cambia textos y fotos', 'Changes text and photos']), L(['Haciendo clic sobre la página.', 'By clicking on the page.'])],
    [L(['Publica con un clic', 'Publishes in one click']), L(['Y el cambio ya está en vivo.', 'And the change is live.'])],
    [L(['Nosotros lo cuidamos', 'We look after it']), L(['En línea, rápido y seguro.', 'Online, fast and secure.'])],
  ];
  const ink = inkOn(kit.c1);
  return (
    <div className="col g32">
      <Explainer label={L(['Sitio y apps', 'Site and apps'])} title={L(['Tu sitio, ', 'Your site, '])} strong={L(['en tus manos.', 'in your hands.'])}
        lead={L(['Tu equipo edita el sitio por su cuenta y nosotros nos encargamos de que siempre esté en línea. Aquí ves también las apps con las que funciona tu marca.', 'Your team edits the site on its own and we keep it online. Here you also see the apps your brand runs on.'])}
        steps={steps} stage={<>
          <div className="ex-center"><div className="ex-card st-browser">
            <div className="st-nav" style={{ background: kit.c2 }}>{kit.logo ? <img src={kit.logo} alt="" /> : <b className="t-xs" style={{ color: '#fff' }}>{kit.name}</b>}<span className="ex-lines" style={{ width: 60 }}><i style={{ background: 'rgba(255,255,255,.4)' }} /></span></div>
            <div className="st-hero" style={{ background: kit.c1, color: ink, fontFamily: ff }}>
              <div className="st-h"><span className="ex-gone3">{L(['Bienvenidos a ', 'Welcome to '])}{kit.name}</span><span className="ex-f3">{L(['¡Nueva temporada ya disponible!', 'New season now available!'])}</span></div>
              <span className="st-btn" style={{ background: kit.c3, color: inkOn(kit.c3) }}>{L(['Escríbenos', 'Contact us'])}</span>
              <div className="st-edit ex-b2"><em>{L(['Editar', 'Edit'])}</em></div>
            </div>
            <div style={{ padding: 12 }}><Lines w={[80, 55]} /></div>
          </div></div>
          <span className="st-cursor">👆</span>
          <span className="st-btn st-publish ex-b4">{L(['Publicar', 'Publish'])} ✓</span>
          <div className="st-status"><div className="ex-f5 row g8"><span className="ex-pill ex-ok"><span className="ex-dot" /> {L(['En línea', 'Online'])}</span><span className="ex-pill">⚡ {L(['Rápido', 'Fast'])}</span><span className="ex-pill">🔒 {L(['Seguro', 'Secure'])}</span></div></div>
        </>} />
      <ExampleRow title={L(['Lo que tu equipo puede hacer', 'What your team can do'])} items={[
        { key: 't', label: L(['Cambiar textos', 'Change text']), note: L(['Clic y escribe', 'Click and type']), art: <div className="ex-card ex-art-doc" style={{ fontFamily: ff }}><b style={{ fontSize: 13, outline: `2px dashed ${kit.c1}`, outlineOffset: 3, borderRadius: 4 }}>{L(['Tu titular', 'Your headline'])}</b><Lines w={[90, 70]} /></div> },
        { key: 'p', label: L(['Cambiar fotos', 'Change photos']), note: L(['Sube y encuadra', 'Upload and crop']), art: <div className="ex-card" style={{ width: 120, height: 90, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${kit.c1}, ${kit.c3})`, color: '#fff', fontSize: 26 }}>⤒</div> },
        { key: 'w', label: L(['Botones a WhatsApp', 'WhatsApp buttons']), note: L(['O a donde quieras', 'Or anywhere you want']), art: <span className="st-btn" style={{ background: '#25D366', color: '#fff', fontSize: 13, padding: '10px 16px' }}>WhatsApp →</span> },
        { key: 's', label: L(['Ver el estado', 'See its status']), note: L(['Siempre a la vista', 'Always in view']), art: <span className="ex-pill ex-ok" style={{ fontSize: 13, padding: '9px 14px' }}><span className="ex-dot" /> {L(['En línea', 'Online'])}</span> },
      ]} />
    </div>
  );
}

export function PaymentsIntro({ brand }: { brand: Brand }) {
  const L = useL();
  const kit = useBrandKit(brand);
  const steps: Array<[string, string]> = [
    [L(['Te llega el cobro', 'The charge arrives']), L(['Con el valor y lo que incluye.', 'With the amount and what it covers.'])],
    [L(['Pagas como prefieras', 'You pay as you like']), L(['Con tarjeta o por transferencia.', 'By card or bank transfer.'])],
    [L(['Queda pagado', 'It is paid']), L(['La transferencia se confirma en menos de 24 h.', 'Transfers are confirmed within 24 h.'])],
    [L(['Recibes el comprobante', 'You get the receipt']), L(['En tu correo.', 'In your email.'])],
    [L(['Ves el próximo cobro', 'You see the next charge']), L(['Aquí, sin sorpresas.', 'Here, no surprises.'])],
  ];
  return (
    <div className="col g32">
      <Explainer label={L(['Pagos', 'Payments'])} title={L(['Pagas fácil, ', 'Pay easily, '])} strong={L(['sin sorpresas.', 'no surprises.'])}
        lead={L(['Tu plan, lo que se cobra y cuándo. Braindy no ve ni guarda datos de tu tarjeta: el pago se hace en la página segura del proveedor.', 'Your plan, what is charged and when. Braindy never sees or stores your card details: you pay on the provider’s secure page.'])}
        steps={steps} stage={<>
          <div className="ex-center"><div className="ex-card py-inv">
            <Logo kit={kit} />
            <span className="t-xs t-mute">{L(['Cobro', 'Charge'])} · {brand.name}</span>
            <span className="py-amount" style={{ color: kit.c1 }}>$ ••••</span>
            <Lines w={[85, 60]} />
            <div className="py-methods"><span className="ex-glow">💳 {L(['Tarjeta', 'Card'])}</span><span className="ex-glow">🏦 {L(['Transferencia', 'Transfer'])}</span></div>
            <span className="py-stamp-at"><span className="py-stamp ex-f3">{L(['PAGADO', 'PAID'])}</span></span>
          </div></div>
          <div className="py-mail ex-b4"><span className="ex-pill">✉️ {L(['Comprobante en tu correo', 'Receipt in your email'])}</span></div>
          <div className="ex-card py-cal ex-f5"><b style={{ background: kit.c1 }}>{L(['Próximo cobro', 'Next charge'])}</b><strong>1</strong><small>{L(['del próximo mes', 'of next month'])}</small></div>
        </>} />
      <ExampleRow title={L(['Así puedes pagar', 'How you can pay'])} items={[
        { key: 'c', label: L(['Tarjeta', 'Card']), note: L(['En la página segura del proveedor', 'On the provider’s secure page']), art: <div className="ex-art-cc" style={{ background: `linear-gradient(135deg, ${kit.c2}, ${kit.c1})` }}><i /><span>•••• 4242</span></div> },
        { key: 't', label: L(['Transferencia', 'Bank transfer']), note: L(['Pegas la referencia y la confirmamos', 'Paste the reference and we confirm it']), art: <div className="ex-card ex-art-doc"><span className="t-xs w7">🏦 {L(['Referencia', 'Reference'])}</span><Lines w={[90]} /><span className="ex-pill ex-ok" style={{ justifySelf: 'start', padding: '4px 7px' }}>✓ &lt; 24 h</span></div> },
        { key: 'r', label: L(['Comprobante', 'Receipt']), note: L(['Llega a tu correo', 'Arrives in your email']), art: <div className="ex-card ex-art-doc"><Logo kit={kit} /><Lines w={[80, 60, 70]} /><span className="t-xs w7" style={{ color: '#1F9D5C' }}>✓ {L(['Pagado', 'Paid'])}</span></div> },
        { key: 'n', label: L(['Próximo cobro', 'Next charge']), note: L(['Siempre a la vista', 'Always in view']), art: <div className="ex-card py-cal" style={{ position: 'static' }}><b style={{ background: kit.c1 }}>{L(['Próximo', 'Next'])}</b><strong>1</strong><small>{L(['del mes', 'of the month'])}</small></div> },
      ]} />
    </div>
  );
}
