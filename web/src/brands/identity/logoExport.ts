// Logo downloads made in the browser: the file comes down (not opened in a tab), in the format asked,
// with the ground of the cell or without it, recolored the way the cell shows it. No server, no AI.

/** How a cell recolors the logo: as is, all white, all black, or only its dark parts white (color icon, white letters). */
export type Tone = 'none' | 'white' | 'black' | 'darkToWhite';
export type Format = 'png' | 'pngClear' | 'jpg' | 'pdf' | 'svg';

const isSvg = (url: string) => /\.svg(\?|$)/i.test(decodeURIComponent(url.split('?')[0]));
const svgText = new Map<string, Promise<string | null>>();

/** The SVG source of a logo, or null when the logo is a raster image. */
export function loadSvg(url: string): Promise<string | null> {
  if (!isSvg(url)) return Promise.resolve(null);
  if (!svgText.has(url)) svgText.set(url, fetch(url).then((r) => (r.ok ? r.text() : null)).catch(() => null));
  return svgText.get(url)!;
}

const SHAPES = 'path,rect,circle,ellipse,polygon,polyline,line,text,tspan,use';
function rgbOf(c: string): [number, number, number] | null {
  const s = c.trim().toLowerCase();
  if (s === 'none' || s === 'transparent' || s.startsWith('url(')) return null;
  if (s === 'black') return [0, 0, 0];
  if (s === 'white') return [255, 255, 255];
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) { const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1]; return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]; }
  const rgb = s.match(/^rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}
/** Dark and not very colorful: a wordmark in navy or black, not a brand red or teal. */
function isDark([r, g, b]: [number, number, number]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const light = (max + min) / 510, sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  return light < 0.3 || (light < 0.42 && sat < 0.35);
}
function paintOf(el: Element, prop: 'fill' | 'stroke'): string | null {
  for (let e: Element | null = el; e && e.nodeType === 1; e = e.parentElement) {
    const style = e.getAttribute('style')?.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
    const v = style?.[1] ?? e.getAttribute(prop);
    if (v) return v;
  }
  return prop === 'fill' ? '#000' : null;
}

/** The SVG with each fill and stroke changed by tone. Returns null when nothing would change. */
export function recolorSvg(text: string, tone: Tone): string | null {
  if (tone === 'none') return text;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  let changed = false;
  doc.querySelectorAll(SHAPES).forEach((el) => {
    for (const prop of ['fill', 'stroke'] as const) {
      const rgb = rgbOf(paintOf(el, prop) ?? 'none');
      if (!rgb) continue;
      const to = tone === 'white' ? '#FFFFFF' : tone === 'black' ? '#000000' : isDark(rgb) ? '#FFFFFF' : null;
      if (!to) continue;
      el.setAttribute(prop, to);
      el.setAttribute('style', (el.getAttribute('style') ?? '').replace(new RegExp(`${prop}\\s*:[^;]+;?`, 'g'), ''));
      changed = true;
    }
  });
  return changed ? new XMLSerializer().serializeToString(doc) : null;
}

export const svgDataUrl = (text: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;

async function loadImage(src: string) {
  const img = new Image();
  img.decoding = 'async';
  if (!src.startsWith('data:')) src = URL.createObjectURL(await (await fetch(src)).blob());
  img.src = src;
  await img.decode();
  return img;
}

/** An SVG with only a viewBox has no size of its own in an <img>: give it one, 2400 px on its long side. */
function sized(text: string) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  const vb = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  if (!vb || vb.length !== 4 || !(vb[2] > 0 && vb[3] > 0)) return text;
  const k = 2400 / Math.max(vb[2], vb[3]);
  root.setAttribute('width', String(Math.round(vb[2] * k)));
  root.setAttribute('height', String(Math.round(vb[3] * k)));
  return new XMLSerializer().serializeToString(doc);
}

/** The logo drawn at a print-friendly size, recolored, on the ground or on transparent. */
async function draw(url: string, tone: Tone, ground: string | null) {
  const svg = await loadSvg(url);
  const recolored = svg ? sized(recolorSvg(svg, tone) ?? svg) : null;
  const img = await loadImage(recolored ? svgDataUrl(recolored) : url);
  const w0 = img.naturalWidth || 1000, h0 = img.naturalHeight || 1000;
  const scale = Math.min(4, Math.max(1, 2400 / Math.max(w0, h0)));
  const pad = ground ? Math.round(Math.max(w0, h0) * scale * 0.08) : 0;
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * scale) + pad * 2; c.height = Math.round(h0 * scale) + pad * 2;
  const ctx = c.getContext('2d')!;
  if (ground) { ctx.fillStyle = ground; ctx.fillRect(0, 0, c.width, c.height); }
  if (!recolored && tone !== 'none') {
    // A raster logo: recolor its pixels on a layer of its own, then lay it on the ground.
    const l = document.createElement('canvas'); l.width = c.width - pad * 2; l.height = c.height - pad * 2;
    const lx = l.getContext('2d')!; lx.drawImage(img, 0, 0, l.width, l.height);
    const px = lx.getImageData(0, 0, l.width, l.height), d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = tone === 'white' ? 255 : tone === 'black' ? 0 : isDark([d[i], d[i + 1], d[i + 2]]) ? 255 : -1;
      if (v >= 0) d[i] = d[i + 1] = d[i + 2] = v;
    }
    lx.putImageData(px, 0, 0);
    ctx.drawImage(l, pad, pad);
  } else ctx.drawImage(img, pad, pad, c.width - pad * 2, c.height - pad * 2);
  return c;
}

const toBlob = (c: HTMLCanvasElement, type: string) => new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('canvas'))), type, 0.95));

/** A one-page PDF holding the JPEG, sized to the image. */
async function pdfOf(c: HTMLCanvasElement) {
  const jpg = new Uint8Array(await (await toBlob(c, 'image/jpeg')).arrayBuffer());
  const w = +(c.width * 0.3).toFixed(2), h = +(c.height * 0.3).toFixed(2);
  const enc = new TextEncoder(), parts: Uint8Array[] = [], offsets: number[] = [];
  let len = 0;
  const push = (p: string | Uint8Array) => { const b = typeof p === 'string' ? enc.encode(p) : p; parts.push(b); len += b.length; };
  const obj = (n: number, body: string | Uint8Array[]) => { offsets[n] = len; push(`${n} 0 obj\n`); (Array.isArray(body) ? body : [body]).forEach(push); push('\nendobj\n'); };
  const ops = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
  push('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [enc.encode(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`), jpg, enc.encode('\nendstream')]);
  obj(5, `<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`);
  const xref = len;
  push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

/** Saves the logo as a file. ground is the cell's color (null = transparent); JPG and PDF take white when there is none. */
export async function downloadLogo(url: string, tone: Tone, ground: string | null, format: Format, name: string) {
  let blob: Blob;
  if (format === 'svg') {
    const svg = await loadSvg(url);
    if (!svg) throw new Error('not svg');
    blob = new Blob([recolorSvg(svg, tone) ?? svg], { type: 'image/svg+xml' });
  } else {
    const bg = format === 'pngClear' ? null : ground ?? (format === 'png' ? null : '#FFFFFF');
    const c = await draw(url, tone, bg);
    blob = format === 'pdf' ? await pdfOf(c) : await toBlob(c, format === 'jpg' ? 'image/jpeg' : 'image/png');
  }
  const ext = format === 'pngClear' ? 'png' : format;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** File-name friendly: «Sobre oscuro» → «sobre-oscuro». */
export const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
