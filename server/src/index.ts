import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { clientErrors, logError, rateLimit } from './guard.js';
import { appCheck, requireUser, type AuthEnv } from './auth.js';
import { db } from './firebase.js';
import { files } from './files.js';
import { fileOps } from './fileOps.js';
import { folderOps } from './folderOps.js';
import { search } from './search.js';
import { adminProposals, publicProposals } from './proposals.js';
import { adminRequests, requests } from './requests.js';
import { adminLaunches, launches } from './launches.js';
import { adminCalendar, calendarCallback, meetings } from './meetings.js';
import { booking, publicBooking } from './booking.js';
import { members } from './members.js';
import { accesses } from './accesses.js';
import { adminReview, publicReview, review } from './review.js';
import { adminLinks } from './og.js';
import { adminGeo } from './geo.js';
import { adminOnboarding, onboarding } from './onboarding.js';
import { contracts } from './contracts/routes.js';
import { adminContracts } from './contracts/admin.js';
import { adminReports } from './reports.js';
import { adminBilling, billing, stripeWebhook } from './billing.js';
import { adminPlan } from './brandPlan.js';
import { hostingCheckout } from './hosting.js';
import { adminBrains, brains, cron } from './brains/routes.js';
import { adminGranola, granolaWebhook } from './granola.js';
import { whatsappWebhook } from './wa/webhook.js';
import { meWhatsapp } from './wa/contacts.js';
import { adminWhatsapp } from './wa/admin.js';
import { relay } from './wa/relay.js';
import { criterio } from './criterio.js';
import { connectorAuth, oauth } from './connector/oauth.js';
import { mcp } from './connector/http.js';
import { adminAiHealth } from './aiLog.js';
import { adminIdentity } from './connector/identity.js';
import { adminBrandVersions } from './brandVersions.js';
import { publicShare, shareLinks } from './shareLinks.js';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const app = new Hono<AuthEnv>();

// The WhatsApp webhook path carries a secret key: mask it in request logs.
app.use('*', logger((s, ...rest) => console.log(s.replace(/(\/webhooks\/whatsapp\/)[^\s?]+/, '$1***'), ...rest)));
app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
app.onError((err, c) => {
  logError(err, { method: c.req.method, path: c.req.path });
  return c.json({ error: 'internal' }, 500);
});
app.use('/v1/*', cors({ origin: allowedOrigins, allowHeaders: ['Authorization', 'Content-Type', 'X-Firebase-AppCheck'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));

app.get('/health', (c) => c.json({ ok: true }));

// Public proposal pages: no login, tracked per send.
// braindy.co books meetings here too (the site's /book page), so the public routes also answer the site.
const siteOrigins = ['https://braindy.co', 'https://www.braindy.co'];
app.use('/public/*', cors({ origin: [...allowedOrigins, ...siteOrigins], allowHeaders: ['Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));
// Abuse protection on login-free routes: tokens cannot be brute-forced and tracking cannot be flooded.
app.use('/public/p/:token/accept', rateLimit('accept', 10, 10 * 60_000));
app.use('/public/p/:token/pay', rateLimit('pay', 10, 10 * 60_000));
app.use('/public/r/:token/decision', rateLimit('decision', 20, 10 * 60_000));
app.use('/public/hosting/checkout', rateLimit('hosting-checkout', 20, 10 * 60_000));
app.use('/public/booking/book', rateLimit('web-booking', 5, 60 * 60_000));
// Upload links take files from strangers: a few hundred per sender per hour at most.
app.use('/public/u/:token/files', rateLimit('upload-link', 300, 60 * 60_000));
app.use('/public/*', rateLimit('public', 120, 60_000));
app.route('/public', clientErrors);
app.route('/public', publicProposals);
app.route('/public', publicReview);
app.route('/public', publicBooking);
app.route('/public', hostingCheckout);
app.route('/public', publicShare);

// Stripe webhook: public, verified by signature (no CORS: server to server).
app.use('/webhooks/*', rateLimit('webhooks', 300, 60_000));
app.route('/webhooks', stripeWebhook);
app.route('/webhooks', granolaWebhook);
app.route('/webhooks', whatsappWebhook);
// Notices for work delivered from Nicolas's PC (Google identity token of an admin).
app.use('/internal/*', rateLimit('internal', 30, 60_000));
app.route('/', relay);
// Google Calendar OAuth return (public, checked by a one-time state).
app.use('/integrations/*', rateLimit('integrations', 30, 60_000));
app.route('/', calendarCallback);
// Scheduled Brain work (Cloud Scheduler, OIDC-verified inside).
app.use('/cron/*', rateLimit('cron', 30, 60_000));
app.route('/cron', cron);

// Remote Braindy connector for Claude: OAuth (discovery, registration, authorize, token) and MCP at /mcp (Bearer token, admins only).
app.use('/oauth/*', rateLimit('oauth', 60, 60_000));
app.use('/mcp', rateLimit('mcp', 300, 60_000));
app.route('/', oauth);
app.route('/', mcp);

app.use('/v1/*', appCheck);
app.use('/v1/*', requireUser);
app.use('/v1/*', rateLimit('api', 600, 60_000));

/** Who am I, according to the backend. Used to confirm the web ↔ API ↔ Firestore path works. */
app.get('/v1/me', async (c) => {
  const user = c.get('user');
  const snap = await db.doc(`users/${user.uid}`).get();
  return c.json({
    uid: user.uid,
    email: user.email ?? null,
    profile: snap.exists ? snap.data() : null,
  });
});

app.route('/v1', files);
app.route('/v1', meWhatsapp);
app.route('/v1/admin', adminWhatsapp);
app.route('/v1', fileOps);
app.route('/v1', folderOps);
app.route('/v1', search);
app.route('/v1/admin', adminProposals);
app.route('/v1', requests);
app.route('/v1', launches);
app.route('/v1', meetings);
app.route('/v1', booking);
app.route('/v1/admin', adminCalendar);
app.route('/v1/admin', adminLaunches);
app.route('/v1', members);
app.route('/v1', accesses);
app.route('/v1', review);
app.route('/v1/admin', adminReview);
app.route('/v1/admin', adminLinks);
app.route('/v1', connectorAuth);
app.route('/v1/admin', adminIdentity);
app.route('/v1/admin', adminBrandVersions);
app.route('/v1/admin', adminGeo);
app.route('/v1', onboarding);
app.route('/v1', contracts);
app.route('/v1/admin', adminContracts);
app.route('/v1/admin', adminOnboarding);
app.route('/v1/admin', adminReports);
app.route('/v1', billing);
app.route('/v1/admin', adminBilling);
app.route('/v1/admin', adminPlan);
app.route('/v1', brains);
app.route('/v1/admin', adminBrains);
app.route('/v1/admin', adminGranola);
app.route('/v1/admin', adminRequests);
app.route('/v1/admin', adminAiHealth);
app.route('/v1', criterio);
app.route('/v1', shareLinks);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`braindy-api listening on :${port}`));
