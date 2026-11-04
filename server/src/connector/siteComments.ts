// Comments pinned on a brand's site in Braindy App (Figma style, brands/{b}/siteComments + replies), for the Brains:
// read what the client marked on each page and answer or resolve it. Same records the viewer writes.
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from './store.js';

const BRAINS = 'Builder con NicoMarca';
const path = (url: string) => { try { return decodeURI(new URL(url).pathname); } catch { return url; } };

export async function listSiteComments(brandId: string, all = false) {
  const snap = await db.collection(`brands/${brandId}/siteComments`).orderBy('createdAt').get();
  const out = [];
  for (const [i, d] of snap.docs.entries()) {
    if (!all && d.get('resolved')) continue;
    const replies = await d.ref.collection('replies').orderBy('createdAt').get();
    out.push({
      id: d.id, n: i + 1, url: String(d.get('url') ?? ''), author: String(d.get('authorName') ?? ''), text: String(d.get('text') ?? ''),
      part: String(d.get('spot.text') ?? ''), selector: String(d.get('spot.selector') ?? ''), resolved: d.get('resolved') === true,
      replies: replies.docs.map((r) => `${r.get('authorName') || 'Alguien'}: ${r.get('text')}`),
    });
  }
  return out;
}

export async function answerSiteComment(brandId: string, id: string, uid: string, text?: string, resolve?: boolean) {
  const ref = db.doc(`brands/${brandId}/siteComments/${id}`);
  if (!(await ref.get()).exists) throw new Error(`No existe el comentario ${id} en esta marca.`);
  if (text?.trim()) await ref.collection('replies').add({ author: uid, authorName: BRAINS, text: text.trim().slice(0, 2000), createdAt: FieldValue.serverTimestamp() });
  if (resolve !== undefined) await ref.update(resolve ? { resolved: true, resolvedBy: uid, resolvedAt: FieldValue.serverTimestamp() } : { resolved: false, resolvedBy: FieldValue.delete(), resolvedAt: FieldValue.delete() });
}

const reply = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const fail = (e: unknown) => ({ content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true });
const run = <A>(fn: (a: A) => Promise<string>) => async (a: A) => { try { return reply(await fn(a)); } catch (e) { return fail(e); } };

export function registerSiteCommentTools(server: McpServer, uid: string) {
  server.registerTool('braindy_site_comments_get', {
    title: 'Ver los comentarios sobre el sitio',
    description: 'Lists the comments the client and NickMark pinned on parts of the brand\'s website in Braindy App (Figma style): '
      + 'page, the part they clicked (its visible text and CSS selector), the comment and its replies. Open ones by default. '
      + 'Read them before working on a website and treat each as a requested adjustment.',
    inputSchema: { brandId: z.string(), all: z.boolean().optional().describe('Include resolved comments') },
  }, run(async ({ brandId, all }) => {
    await requireBrand(brandId);
    const list = await listSiteComments(brandId, all);
    if (!list.length) return all ? 'No hay comentarios sobre el sitio.' : 'No hay comentarios abiertos sobre el sitio.';
    return list.map((c) => `#${c.n} (${c.id})${c.resolved ? ' · resuelto' : ''} · ${path(c.url)}${c.part ? ` · sobre «${c.part}»` : ''}${c.selector ? ` · ${c.selector}` : ''}\n`
      + `  ${c.author || 'Alguien'}: ${c.text.replace(/\n/g, ' ')}${c.replies.map((r) => `\n  ↳ ${r.replace(/\n/g, ' ')}`).join('')}`).join('\n');
  }));

  server.registerTool('braindy_site_comment_reply', {
    title: 'Responder o resolver un comentario del sitio',
    description: 'Replies to a comment pinned on the website (signed "Builder con NicoMarca") and/or marks it resolved once the change is live. '
      + 'Use the id from braindy_site_comments_get. Say in the reply what was done, in plain Spanish.',
    inputSchema: { brandId: z.string(), commentId: z.string(), text: z.string().optional(), resolve: z.boolean().optional().describe('true = resolved, false = reopen') },
  }, run(async ({ brandId, commentId, text, resolve }) => {
    await requireBrand(brandId);
    if (!text?.trim() && resolve === undefined) throw new Error('Escribe una respuesta o indica resolve.');
    await answerSiteComment(brandId, commentId, uid, text, resolve);
    return `Listo${text?.trim() ? ': respuesta enviada' : ''}${resolve === true ? ', marcado como resuelto' : resolve === false ? ', reabierto' : ''}.`;
  }));
}
