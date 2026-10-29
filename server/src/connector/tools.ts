// The Braindy connector's tools, shared by the local server (stdio, Nicolas's PC) and the remote one (/mcp on Cloud Run).
// Local mode works with paths on disk; remote mode receives files inside the message or as https links.
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { findBrands, listSiteChanges, logSession, REMOTE_MAX_FILE, requireBrand, setLink, syncSiteChanges, uploadContent, uploadPath } from './store.js';
import { deliverVersion, listRequests, newRequest, type FileWriter } from './delivery.js';
import { parseTriageHtml } from './triageHtml.js';

export const APP = process.env.WEB_URL ?? 'https://braindy-app-staging.web.app';
export interface ToolContext { mode: 'local' | 'remote'; uid: string }

const reply = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const fail = (e: unknown) => ({ content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true });
const run = <A>(fn: (a: A) => Promise<string>) => async (a: A) => { try { return reply(await fn(a)); } catch (e) { return fail(e); } };

const STATUS = z.enum(['delivered', 'in_progress', 'decision', 'client', 'discarded'])
  .describe('delivered = Entregado, in_progress = En curso, decision = Pendiente de decisión, client = Pendiente del cliente, discarded = Descartado');
const REMOTE_FILE = z.object({
  name: z.string().describe('File name with extension, e.g. "logo.png"'),
  base64: z.string().optional().describe('File content in base64 (up to 25 MB)'),
  url: z.string().optional().describe('Or an https link the server downloads'),
});

export function registerTools(server: McpServer, ctx: ToolContext) {
  server.registerTool('braindy_find_brand', {
    title: 'Buscar marca en Braindy App',
    description: 'Finds a brand in Braindy App by name or id. Use it first to get the brandId the other tools need (e.g. "sanuteam").',
    inputSchema: { query: z.string().describe('Brand name or part of it; empty lists the first 25') },
  }, run(async ({ query }) => {
    const list = await findBrands(query);
    return list.length ? list.map((b) => `${b.id} · ${b.name} · ${b.kind}${b.status !== 'active' ? ' · archivada' : ''}${b.groupId ? ` · grupo ${b.groupId}` : ''}`).join('\n') : 'Ninguna marca coincide.';
  }));

  server.registerTool('braindy_app_link', {
    title: 'Publicar un sitio o app en Mis apps',
    description: 'Adds (or updates, same URL) a card in the brand\'s "Mis apps" in Braindy App: the website or web app built for it. '
      + 'Use when Nicolas says "publícala en Braindy App", "ponla en Mis apps".',
    inputSchema: {
      brandId: z.string(),
      title: z.string().describe('Card title, e.g. "Revista Level"'),
      url: z.string().describe('https URL'),
      kind: z.enum(['web', 'app', 'dashboard', 'research', 'marketmap']).optional().describe('web = sitio web (default), app = web app, dashboard'),
      description: z.string().optional().describe('One sentence in Spanish'),
      status: z.enum(['live', 'building']).optional().describe('live = Publicado (default), building = En construcción'),
    },
  }, run(async ({ brandId, ...l }) => {
    const name = await requireBrand(brandId);
    const r = await setLink(brandId, l);
    return `${name}: enlace ${r.created ? 'agregado' : 'actualizado'} en Mis apps.\nVer: ${APP}/apps`;
  }));

  server.registerTool('braindy_site_changes_sync', {
    title: 'Subir el triage del sitio a Braindy App',
    description: 'Uploads the website triage (requested changes, what was delivered, state) of a brand to Braindy App, section "Ajustes del sitio". '
      + 'Upserts by key: new points are added, changed points updated, unchanged left alone. Call it with the full current list. '
      + 'Use when Nicolas says "sube el triage", "actualiza Braindy App", "súbelo a Braindy App".',
    inputSchema: {
      brandId: z.string(),
      items: z.array(z.object({
        key: z.string().describe('Stable id of the point, e.g. "H01"'),
        group: z.string().optional().describe('Section or page, e.g. "Home"'),
        title: z.string(),
        request: z.string().optional().describe('What the client asked for'),
        source: z.string().optional().describe('Where it was asked (meeting, video minute, WhatsApp)'),
        delivered: z.string().optional().describe('What was done'),
        status: STATUS,
        link: z.string().optional().describe('https link to the change, if any'),
      })).min(1).max(500),
      siteUrl: z.string().optional().describe('https URL of the site'),
      round: z.string().optional().describe('Round or date of this update, e.g. "6.ª ronda · 28 oct"'),
      removeMissing: z.boolean().optional().describe('Delete points no longer in the list (default false)'),
    },
  }, run(async ({ brandId, items, siteUrl, round, removeMissing }) => {
    const name = await requireBrand(brandId);
    const r = await syncSiteChanges(brandId, items, { siteUrl, round, removeMissing });
    return `${name}: ${r.total} puntos · ${r.created} nuevos · ${r.updated} actualizados · ${r.unchanged} sin cambios${r.removed ? ` · ${r.removed} borrados` : ''}.\nVer: ${APP}/apps`;
  }));

  server.registerTool('braindy_site_changes_import_html', {
    title: 'Importar el triage desde la página HTML',
    description: 'Reads a triage page that uses Braindy\'s "Seguimiento de cambios" template (<article class="tri-item">, e.g. Sanuteam public/triage/index.html) and syncs it. '
      + (ctx.mode === 'local' ? 'Pass the absolute path. ' : 'Pass the page as an https URL. ') + 'For other formats, read it yourself and call braindy_site_changes_sync.',
    inputSchema: {
      brandId: z.string(),
      source: z.string().describe(ctx.mode === 'local' ? 'Absolute path to the triage HTML, or its https URL' : 'https URL of the triage page'),
      siteUrl: z.string().optional(), round: z.string().optional(),
    },
  }, run(async ({ brandId, source, siteUrl, round }) => {
    const name = await requireBrand(brandId);
    let html: string;
    if (/^https:\/\//.test(source)) {
      const res = await fetch(source, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`No pude abrir ${source} (${res.status}).`);
      html = await res.text();
    } else if (ctx.mode === 'local') html = await readFile(source, 'utf8');
    else throw new Error('Desde el conector remoto pasa la página como enlace https.');
    const items = parseTriageHtml(html);
    if (!items.length) return 'Esta página no usa la plantilla de triage de Braindy. Léela y usa braindy_site_changes_sync con la lista.';
    const r = await syncSiteChanges(brandId, items, { siteUrl, round });
    return `${name}: leí ${items.length} puntos · ${r.created} nuevos · ${r.updated} actualizados · ${r.unchanged} sin cambios.\nVer: ${APP}/apps`;
  }));

  server.registerTool('braindy_site_changes_get', {
    title: 'Ver el triage guardado en Braindy App',
    description: 'Lists the site changes stored in Braindy App for a brand (key, section, title, state).',
    inputSchema: { brandId: z.string() },
  }, run(async ({ brandId }) => {
    await requireBrand(brandId);
    const list = await listSiteChanges(brandId);
    return list.length ? list.map((x) => `${x.key} · ${x.group} · ${x.title} · ${x.status}`).join('\n') : 'Todavía no hay ajustes del sitio guardados.';
  }));

  server.registerTool('braindy_log_session', {
    title: 'Registrar lo que se hizo en Braindy App',
    description: 'Saves a summary of this working session in the brand\'s internal work log (only Nicolas sees it). '
      + 'Write it in Spanish, plain and short: what was done, what is pending, links. Use when Nicolas says "registra lo que hicimos" or at the end of a session.',
    inputSchema: { brandId: z.string(), text: z.string().min(1).max(20000), project: z.string().optional().describe('Session, project or repo name, e.g. "Sanuteam Website"'), requestId: z.string().optional() },
  }, run(async ({ brandId, text, project, requestId }) => {
    const name = await requireBrand(brandId);
    await logSession(brandId, text, { project, requestId });
    return `Registrado en ${name}.`;
  }));

  if (ctx.mode === 'local') {
    server.registerTool('braindy_upload', {
      title: 'Subir archivos a Braindy App',
      description: 'Uploads a local file or folder (up to 200 files, 500 MB each) to the brand\'s files in Braindy App (Mis archivos › Uploads). '
        + 'Use when Nicolas says "súbelo a Braindy App" or "grábalo en Braindy App".',
      inputSchema: { brandId: z.string(), path: z.string().describe('Absolute path to a file or folder'), folder: z.string().optional().describe('Folder in My files (default "Uploads")') },
    }, run(async ({ brandId, path, folder }) => {
      const name = await requireBrand(brandId);
      const { done, skipped } = await uploadPath(brandId, path, folder);
      return `${name}: ${done.length} archivo(s) subidos${skipped.length ? ` · omitidos: ${skipped.join(', ')}` : ''}.\nVer: ${APP}/assets`;
    }));
  } else {
    server.registerTool('braindy_upload', {
      title: 'Subir archivos a Braindy App',
      description: 'Uploads files to the brand\'s files in Braindy App (Mis archivos › Uploads). Each file goes inside the message as base64 (up to 25 MB) '
        + 'or as an https link the server downloads. Use when Nicolas says "súbelo a Braindy App" or "grábalo en Braindy App".',
      inputSchema: { brandId: z.string(), files: z.array(REMOTE_FILE).min(1).max(20), folder: z.string().optional().describe('Folder in My files (default "Uploads")') },
    }, run(async ({ brandId, files, folder }) => {
      const name = await requireBrand(brandId);
      const done = [];
      for (const f of files) done.push(await uploadContent(brandId, f, folder));
      return `${name}: ${done.length} archivo(s) subidos (${done.map((d) => d.name).join(', ')}).\nVer: ${APP}/assets`;
    }));
  }

  server.registerTool('braindy_requests', {
    title: 'Ver las solicitudes de una marca',
    description: 'Lists a brand\'s requests in Braindy App (id, title, state, versions). Open ones by default. Use it to get the requestId before delivering a version.',
    inputSchema: { brandId: z.string(), all: z.boolean().optional().describe('Include approved and published ones') },
  }, run(async ({ brandId, all }) => {
    await requireBrand(brandId);
    const list = await listRequests(brandId, all);
    return list.length ? list.map((r) => `${r.id} · ${r.title} · ${r.status}${r.versionCount ? ` · v${r.versionCount}` : ''}${r.dueDate ? ` · para ${r.dueDate}` : ''}`).join('\n') : 'No hay solicitudes abiertas.';
  }));

  server.registerTool('braindy_create_request', {
    title: 'Crear una solicitud en Braindy App',
    description: 'Creates a request for a brand, as if the client asked for it: the lead Brain proposes a plan that Nicolas approves in the app. '
      + 'Use when Nicolas says "crea una solicitud para…" or "pide esto en Braindy App".',
    inputSchema: {
      brandId: z.string(),
      text: z.string().min(5).max(4000).describe('What is needed, in Spanish, like a WhatsApp message: what, for whom, goal, what goes inside, when'),
      title: z.string().optional(), dueDate: z.string().optional().describe('YYYY-MM-DD'),
      links: z.array(z.string()).max(10).optional(),
    },
  }, run(async ({ brandId, ...r }) => {
    const name = await requireBrand(brandId);
    const id = await newRequest(brandId, ctx.uid, r);
    return `${name}: solicitud creada (${id}). El Brain líder ya propone el plan; apruébalo en la app.\nVer: ${APP}/requests/${id}`;
  }));

  server.registerTool('braindy_deliver_version', {
    title: 'Entregar una versión al cliente',
    description: 'Delivers a new version of a request: uploads its files with a short note and sends it to the client for approval, signed by NickMark '
      + '(the request moves to "Por aprobar" and the review link goes out). Only when Nicolas explicitly says to deliver it. '
      + (ctx.mode === 'local' ? 'Files are absolute paths.' : `Files go as base64 or https links (up to ${REMOTE_MAX_FILE / 1024 ** 2} MB each).`),
    inputSchema: {
      brandId: z.string(), requestId: z.string(),
      notes: z.string().max(4000).describe('What changed and why, in Spanish, for the client'),
      ...(ctx.mode === 'local' ? { paths: z.array(z.string()).min(1).max(20) } : { files: z.array(REMOTE_FILE).min(1).max(20) }),
    },
  }, run(async (a: { brandId: string; requestId: string; notes: string; paths?: string[]; files?: Array<z.infer<typeof REMOTE_FILE>> }) => {
    const name = await requireBrand(a.brandId);
    const writers: FileWriter[] = a.paths ? await Promise.all(a.paths.map(localWriter)) : await Promise.all((a.files ?? []).map(remoteWriter));
    const { n, notice } = await deliverVersion(a.brandId, a.requestId, ctx.uid, writers, a.notes);
    return `${name}: versión ${n} entregada; la solicitud pasó a Por aprobar.${notice && 'status' in notice ? ` Aviso: ${notice.status}.` : ''}\nVer: ${APP}/requests/${a.requestId}`;
  }));
}

async function localWriter(path: string): Promise<FileWriter> {
  const { size } = await stat(path);
  if (size > 500 * 1024 ** 2) throw new Error(`${basename(path)} pasa de 500 MB.`);
  return { name: basename(path), size, write: (file, contentType) => new Promise((res, rej) => createReadStream(path)
    .pipe(file.createWriteStream({ resumable: size > 8 * 1024 ** 2, contentType })).on('finish', () => res()).on('error', rej)) };
}

async function remoteWriter(f: z.infer<typeof REMOTE_FILE>): Promise<FileWriter> {
  let buf: Buffer;
  if (f.base64) buf = Buffer.from(f.base64, 'base64');
  else if (f.url && /^https:\/\//.test(f.url)) {
    const res = await fetch(f.url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`No pude descargar ${f.url} (${res.status}).`);
    buf = Buffer.from(await res.arrayBuffer());
  } else throw new Error(`Falta el contenido de ${f.name}.`);
  if (!buf.length || buf.length > REMOTE_MAX_FILE) throw new Error(`${f.name}: vacío o de más de 25 MB.`);
  return { name: f.name, size: buf.length, write: (file, contentType) => file.save(buf, { contentType, resumable: false }) };
}
