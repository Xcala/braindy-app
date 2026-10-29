import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { clientErrors, logError, rateLimit } from './guard.js';
import { appCheck, requireUser, type AuthEnv } from './auth.js';
import { db } from './firebase.js';
import { files } from './files.js';
import { adminProposals, publicProposals } from './proposals.js';
import { adminRequests, requests } from './requests.js';
import { members } from './members.js';
import { accesses } from './accesses.js';
import { adminReview, publicReview, review } from './review.js';
import { adminLinks } from './og.js';
import { adminOnboarding, onboarding } from './onboarding.js';
import { adminReports } from './reports.js';
import { adminBilling, billing, stripeWebhook } from './billing.js';
import { adminBrains, brains, cron } from './brains/routes.js';
import { adminGranola, granolaWebhook } from './granola.js';
import { criterio } from './criterio.js';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const app = new Hono<AuthEnv>();

app.use('*', logger());
app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
app.onError((err, c) => {
  logError(err, { method: c.req.method, path: c.req.path });
  return c.json({ error: 'internal' }, 500);
});
app.use('/v1/*', cors({ origin: allowedOrigins, allowHeaders: ['Authorization', 'Content-Type', 'X-Firebase-AppCheck'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));

app.get('/health', (c) => c.json({ ok: true }));

// Public proposal pages: no login, tracked per send.
app.use('/public/*', cors({ origin: allowedOrigins, allowHeaders: ['Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));
// Abuse protection on login-free routes: tokens cannot be brute-forced and tracking cannot be flooded.
app.use('/public/p/:token/accept', rateLimit('accept', 10, 10 * 60_000));
app.use('/public/p/:token/pay', rateLimit('pay', 10, 10 * 60_000));
app.use('/public/r/:token/decision', rateLimit('decision', 20, 10 * 60_000));
app.use('/public/*', rateLimit('public', 120, 60_000));
app.route('/public', clientErrors);
app.route('/public', publicProposals);
app.route('/public', publicReview);

// Stripe webhook: public, verified by signature (no CORS: server to server).
app.use('/webhooks/*', rateLimit('webhooks', 300, 60_000));
app.route('/webhooks', stripeWebhook);
app.route('/webhooks', granolaWebhook);
// Scheduled Brain work (Cloud Scheduler, OIDC-verified inside).
app.use('/cron/*', rateLimit('cron', 30, 60_000));
app.route('/cron', cron);

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
app.route('/v1/admin', adminProposals);
app.route('/v1', requests);
app.route('/v1', members);
app.route('/v1', accesses);
app.route('/v1', review);
app.route('/v1/admin', adminReview);
app.route('/v1/admin', adminLinks);
app.route('/v1', onboarding);
app.route('/v1/admin', adminOnboarding);
app.route('/v1/admin', adminReports);
app.route('/v1', billing);
app.route('/v1/admin', adminBilling);
app.route('/v1', brains);
app.route('/v1/admin', adminBrains);
app.route('/v1/admin', adminGranola);
app.route('/v1/admin', adminRequests);
app.route('/v1', criterio);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`braindy-api listening on :${port}`));
