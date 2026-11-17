import { useI18n } from '../i18n/I18nProvider';
import type { Plan } from '../billing/useBilling';
import { useL } from './HostingParts';

const NAME = { esencial: 'Esencial', pro: 'Pro', ultra: 'Ultra' } as const;

/** The brand's website hosting at a glance: plan, whether it is paid, next charge, and the one action that matters now.
 *  Opens the Sitio tab and also sits in Pagos. `onAct` scrolls to the plans (to pay or switch). */
export function HostingStatus({ plan, onAct, compact }: { plan: Plan | null; onAct?: () => void; compact?: boolean }) {
  const L = useL();
  const { lang } = useI18n();
  const h = plan?.hosting;
  if (!h) return null;
  const st = plan?.hostingPaused ? 'paused' : plan?.hostingStatus === 'active' ? 'ok' : plan?.hostingStatus === 'past_due' ? 'late' : 'due';
  const chip = { ok: ['c-active', L(['Al día', 'Paid'])], late: ['c-lost', L(['Pago atrasado', 'Payment overdue'])], paused: ['c-lost', L(['Sitio en pausa', 'Site paused'])], due: ['c-draft', L(['Pago pendiente', 'Payment pending'])] }[st];
  const next = plan?.hostingNextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const note = {
    ok: next ? L([`Próximo cobro: ${next}.`, `Next charge: ${next}.`]) : L(['Tu sitio está en línea y cuidado.', 'Your site is online and looked after.']),
    late: L(['El último cobro no pasó. Actualiza tu tarjeta para que el sitio siga en línea.', 'The last charge did not go through. Update your card so the site stays online.']),
    paused: L(['Tu sitio muestra la página «Sitio en pausa». Vuelve en minutos apenas se pague; no se borró nada.', 'Your site shows the "Site paused" page. It is back minutes after payment; nothing was deleted.']),
    due: L(['Elige pesos o dólares y mensual o anual (el anual trae 2 meses gratis), y activa el pago.', 'Pick pesos or dollars and monthly or yearly (yearly has 2 months free), and start paying.']),
  }[st];
  const act = st === 'ok' ? L(['Cambiar de plan', 'Change plan']) : st === 'due' ? L(['Activar el pago', 'Start paying']) : L(['Pagar ahora', 'Pay now']);
  return (
    <section className={`card col g12${compact ? ' card-tight' : ''}`} aria-labelledby="hs-h" style={st === 'ok' ? undefined : { borderColor: st === 'due' ? '#F5D98A' : '#F3B4B4' }}>
      <div className="row between g8 wrap">
        <span className="col g4"><span className="label">{L(['Hosting de tu sitio web', 'Your website hosting'])}</span>
          <span className="h2" id="hs-h">{L(['Plan ', 'Plan '])}<span className="w9">{NAME[h]}</span>{plan?.hostingBill === 'y' ? L([' · anual', ' · yearly']) : ''}</span></span>
        <span className={`chip ${chip[0]}`}>{chip[1]}</span>
      </div>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{note}</p>
      {onAct && <button type="button" className={`btn btn-sm ${st === 'ok' ? 'btn-secondary' : 'btn-primary'}`} style={{ alignSelf: 'flex-start' }} onClick={onAct}>{act}</button>}
    </section>
  );
}
