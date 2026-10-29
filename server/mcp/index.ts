// Braindy connector (local, stdio): lets any Claude session on Nicolas's PC write into Braindy App.
// Site triage, work log and files, per brand. Admin only (his gcloud credentials); never touches client credentials.
// Install once: claude mcp add --scope user braindy -- npx.cmd tsx C:/Users/Mark/braindy-app/server/mcp/index.ts
import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { findBrands, listSiteChanges, logSession, requireBrand, setLink, syncSiteChanges, uploadPath } from './store.js';
import { parseTriageHtml } from './triageHtml.js';

const APP = 'https://braindy-app-staging.web.app';
const server = new McpServer({ name: 'braindy', version: '1.0.0' });
const reply = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const fail = (e: unknown) => ({ content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true });

const STATUS = z.enum(['delivered', 'in_progress', 'decision', 'client', 'discarded'])
  .describe('delivered = Entregado, in_progress = En curso, decision = Pendiente de decisión, client = Pendiente del cliente, discarded = Descartado');

server.registerTool('braindy_find_brand', {
  title: 'Buscar marca en Braindy App',
  description: 'Finds a brand in Braindy App by name or id. Use it first to get the brandId the other tools need (e.g. "sanuteam").',
  inputSchema: { query: z.string().describe('Brand name or part of it; empty lists the first 25') },
}, async ({ query }) => {
  try {
    const list = await findBrands(query);
    return reply(list.length ? list.map((b) => `${b.id} · ${b.name} · ${b.kind}${b.status !== 'active' ? ' · archivada' : ''}${b.groupId ? ` · grupo ${b.groupId}` : ''}`).join('\n') : 'Ninguna marca coincide.');
  } catch (e) { return fail(e); }
});

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
}, async ({ brandId, ...l }) => {
  try {
    const name = await requireBrand(brandId);
    const r = await setLink(brandId, l);
    return reply(`${name}: enlace ${r.created ? 'agregado' : 'actualizado'} en Mis apps.\nVer: ${APP}/apps`);
  } catch (e) { return fail(e); }
});

server.registerTool('braindy_site_changes_sync', {
  title: 'Subir el triage del sitio a Braindy App',
  description: 'Uploads the website triage (requested changes, what was delivered, state) of a brand to Braindy App, section "Ajustes del sitio". '
    + 'Upserts by key: new points are added, changed points updated, unchanged left alone. Call it with the full current list read from the site repo. '
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
}, async ({ brandId, items, siteUrl, round, removeMissing }) => {
  try {
    const name = await requireBrand(brandId);
    const r = await syncSiteChanges(brandId, items, { siteUrl, round, removeMissing });
    return reply(`${name}: ${r.total} puntos · ${r.created} nuevos · ${r.updated} actualizados · ${r.unchanged} sin cambios${r.removed ? ` · ${r.removed} borrados` : ''}.\nVer: ${APP}/apps`);
  } catch (e) { return fail(e); }
});

server.registerTool('braindy_site_changes_import_html', {
  title: 'Importar el triage desde la página HTML',
  description: 'Reads a triage page that uses Braindy\'s "Seguimiento de cambios" template (<article class="tri-item">, e.g. Sanuteam public/triage/index.html) and syncs it. '
    + 'For other formats, read the file yourself and call braindy_site_changes_sync.',
  inputSchema: { brandId: z.string(), path: z.string().describe('Absolute path to the triage HTML'), siteUrl: z.string().optional(), round: z.string().optional() },
}, async ({ brandId, path, siteUrl, round }) => {
  try {
    const name = await requireBrand(brandId);
    const items = parseTriageHtml(await readFile(path, 'utf8'));
    if (!items.length) return reply('Esta página no usa la plantilla de triage de Braindy. Léela y usa braindy_site_changes_sync con la lista.');
    const r = await syncSiteChanges(brandId, items, { siteUrl, round });
    return reply(`${name}: leí ${items.length} puntos · ${r.created} nuevos · ${r.updated} actualizados · ${r.unchanged} sin cambios.\nVer: ${APP}/apps`);
  } catch (e) { return fail(e); }
});

server.registerTool('braindy_site_changes_get', {
  title: 'Ver el triage guardado en Braindy App',
  description: 'Lists the site changes stored in Braindy App for a brand (key, section, title, state).',
  inputSchema: { brandId: z.string() },
}, async ({ brandId }) => {
  try {
    await requireBrand(brandId);
    const list = await listSiteChanges(brandId);
    return reply(list.length ? list.map((x) => `${x.key} · ${x.group} · ${x.title} · ${x.status}`).join('\n') : 'Todavía no hay ajustes del sitio guardados.');
  } catch (e) { return fail(e); }
});

server.registerTool('braindy_log_session', {
  title: 'Registrar lo que se hizo en Braindy App',
  description: 'Saves a summary of this working session in the brand\'s internal work log (only Nicolas sees it). '
    + 'Write it in Spanish, plain and short: what was done, what is pending, links. Use when Nicolas says "registra lo que hicimos" or at the end of a session.',
  inputSchema: { brandId: z.string(), text: z.string().min(1).max(20000), project: z.string().optional().describe('Session or repo name, e.g. "Sanuteam Website"'), requestId: z.string().optional() },
}, async ({ brandId, text, project, requestId }) => {
  try {
    const name = await requireBrand(brandId);
    await logSession(brandId, text, { project, requestId });
    return reply(`Registrado en ${name}.`);
  } catch (e) { return fail(e); }
});

server.registerTool('braindy_upload', {
  title: 'Subir archivos a Braindy App',
  description: 'Uploads a local file or folder (up to 200 files, 500 MB each) to the brand\'s files in Braindy App (Mis archivos › Uploads). '
    + 'Use when Nicolas says "súbelo a Braindy App" or "grábalo en Braindy App".',
  inputSchema: { brandId: z.string(), path: z.string().describe('Absolute path to a file or folder'), folder: z.string().optional().describe('Folder in My files (default "Uploads")') },
}, async ({ brandId, path, folder }) => {
  try {
    const name = await requireBrand(brandId);
    const { done, skipped } = await uploadPath(brandId, path, folder);
    return reply(`${name}: ${done.length} archivo(s) subidos${skipped.length ? ` · omitidos: ${skipped.join(', ')}` : ''}.\nVer: ${APP}/assets`);
  } catch (e) { return fail(e); }
});

await server.connect(new StdioServerTransport());
