// "Mi marca" from the Braindy connector: logos (primary, secondary, icon, versions), colors, typography and design
// concept images, written to brands/{id}/context/identity right after a brand is created in a Claude session.
// Images get a public token link (they show on the brand's pages), stored under brands/{id}/identity/.
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from '../firebase.js';
import { contentTypeOf } from '../lib/mime.js';
import { Hono } from 'hono';
import { brandAccess } from '../access.js';
import type { AuthEnv } from '../auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const MAX_IMAGE = 25 * 1024 ** 2;

export interface ImageSrc { path?: string; url?: string; base64?: string; name?: string }
export interface IdentityInput {
  logos?: { primary?: ImageSrc | null; secondary?: ImageSrc | null; icon?: ImageSrc | null; variations?: ImageSrc[] };
  colors?: Array<{ name?: string; hex: string; pantone?: string }>;
  typography?: Array<{ fontFamily: string; name?: string; role?: string; type?: 'google' | 'custom'; url?: string; description?: string }>;
  concept?: Array<{ image: ImageSrc; kind?: 'design-concept' | 'hero'; caption?: string }>;
  mockups?: Array<{ image: ImageSrc; name?: string }>;
  voice?: {
    essence?: { title?: string; description?: string }; archetype?: string[];
    tonePrinciples?: Array<{ title?: string; description?: string }>;
    howItSounds?: { is?: string[]; isNot?: string[] };
    toneBalance?: { tradition?: number; modernity?: number; intellect?: number; emotion?: number };
    keyLanguage?: string[]; example?: string;
  };
  strategy?: { position?: string; audiences?: string; goals?: string; avoid?: string; competitors?: Array<{ name?: string; promise?: string; price?: string; url?: string }> };
}

async function load(src: ImageSrc, local: boolean): Promise<{ buf: Buffer; name: string }> {
  let buf: Buffer, name = src.name ?? '';
  if (src.base64) buf = Buffer.from(src.base64, 'base64');
  else if (src.url && /^https:\/\//.test(src.url)) {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`No pude descargar ${src.url} (${res.status}).`);
    buf = Buffer.from(await res.arrayBuffer());
    name ||= basename(new URL(src.url).pathname);
  } else if (src.path && local) { buf = await readFile(src.path); name ||= basename(src.path); }
  else throw new Error(local ? 'Cada imagen necesita path, url https o base64.' : 'Desde el conector remoto, cada imagen va como base64 o enlace https.');
  if (!buf.length || buf.length > MAX_IMAGE) throw new Error(`${name || 'Una imagen'}: vacía o de más de 25 MB.`);
  if (!/^image\//.test(contentTypeOf(name || 'x.png'))) throw new Error(`${name}: no es una imagen (png, svg, jpg, webp).`);
  return { buf, name: name || 'logo.png' };
}

/** Uploads one image and returns its public link. */
async function publish(brandId: string, slot: string, src: ImageSrc, local: boolean) {
  // An image that already lives in Firebase Storage (this app or the old Brands app) is kept as it is.
  if (src.url?.startsWith('https://firebasestorage.googleapis.com/') && !src.base64) return src.url;
  const { buf, name } = await load(src, local);
  const token = randomUUID();
  const path = `brands/${brandId}/identity/${slot}-${token.slice(0, 8)}${extname(name).toLowerCase() || '.png'}`;
  await getStorage().bucket(BUCKET).file(path).save(buf, {
    resumable: false, contentType: contentTypeOf(name), metadata: { cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Writes what was given and leaves the rest as it is. Lists (versions, colors, fonts, concept, mockups) and the voice are replaced whole. */
export async function setIdentity(brandId: string, input: IdentityInput, local: boolean) {
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp(), updatedBy: 'connector' };
  const done: string[] = [];
  const logos = input.logos ?? {};
  for (const slot of ['primary', 'secondary', 'icon'] as const) {
    const src = logos[slot];
    if (src) { update[`logos.${slot}`] = await publish(brandId, slot, src, local); done.push(slot); }
    else if (src === null) { update[`logos.${slot}`] = FieldValue.delete(); done.push(`${slot} quitado`); } // removed in the editor
  }
  if (logos.variations) {
    update['logos.variations'] = await Promise.all(logos.variations.slice(0, 40).map((v, i) => publish(brandId, `variation-${i + 1}`, v, local)));
    done.push(`${logos.variations.length} versiones`);
  }
  if (input.colors) {
    const bad = input.colors.filter((c) => !HEX.test(c.hex));
    if (bad.length) throw new Error(`Colores inválidos (usa #RRGGBB): ${bad.map((c) => c.hex).join(', ')}`);
    update.colors = input.colors.slice(0, 24).map((c, i) => ({ id: `c${i + 1}`, hex: c.hex.toUpperCase(), name: (c.name ?? '').slice(0, 60), ...(c.pantone ? { pantone: c.pantone.slice(0, 40) } : {}) }));
    done.push(`${input.colors.length} colores`);
  }
  if (input.typography) {
    update.typography = input.typography.slice(0, 8).map((f, i) => ({
      id: `f${i + 1}`, fontFamily: f.fontFamily.slice(0, 80), name: (f.name ?? f.fontFamily).slice(0, 80), role: (f.role ?? '').slice(0, 60),
      type: f.type ?? 'google', description: (f.description ?? '').slice(0, 300), ...(f.url && /^https:\/\//.test(f.url) ? { url: f.url } : {}),
    }));
    done.push(`${input.typography.length} tipografías`);
  }
  if (input.concept) {
    update.concept = await Promise.all(input.concept.slice(0, 12).map(async (c, i) => ({
      url: await publish(brandId, `concept-${i + 1}`, c.image, local), kind: c.kind ?? 'design-concept', caption: (c.caption ?? '').slice(0, 200),
    })));
    done.push(`${input.concept.length} imágenes de concepto`);
  }
  if (input.mockups) {
    update.galleryAssets = await Promise.all(input.mockups.slice(0, 24).map(async (m, i) => ({
      id: `m${i + 1}`, url: await publish(brandId, `mockup-${i + 1}`, m.image, local), name: (m.name ?? '').slice(0, 120), chosen: true,
    })));
    done.push(`${input.mockups.length} mockups`);
  }
  const extra: Promise<unknown>[] = [];
  if (input.voice) {
    const v = input.voice;
    const clip = (x: string | undefined, n: number) => (x ?? '').slice(0, n);
    const list = (xs: string[] | undefined, n = 12) => (xs ?? []).map((x) => String(x).slice(0, 200)).slice(0, n);
    extra.push(db.doc(`brands/${brandId}/context/voice`).set({
      essence: { title: clip(v.essence?.title, 200), description: clip(v.essence?.description, 1500) },
      archetype: list(v.archetype, 3),
      tonePrinciples: (v.tonePrinciples ?? []).slice(0, 8).map((p, i) => ({ id: `t${i + 1}`, title: clip(p.title, 120), description: clip(p.description, 600) })),
      howItSounds: { is: list(v.howItSounds?.is), isNot: list(v.howItSounds?.isNot) },
      ...(v.toneBalance ? { toneBalance: Object.fromEntries(Object.entries(v.toneBalance).map(([k, n]) => [k, Math.max(0, Math.min(100, Number(n) || 0))])) } : {}),
      keyLanguage: list(v.keyLanguage, 24), example: clip(v.example, 600),
      updatedAt: FieldValue.serverTimestamp(), updatedBy: 'connector',
    }));
    done.push('tono y voz');
  }
  if (input.strategy) {
    const st = input.strategy;
    // Merged into the Brand Brain (the Brains read it too); only the fields sent change.
    const fields: Record<string, unknown> = Object.fromEntries((['position', 'audiences', 'goals', 'avoid'] as const).filter((k) => st[k] !== undefined).map((k) => [k, String(st[k]).slice(0, 3000)]));
    if (st.competitors) fields.competitors = st.competitors.slice(0, 12).map((c) => ({ name: (c.name ?? '').slice(0, 80), promise: (c.promise ?? '').slice(0, 300), price: (c.price ?? '').slice(0, 80), url: c.url && /^https:\/\//.test(c.url) ? c.url : '' }));
    extra.push(db.doc(`brands/${brandId}/context/brain`).set({ ...fields, updatedAt: FieldValue.serverTimestamp() }, { merge: true }));
    done.push('estrategia');
  }
  await Promise.all(extra);
  if (done.length === 0) throw new Error('No llegó nada para actualizar (logos, colores, tipografía, concepto, mockups, voz o estrategia).');
  if (Object.keys(update).length === 2) return done;
  const ref = db.doc(`brands/${brandId}/context/identity`);
  if (!(await ref.get()).exists) await ref.set({ createdAt: FieldValue.serverTimestamp() });
  await ref.update(update);
  // The small mark in menus and lists: the icon if there is one, else the primary logo.
  const mark = update['logos.icon'] ?? update['logos.primary'];
  if (mark) await db.doc(`brands/${brandId}`).update({ logoUrl: mark });
  return done;
}

export const adminIdentity = new Hono<AuthEnv>();

/** Manual edit from Mi marca (admin): the same input as the connector, images as base64 or kept links. */
adminIdentity.post('/brands/:brandId/identity', async (c) => {
  const { brandId } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  if (!(await db.doc(`brands/${brandId}`).get()).exists) return c.json({ error: 'not_found' }, 404);
  try {
    return c.json({ done: await setIdentity(brandId, await c.req.json<IdentityInput>(), false) });
  } catch (e) { return c.json({ error: (e as Error).message }, 400); }
});
