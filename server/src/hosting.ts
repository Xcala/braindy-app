// Public checkout for the website hosting plans (Esencial, Pro, Ultra) on the client-facing pricing page.
// No login: the page links to GET /public/hosting/checkout?plan=pro&cur=usd&bill=m, the server sets the amount
// (never the browser) and redirects to Stripe Checkout. Without Stripe keys it falls back to WhatsApp.
// The webhook records each paid signup in hostingSignups/{sessionId} for Nicolas to create the brand.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { stripe, stripeConfigured, toMinor } from './stripe.js';

const API_BASE = process.env.API_PUBLIC_URL ?? 'https://braindy-api-283103160183.us-central1.run.app';
const WHATSAPP = '16692633378';

/** Monthly prices in major units. Annual = 10 months (2 free). Keep in sync with the pricing page. */
export const HOSTING_PLANS = {
  esencial: { name: 'Esencial', usd: 5, cop: 19900 },
  pro: { name: 'Pro', usd: 15, cop: 59900 },
  ultra: { name: 'Ultra', usd: 35, cop: 139900 },
} as const;
type PlanKey = keyof typeof HOSTING_PLANS;
type Cur = 'usd' | 'cop';
type Bill = 'm' | 'y';

export function hostingPrice(plan: PlanKey, cur: Cur, bill: Bill) {
  const monthly = HOSTING_PLANS[plan][cur];
  return bill === 'y' ? monthly * 10 : monthly;
}

const waLink = (plan: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero el plan ${plan} de Braindy para mi sitio web.`)}`;

export const hostingCheckout = new Hono();

hostingCheckout.get('/hosting/checkout', async (c) => {
  const plan = c.req.query('plan') as PlanKey;
  const cur = (c.req.query('cur') === 'cop' ? 'cop' : 'usd') as Cur;
  const bill = (c.req.query('bill') === 'y' ? 'y' : 'm') as Bill;
  if (!Object.hasOwn(HOSTING_PLANS, plan)) return c.json({ error: 'invalid_plan' }, 400);
  const { name } = HOSTING_PLANS[plan];
  if (!stripeConfigured()) return c.redirect(waLink(name), 303);

  const meta = { kind: 'hosting', plan, cur, bill };
  const session = await stripe<{ url: string }>('POST', 'checkout/sessions', {
    mode: 'subscription', locale: 'es', allow_promotion_codes: true,
    billing_address_collection: 'required', phone_number_collection: { enabled: true }, tax_id_collection: { enabled: true },
    success_url: `${API_BASE}/public/hosting/gracias?state=ok`, cancel_url: `${API_BASE}/public/hosting/gracias?state=canceled&plan=${plan}`,
    metadata: meta, subscription_data: { metadata: meta },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: cur, unit_amount: toMinor(hostingPrice(plan, cur, bill)),
        recurring: { interval: bill === 'y' ? 'year' : 'month' },
        product_data: { name: `Braindy · Plan ${name} (sitio web)` },
      },
    }],
  });
  return c.redirect(session.url, 303);
});

hostingCheckout.get('/hosting/gracias', (c) => {
  const ok = c.req.query('state') === 'ok';
  const key = c.req.query('plan') ?? '';
  const plan = Object.hasOwn(HOSTING_PLANS, key) ? HOSTING_PLANS[key as PlanKey].name : 'de sitio web';
  const title = ok ? 'Recibimos tu pago' : 'No se completó el pago';
  const body = ok
    ? 'Gracias por elegir Braindy. Te llega el recibo a tu correo y te escribimos en menos de un día hábil para empezar tu sitio.'
    : 'No se hizo ningún cobro. Puedes intentarlo de nuevo o escribirnos y lo resolvemos contigo.';
  const cta = ok ? '' : `<a class="btn" href="${waLink(plan)}">Escríbenos por WhatsApp</a>`;
  return c.html(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Braindy</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;700;900&display=swap">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B1220;color:#EEF1F8;font-family:"Red Hat Display",system-ui,sans-serif;padding:24px}
main{max-width:520px;display:flex;flex-direction:column;gap:18px}h1{margin:0;font-weight:300;font-size:40px;line-height:1.1}h1 b{font-weight:900}
p{margin:0;color:#A4ADC2;font-size:18px;line-height:1.55}.btn{align-self:flex-start;background:#2A7FFF;color:#fff;font-weight:700;padding:12px 20px;border-radius:999px;text-decoration:none}
.sign{font-size:15px}.sign b{font-weight:900}</style></head>
<body><main><h1><b>${title}</b></h1><p>${body}</p>${cta}<p class="sign">Lo hace NicoMarca. Sus Br<b>ai</b>ns lo aceleran.</p></main></body></html>`);
});

/** Webhook side: a paid hosting checkout (no brand yet) becomes a signup for Nicolas. Idempotent per session. */
export async function recordHostingSignup(o: Record<string, any>) {
  const d = o.customer_details ?? {};
  await db.doc(`hostingSignups/${o.id}`).set({
    plan: o.metadata?.plan ?? null, currency: o.metadata?.cur ?? o.currency ?? null, billing: o.metadata?.bill ?? null,
    amount: (o.amount_total ?? 0) / 100, email: d.email ?? null, name: d.name ?? null, phone: d.phone ?? null,
    stripeCustomerId: o.customer ?? null, stripeSubscriptionId: o.subscription ?? null, status: 'new', at: FieldValue.serverTimestamp(),
  }, { merge: true });
  await db.collection('audit').doc().set({ type: 'hosting_signup', sessionId: o.id, plan: o.metadata?.plan ?? null, at: FieldValue.serverTimestamp() });
}
