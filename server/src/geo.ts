// City search for the admin: a typed city name → candidates with country and time zone (Open-Meteo geocoding, no key).
// Proxied here so the browser only talks to our API.
import { Hono } from 'hono';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

export const adminGeo = new Hono<AuthEnv>();

adminGeo.get('/geo/cities', async (c) => {
  if (!(await brandAccess(c.get('user').uid, '__none__')).admin) return c.json({ error: 'forbidden' }, 403);
  const q = String(c.req.query('q') ?? '').trim().slice(0, 80);
  const lang = c.req.query('lang') === 'en' ? 'en' : 'es';
  if (q.length < 2) return c.json({ cities: [] });
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: q, count: '8', language: lang })}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return c.json({ error: 'geo_failed' }, 502);
  const j = (await r.json()) as { results?: Array<{ name: string; country?: string; admin1?: string; timezone?: string; population?: number }> };
  const cities = (j.results ?? []).filter((x) => x.timezone).map((x) => ({ name: x.name, region: x.admin1 ?? '', country: x.country ?? '', tz: x.timezone! }));
  return c.json({ cities });
});
