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

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
const MAX_IMAGE = 25 * 1024 ** 2;

export interface ImageSrc { path?: string; url?: string; base64?: string; name?: string }
export interface IdentityInput {
  logos?: { primary?: ImageSrc; secondary?: ImageSrc; icon?: ImageSrc; variations?: ImageSrc[] };
  colors?: Array<{ name?: string; hex: string; pantone?: string }>;
  typography?: Array<{ fontFamily: string; name?: string; role?: string; type?: 'google' | 'custom'; url?: string; description?: string }>;
  concept?: Array<{ image: ImageSrc; kind?: 'design-concept' | 'hero'; caption?: string }>;
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
  const { buf, name } = await load(src, local);
  const token = randomUUID();
  const path = `brands/${brandId}/identity/${slot}-${token.slice(0, 8)}${extname(name).toLowerCase() || '.png'}`;
  await getStorage().bucket(BUCKET).file(path).save(buf, {
    resumable: false, contentType: contentTypeOf(name), metadata: { cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Writes what was given and leaves the rest as it is. Lists (versions, colors, fonts, concept) are replaced whole. */
export async function setIdentity(brandId: string, input: IdentityInput, local: boolean) {
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp(), updatedBy: 'connector' };
  const done: string[] = [];
  const logos = input.logos ?? {};
  for (const slot of ['primary', 'secondary', 'icon'] as const) {
    const src = logos[slot];
    if (src) { update[`logos.${slot}`] = await publish(brandId, slot, src, local); done.push(slot); }
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
  if (done.length === 0) throw new Error('No llegó nada para actualizar (logos, colores, tipografía o concepto).');
  const ref = db.doc(`brands/${brandId}/context/identity`);
  if (!(await ref.get()).exists) await ref.set({ createdAt: FieldValue.serverTimestamp() });
  await ref.update(update);
  // The small mark in menus and lists: the icon if there is one, else the primary logo.
  const mark = update['logos.icon'] ?? update['logos.primary'];
  if (mark) await db.doc(`brands/${brandId}`).update({ logoUrl: mark });
  return done;
}
