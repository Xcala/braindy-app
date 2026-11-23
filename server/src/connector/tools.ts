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
import { syncSocialPosts } from './social.js';
import { syncSocialStats } from './socialStats.js';
import { registerAdTools } from './adStats.js';
import { syncAllWebStats, syncWebStats } from '../webStats.js';
import { syncAllSearchStats, syncSearchStats } from '../searchStats.js';
import { db } from '../firebase.js';
import { setIdentity } from './identity.js';
import { registerSiteCommentTools } from './siteComments.js';
import { PlanSchema, StackSchema, WeekSchedule, setPlan, setSchedule, setStack } from '../brandPlan.js';
import { registerStepTools } from '../brains/steps.js';
import { registerQualityTools } from '../brains/quality.js';
import { registerKnowledgeTools } from '../brains/knowledge.js';
import { recordBrainEvent, recordFileEvent } from '../brains/brainEvents.js';

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
  registerSiteCommentTools(server, ctx.uid);
  registerAdTools(server, APP);
  registerStepTools(server);
  registerQualityTools(server);
  registerKnowledgeTools(server);
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
      + 'Every site is editable by default («Hazlo tú»): the answer says whether the site has the bridge, the editor meta and editorAuth, and what is missing. '
      + 'Use when Nicolas says "publícala en Braindy App", "ponla en Mis apps".',
    inputSchema: {
      brandId: z.string(),
      title: z.string().describe('Card title, e.g. "Revista Level"'),
      url: z.string().describe('https URL'),
      kind: z.enum(['web', 'app', 'dashboard', 'research', 'marketmap']).optional().describe('web = sitio web (default), app = web app, dashboard'),
      description: z.string().optional().describe('One sentence in Spanish'),
      status: z.enum(['live', 'building']).optional().describe('live = Publicado (default), building = En construcción'),
      editorAuth: z.object({ projectId: z.string(), serviceAccount: z.string() }).optional()
        .describe('The site\'s own Firebase project id and its admin service account (firebase-adminsdk-…@<project>.iam.gserviceaccount.com): clients then open its editor already signed in. Once per site.'),
    },
  }, run(async ({ brandId, ...l }) => {
    const name = await requireBrand(brandId);
    const r = await setLink(brandId, l);
    return `${name}: enlace ${r.created ? 'agregado' : 'actualizado'} en Mis apps.\n${r.editing ? `${r.editing}\n` : ''}Ver: ${APP}/apps`;
  }));

  server.registerTool('braindy_plan', {
    title: 'Cargar el plan contratado en Mi plan',
    description: 'Sets the brand\'s "Mi plan" page in Braindy App from the accepted proposal: '
      + '(1) packs: only the plans or packs the client bought (not the alternatives), each with price and what it includes and excludes, plus total and payment terms; '
      + '(2) care: website hosting and the maintenance plan that follows; '
      + '(3) schedule (optional): the work plan BY WEEK (week 0 = the Monday in start), groups by stage or pack, rows from week to week, milestone = contract delivery. '
      + 'The schedule goes into the draft contract (its Anexo 2) or, once signed, into the live schedule; create the contract in Onboarding first. '
      + 'Plan replaces the previous one, so send all of it. Amounts are numbers in full units (9500000, not "9.5M"). Never put internal notes or other clients\' names. '
      + 'Use when Nicolas says "carga el plan en Braindy App", "sube la propuesta a Mi plan", "pon lo que contrató".',
    inputSchema: { brandId: z.string(), plan: PlanSchema, schedule: WeekSchedule.optional() },
  }, run(async ({ brandId, plan, schedule }) => {
    const name = await requireBrand(brandId);
    const parts = [await setPlan(brandId, plan, ctx.uid)];
    if (schedule) parts.push(await setSchedule(brandId, schedule));
    return `${name}: Mi plan actualizado (${parts.join('; ')}).\nVer: ${APP}/plan`;
  }));

  server.registerTool('braindy_stack', {
    title: 'Cargar el stack de apps de la marca en Mi plan',
    description: 'Sets the third-party apps a brand runs on and pays for (Webflow, Mailchimp, Resend, Metricool, WordPress, AI tools, automations…), '
      + 'shown in "Mi plan" in Braindy App: what each one does for the brand, plan, cost and period, who pays it (braindy = Braindy pays and bills it, '
      + 'client = the client pays the provider directly) and next renewal. Replaces the previous list, so send all of it. '
      + 'Never put credentials, API keys or internal notes here (credentials go in Accesos). '
      + 'Use when Nicolas says "carga el stack de apps de X", "X paga Webflow y Resend", "las apps que tiene contratadas".',
    inputSchema: { brandId: z.string(), items: StackSchema },
  }, run(async ({ brandId, items }) => {
    const name = await requireBrand(brandId);
    return `${name}: ${await setStack(brandId, items, ctx.uid)} en Mi plan.
Ver: ${APP}/plan`;
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
        link: z.string().optional().describe('https URL of the exact page where it was done (or will be done), e.g. https://www.site.com/nosotros/. Always fill it for site changes: Braindy opens that page beside the triage'),
        spot: z.string().optional().describe('The part of that page: a short text that is visible there (a heading, button label or phrase, copied exactly) or a CSS selector like #contacto. Braindy scrolls to it and outlines it. Always fill it when the change is a specific part'),
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

  server.registerTool('braindy_social_calendar_sync', {
    title: 'Subir el calendario de redes a Braindy App',
    description: 'Mirrors a brand\'s social media posts from Metricool (published and scheduled) into Braindy App, section "Calendario", which the client can only view. '
      + 'Read the posts with the Metricool getScheduledPosts tool (it returns published and pending ones), then send all posts of the range here: '
      + 'posts of that range missing from the list are removed. Keep ranges to a few weeks per call. '
      + 'Use when Nicolas says "sincroniza el calendario de X", "sube las publicaciones a Braindy", or after scheduling posts in Metricool.',
    inputSchema: {
      brandId: z.string(),
      from: z.string().describe('Start of the range read from Metricool, ISO 8601 with offset'),
      to: z.string().describe('End of the range, ISO 8601 with offset'),
      metricoolBrand: z.string().optional().describe('Metricool brand (blog) id, e.g. "6032280"'),
      posts: z.array(z.object({
        id: z.string().describe('Metricool post id'),
        date: z.string().describe('publicationDate.dateTime with its timezone offset, ISO 8601'),
        text: z.string().optional(),
        title: z.string().optional().describe('YouTube title, if any'),
        type: z.string().optional().describe('POST, REEL, STORY, CAROUSEL, SHORT…'),
        draft: z.boolean().optional(),
        networks: z.array(z.object({ network: z.string(), status: z.string().optional().describe('PUBLISHED, PENDING, ERROR'), url: z.string().optional().describe('publicUrl') })),
        media: z.array(z.string()).optional().describe('Media URLs (https)'),
        thumb: z.string().optional().describe('videoThumbnailUrl, if any'),
      })).max(400),
    },
  }, run(async ({ brandId, from, to, metricoolBrand, posts }) => {
    const name = await requireBrand(brandId);
    const r = await syncSocialPosts(brandId, posts, { from, to }, metricoolBrand);
    return `${name}: ${r.total} publicaciones · ${r.created} nuevas · ${r.updated} actualizadas · ${r.unchanged} sin cambios${r.removed ? ` · ${r.removed} quitadas` : ''}.\nVer: ${APP}/calendar`;
  }));

  server.registerTool('braindy_social_stats_sync', {
    title: 'Subir los resultados de redes a Braindy App',
    description: 'Mirrors one network\'s analytics from Metricool (getAnalyticsDataByMetrics) into Braindy App, section "Resultados": daily evolution, every post with its numbers, and audience. '
      + 'Days merge with what is stored, so a short recent range is enough for a daily refresh; posts are upserted by id. One call per network. '
      + 'Use when Nicolas says "trae los resultados de Metricool", "actualiza resultados de X".',
    inputSchema: {
      brandId: z.string(),
      network: z.string().describe('instagram, facebook, linkedin, youtube, tiktok…'),
      handle: z.string().optional(),
      daily: z.array(z.record(z.string(), z.union([z.number(), z.string(), z.null()]))).max(1100)
        .describe('{ d: "YYYY-MM-DD", followers, views, reach, interactions, posts, stories, engaged, gained, lost, clicks, likes, comments, shares, saves, watchMinutes }'),
      posts: z.array(z.record(z.string(), z.union([z.number(), z.string(), z.null()]))).max(600).optional()
        .describe('{ id, date, type, text, image, url, views, reach, likes, comments, saves, shares, interactions, engagement, clicks, watchTime, follows }'),
      audience: z.object({
        countries: z.array(z.object({ name: z.string(), n: z.number() })).optional(),
        cities: z.array(z.object({ name: z.string(), n: z.number() })).optional(),
        industry: z.array(z.object({ name: z.string(), n: z.number() })).optional().describe('LinkedIn'),
        seniority: z.array(z.object({ name: z.string(), n: z.number() })).optional().describe('LinkedIn'),
        function: z.array(z.object({ name: z.string(), n: z.number() })).optional().describe('LinkedIn'),
        companySize: z.array(z.object({ name: z.string(), n: z.number() })).optional().describe('LinkedIn'),
        ageGender: z.array(z.object({ age: z.string(), gender: z.string(), v: z.number() })).optional(),
      }).optional(),
    },
  }, run(async ({ brandId, network, ...input }) => {
    const name = await requireBrand(brandId);
    const r = await syncSocialStats(brandId, network, input);
    return `${name} · ${network}: ${r.days} días (${r.from} a ${r.to}) · ${r.posts} publicaciones.\nVer: ${APP}/report`;
  }));

  server.registerTool('braindy_web_stats_refresh', {
    title: 'Actualizar las visitas y búsquedas del sitio (Google Analytics + Search Console) en Braindy App',
    description: 'Reads Google Analytics 4 on the server (the braindy-api service account must be Viewer on the property) and refreshes Results › Website: '
      + 'daily users, sessions, views, engagement and key events, 30/90/365-day totals and top pages, channels, sources, countries, cities and devices; '
      + 'also Search Console (braindy-api as Restricted user): Google clicks, impressions, position, top searches and pages. '
      + 'Pass brandId (and propertyId / gscSite the first time, to link them) for one brand, or nothing for every brand that has one. '
      + 'Only works from the remote connector (Cloud Run). Use when Nicolas says "actualiza Analytics", "conecta el Analytics de X", and in the daily refresh.',
    inputSchema: {
      brandId: z.string().optional(),
      propertyId: z.string().regex(/^\d{6,12}$/).optional().describe('GA4 property id (numbers only), saved on the brand'),
      gscSite: z.string().regex(/^(sc-domain:|https?:\/\/)/).optional().describe('Search Console property, e.g. sc-domain:example.com'),
    },
  }, run(async ({ brandId, propertyId, gscSite }) => {
    const line = (src: string) => (r: { ok: boolean; brandId: string; note: string }) => `${r.ok ? '✓' : '✗'} ${r.brandId} · ${src}: ${r.note}`;
    if (!brandId) {
      const all = [...(await syncAllWebStats()).map(line('GA')), ...(await syncAllSearchStats()).map(line('Search Console'))];
      return all.join('\n') || 'Ninguna marca tiene Google Analytics ni Search Console.';
    }
    const name = await requireBrand(brandId);
    if (propertyId || gscSite) await db.doc(`brands/${brandId}`).set({ ...(propertyId && { gaPropertyId: propertyId }), ...(gscSite && { gscSite }) }, { merge: true });
    const ga = await syncWebStats(brandId).then((r) => `${r.days} días · ${r.users30 ?? 0} usuarios en 30 días`, (e: Error) => e.message);
    const sc = await syncSearchStats(brandId).then((r) => `${r.days} días · ${r.clicks30} clics en 30 días`, (e: Error) => e.message);
    return `${name}\nGoogle Analytics: ${ga}\nSearch Console: ${sc}\nVer: ${APP}/report`;
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
    return list.length ? list.map((x) => `${x.key} · ${x.group} · ${x.title} · ${x.status}${x.link ? ` · ${x.link}` : ''}${x.spot ? ` · «${x.spot}»` : ''}`).join('\n') : 'Todavía no hay ajustes del sitio guardados.';
  }));

  server.registerTool('braindy_log_session', {
    title: 'Registrar lo que se hizo en Braindy App',
    description: 'Saves a summary of this working session in the brand\'s internal work log (only Nicolas sees it). '
      + 'Write it in Spanish, plain and short: what was done, what is pending, links. Use when Nicolas says "registra lo que hicimos" or at the end of a session. '
      + 'With brain: true the entry becomes brand knowledge that braindy_brand_brain hands to every Brain before it works (rules, client corrections, lessons): '
      + 'saving again with the same project name replaces that chapter. Entries whose project starts with "Cerebro" count as knowledge too.',
    inputSchema: {
      brandId: z.string(), text: z.string().min(1).max(20000),
      project: z.string().optional().describe('Session, project or repo name, e.g. "Sanuteam Website"; for knowledge, the chapter name, e.g. "Cerebro Sanuteam · 1/3 · Manual"'),
      requestId: z.string().optional(),
      brain: z.boolean().optional().describe('true = permanent brand knowledge the Brains read before every task'),
    },
  }, run(async ({ brandId, text, project, requestId, brain }) => {
    const name = await requireBrand(brandId);
    await logSession(brandId, text, { project, requestId, brain });
    // The log itself is internal; the Brain feed only shows that a work session happened (and its project name).
    await recordBrainEvent(brandId, { kind: 'session', area: 'talks', ...(project ? { text: project } : {}) });
    return brain ? `Guardado en el cerebro de ${name}.` : `Registrado en ${name}.`;
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
      await recordFileEvent(brandId, folder ?? 'Uploads', done.map((d) => d.name));
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
      await recordFileEvent(brandId, folder ?? 'Uploads', done.map((d) => d.name));
      return `${name}: ${done.length} archivo(s) subidos (${done.map((d) => d.name).join(', ')}).\nVer: ${APP}/assets`;
    }));
  }

  const IMAGE = z.object({
    path: z.string().optional().describe(ctx.mode === 'local' ? 'Absolute path to the image' : 'Not available remotely: use url or base64'),
    url: z.string().optional().describe('https link to the image'),
    base64: z.string().optional().describe('Image content in base64'),
    name: z.string().optional().describe('File name with extension (needed with base64), e.g. "logo.svg"'),
  });
  server.registerTool('braindy_brand_identity', {
    title: 'Actualizar Mi marca en Braindy App',
    description: 'Updates the brand\'s "Mi marca" page in Braindy App with everything it shows: logos (primary, secondary, icon and other versions), colors, typography, '
      + 'design concept images, mockups (shown as approved work), tone and voice (essence, archetypes, principles, how it sounds, key language), strategy and Primal Branding. '
      + 'After creating a brand, send all of it in one call. '
      + 'Send only what you have: what is sent replaces what was there, the rest stays. Use right after creating or updating a brand, when Nicolas says '
      + '"actualiza Mi marca", "sube la marca a Braindy App", "pon los logos y colores en Braindy". Prefer SVG or PNG with transparent background for logos.',
    inputSchema: {
      brandId: z.string(),
      logos: z.object({
        primary: IMAGE.optional().describe('Main logo (horizontal lockup)'),
        secondary: IMAGE.optional().describe('Secondary lockup (stacked, etc.)'),
        icon: IMAGE.optional().describe('Symbol / isotype alone'),
        variations: z.array(IMAGE).max(40).optional().describe('Other versions (colors, negatives, one ink…): replaces the list'),
      }).optional(),
      colors: z.array(z.object({ name: z.string().optional(), hex: z.string().describe('#RRGGBB'), pantone: z.string().optional() })).max(24).optional().describe('Brand palette, main color first: replaces the list'),
      typography: z.array(z.object({
        fontFamily: z.string().describe('Exact family name, e.g. "Red Hat Display"'), role: z.string().optional().describe('e.g. "Títulos", "Texto"'),
        type: z.enum(['google', 'custom']).optional().describe('google = loads from Google Fonts'), url: z.string().optional().describe('https link to download or see the font'),
        description: z.string().optional(), name: z.string().optional(),
      })).max(8).optional().describe('Brand fonts: replaces the list'),
      concept: z.array(z.object({ image: IMAGE, kind: z.enum(['design-concept', 'hero']).optional(), caption: z.string().optional() })).max(12).optional()
        .describe('Design concept and cover images (how the logo was built, the idea): replaces the list'),
      mockups: z.array(z.object({ image: IMAGE, name: z.string().optional().describe('e.g. "Tarjetas de presentación"') })).max(24).optional()
        .describe('Mockups of the brand applied (cards, signage, social, packaging): replaces the list'),
      voice: z.object({
        essence: z.object({ title: z.string().optional().describe('One line, e.g. "Serene authority that orders time."'), description: z.string().optional() }).optional(),
        archetype: z.array(z.string()).max(3).optional().describe('Up to 3 archetypes, e.g. ["Sage", "Guardian"]'),
        tonePrinciples: z.array(z.object({ title: z.string(), description: z.string().optional() })).max(8).optional(),
        howItSounds: z.object({ is: z.array(z.string()).optional(), isNot: z.array(z.string()).optional() }).optional(),
        toneBalance: z.object({ tradition: z.number().optional(), modernity: z.number().optional(), intellect: z.number().optional(), emotion: z.number().optional() }).optional().describe('0–100 each'),
        keyLanguage: z.array(z.string()).max(24).optional().describe('Words and phrases the brand uses'),
        example: z.string().optional().describe('A sentence in the brand voice'),
      }).optional().describe('Tone and voice: replaces the whole voice'),
      strategy: z.object({
        position: z.string().optional().describe('Positioning in one or two sentences'), audiences: z.string().optional(), goals: z.string().optional(), avoid: z.string().optional(),
        competitors: z.array(z.object({ name: z.string(), promise: z.string().optional(), price: z.string().optional(), url: z.string().optional() })).max(12).optional(),
      }).optional().describe('Brand strategy: only the fields sent change'),
      primal: z.object({
        creationStory: z.string().optional().describe('Creation story: where the brand comes from and why'),
        creed: z.string().optional().describe('Creed: what the brand believes'),
        icons: z.string().optional().describe('Icons: the symbols people recognise it by'),
        rituals: z.string().optional().describe('Rituals: repeated moments of contact with the brand'),
        sacredWords: z.string().optional().describe('Sacred words: its own vocabulary'),
        nonBelievers: z.string().optional().describe('Non-believers: who and what the brand stands against'),
        leader: z.string().optional().describe('Leader: the person or idea that leads it'),
      }).optional().describe('Primal Branding, always first in Essence; one text per piece, lines become separate paragraphs; only the pieces sent change'),
    },
  }, run(async ({ brandId, ...input }) => {
    const name = await requireBrand(brandId);
    const done = await setIdentity(brandId, input, ctx.mode === 'local');
    return `${name}: Mi marca actualizada (${done.join(', ')}).
Ver: ${APP}/brand`;
  }));

  server.registerTool('braindy_requests', {
    title: 'Ver las solicitudes de una marca',
    description: 'Lists a brand\'s requests in Braindy App (id, title, state, versions). Open ones by default. Use it to get the requestId before delivering a version.',
    inputSchema: { brandId: z.string(), all: z.boolean().optional().describe('Include approved and published ones') },
  }, run(async ({ brandId, all }) => {
    await requireBrand(brandId);
    const list = await listRequests(brandId, all);
    return list.length ? list.map((r) => `${r.id} · ${r.title} · ${r.status}${r.versionCount ? ` · v${r.versionCount}` : ''}${r.dueDate ? ` · para ${r.dueDate}` : ''}${r.held ? ` · EN ESPERA de Nico (${r.held.versionId})${r.held.note ? `: pide ajustar «${r.held.note}»` : ''}` : ''}`).join('\n') : 'No hay solicitudes abiertas.';
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
    description: 'Delivers a new version of a request: uploads its files with a short note and routes it by lane, signed by NickMark. '
      + 'DIRECT (to the client now, "Por aprobar"): adaptations and sizes, corrections the client asked for (v2+), small site adjustments, results reports. '
      + 'AFTER (to the client now; Nicolas gets a daily summary): new pieces inside a line already approved. '
      + 'HELD for Nicolas (he approves and sends from his phone): branding, naming, strategy, campaigns and ads, prices or legal, the first piece of its kind, '
      + 'a brand in its first month, and anything under 90 or without a brand check (run braindy_quality_report first). '
      + 'The app decides the lane; the answer says which and why. If it comes back held, tell Nicolas and do not deliver again. '
      + (ctx.mode === 'local' ? 'Files are absolute paths.' : `Files go as base64 or https links (up to ${REMOTE_MAX_FILE / 1024 ** 2} MB each).`),
    inputSchema: {
      brandId: z.string(), requestId: z.string(),
      notes: z.string().max(4000).describe('What it is and what changed, in Spanish, for the client, written to scan: short sections on their own line ending in ":" '
        + '(e.g. "Qué es:", "Recorrido:", "Incluye:", "Para revisar:"), then one point per line starting with "- " and its keyword in **bold** '
        + '("- **PDF** para LinkedIn."). One idea per line; no long paragraphs, no arrows chaining ideas.'),
      nico_lo_vio: z.boolean().optional().describe('true ONLY when Nicolas reviewed this exact piece in this conversation and said to send it: it goes straight to the client'),
      para_nico: z.boolean().optional().describe('true to hold it for Nicolas whatever the lane (when in doubt)'),
      ...(ctx.mode === 'local' ? { paths: z.array(z.string()).min(1).max(20) } : { files: z.array(REMOTE_FILE).min(1).max(20) }),
    },
  }, run(async (a: { brandId: string; requestId: string; notes: string; nico_lo_vio?: boolean; para_nico?: boolean; paths?: string[]; files?: Array<z.infer<typeof REMOTE_FILE>> }) => {
    const name = await requireBrand(a.brandId);
    const writers: FileWriter[] = a.paths ? await Promise.all(a.paths.map(localWriter)) : await Promise.all((a.files ?? []).map(remoteWriter));
    const { n, lane, why, notice } = await deliverVersion(a.brandId, a.requestId, ctx.uid, writers, a.notes, { seen: a.nico_lo_vio, hold: a.para_nico });
    const see = `\nVer: ${APP}/requests/${a.requestId}`;
    if (lane === 'nico') return `${name}: versión ${n} subida y EN ESPERA de Nico (${why}). El cliente aún no la ve; a Nico le llegó «Para tu ojo» al celular para aprobar y enviar, o ajustar.${see}`;
    return `${name}: versión ${n} entregada al cliente (${why}); la solicitud pasó a Por aprobar.${lane === 'after' ? ' Nico la ve en su resumen del día.' : ''}${notice && 'status' in notice ? ` Aviso: ${notice.status}.` : ''}${see}`;
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
