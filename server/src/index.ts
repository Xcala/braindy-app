import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requireUser, type AuthEnv } from './auth.js';
import { db } from './firebase.js';
import { files } from './files.js';
import { adminProposals, publicProposals } from './proposals.js';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const app = new Hono<AuthEnv>();

app.use('*', logger());
app.use('/v1/*', cors({ origin: allowedOrigins, allowHeaders: ['Authorization', 'Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));

app.get('/health', (c) => c.json({ ok: true }));

// Public proposal pages: no login, tracked per send.
app.use('/public/*', cors({ origin: allowedOrigins, allowHeaders: ['Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));
app.route('/public', publicProposals);

app.use('/v1/*', requireUser);

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

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`braindy-api listening on :${port}`));
