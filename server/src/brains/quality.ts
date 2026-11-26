// Brand check before NickMark sees a delivery: a checklist built from what the brand has in Braindy (colors, type,
// voice, what to avoid, what the client corrected before, sibling brands that must not appear) plus the basics.
// The session doing the request reviews its own files against it and reports; the result stays on the request
// (request.quality, admin only in the app). It does not pass with a failed critical item or under 85 points.
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../firebase.js';
import { requireBrand } from '../connector/store.js';
import { siblings } from '../connector/brandGuard.js';
import { brainBlock } from './knowledge.js';

export type CheckItem = { id: string; text: string; critical?: boolean };
const PASS_AT = 85;

export async function qualityChecklist(brandId: string): Promise<{ name: string; items: CheckItem[] }> {
  const [brand, identity, brain, learnings, sibs] = await Promise.all([
    db.doc(`brands/${brandId}`).get(),
    db.doc(`brands/${brandId}/context/identity`).get(),
    db.doc(`brands/${brandId}/context/brain`).get(),
    db.doc(`brands/${brandId}/context/learnings`).get(),
    siblings(brandId),
  ]);
  const name = String(brand.get('name') ?? brandId);
  const colors = ((identity.get('colors') as Array<{ name?: string; hex?: string }>) ?? []).slice(0, 8).map((c) => `${c.name ?? ''} ${c.hex ?? ''}`.trim()).filter(Boolean);
  const fonts = ((identity.get('typography') as Array<{ fontFamily?: string }>) ?? []).slice(0, 4).map((f) => f.fontFamily).filter(Boolean);
  const isNot = ((identity.get('voice.howItSounds.isNot') as string[]) ?? []).slice(0, 6);
  const avoid = String(identity.get('strategy.avoid') ?? brain.get('avoid') ?? '').trim();
  const changed = ((learnings.get('items') as Array<{ kind: string; text: string; retired?: boolean }>) ?? []).filter((l) => l.kind === 'changed' && !l.retired).slice(-5);
  const items: CheckItem[] = [
    { id: 'asked', text: 'Responde todo lo que pidió el cliente en la solicitud y sus comentarios (nada a medias, nada que no pidió).', critical: true },
    { id: 'brand', text: `Es de ${name}: nombre, logo y datos correctos y en su versión vigente.`, critical: true },
    ...(sibs.length ? [{ id: 'siblings', text: `No aparece nada de otra marca del mismo cliente: ${sibs.map((s) => s.name).join(', ')}.`, critical: true }] : []),
    { id: 'private', text: 'Sin claves, contraseñas, rutas del PC, datos internos ni datos personales que no deban verse.', critical: true },
    ...(colors.length ? [{ id: 'colors', text: `Usa la paleta de la marca: ${colors.join(', ')}.` }] : []),
    ...(fonts.length ? [{ id: 'fonts', text: `Usa la tipografía de la marca: ${fonts.join(', ')}.` }] : []),
    { id: 'voice', text: `El texto suena a la marca${isNot.length ? ` y no suena ${isNot.join(', ')}` : ''}.` },
    ...(avoid ? [{ id: 'avoid', text: `Evita lo que la marca pidió evitar: ${avoid.slice(0, 300)}` }] : []),
    ...changed.map((l, i) => ({ id: `learned${i + 1}`, text: `El cliente ya corrigió antes: «${l.text.slice(0, 200)}». No repetir.` })),
    { id: 'spelling', text: 'Ortografía, tildes y puntuación correctas en el idioma de la marca.' },
    { id: 'files', text: 'Archivos finales en el formato y tamaño correctos, con nombres claros; enlaces funcionando si quedó publicado.' },
    { id: 'missing', text: 'Si falta algo (texto, foto, dato), está dicho en las notas de entrega, no inventado.' },
  ];
  return { name, items };
}

export function scoreOf(items: CheckItem[], checks: Array<{ id: string; ok: boolean }>) {
  const ok = new Map(checks.map((c) => [c.id, c.ok]));
  const passedItems = items.filter((i) => ok.get(i.id) === true).length;
  const score = items.length ? Math.round((passedItems / items.length) * 100) : 100;
  const criticalFailed = items.filter((i) => i.critical && ok.get(i.id) !== true).map((i) => i.id);
  return { score, passed: score >= PASS_AT && criticalFailed.length === 0, criticalFailed };
}

export function registerQualityTools(server: McpServer) {
  server.registerTool('braindy_quality_checklist', {
    title: 'Lista de revisión de marca',
    description: 'Antes de entregar: la lista con la que revisas tus propios archivos contra la marca (paleta, tipografía, voz, lo que hay que evitar, correcciones anteriores del cliente, marcas hermanas), seguida del cerebro de la marca (lo mismo que braindy_brand_brain). Abre y mira cada archivo final, revisa cada punto y repórtalo con braindy_quality_report.',
    inputSchema: { brandId: z.string() },
  }, async (a) => {
    try {
      await requireBrand(a.brandId);
      const { name, items } = await qualityChecklist(a.brandId);
      const brain = await brainBlock(a.brandId, 'Revisa también contra el cerebro de la marca (sus reglas y correcciones cuentan en los puntos «asked», «voice» y «avoid»)');
      return { content: [{ type: 'text' as const, text: `Revisión de marca de ${name} (pasa con ${PASS_AT}+ y sin fallar ningún punto crítico):\n${items.map((i) => `- [${i.id}]${i.critical ? ' (crítico)' : ''} ${i.text}`).join('\n')}${brain}` }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });

  server.registerTool('braindy_quality_report', {
    title: 'Reportar la revisión de marca',
    description: 'Reporta cómo salió la revisión de braindy_quality_checklist, un resultado por punto (id, ok y una nota corta si falla). Devuelve el puntaje y si pasa. Si no pasa, corrige y vuelve a revisar (máximo 2 rondas) antes de entregar.',
    inputSchema: {
      brandId: z.string(), requestId: z.string(),
      checks: z.array(z.object({ id: z.string(), ok: z.boolean(), note: z.string().max(300).optional() })).min(1).max(40),
    },
  }, async (a) => {
    try {
      await requireBrand(a.brandId);
      const ref = db.doc(`brands/${a.brandId}/requests/${a.requestId}`);
      const r = await ref.get();
      if (!r.exists) throw new Error('No existe esa solicitud.');
      const { items } = await qualityChecklist(a.brandId);
      const { score, passed, criticalFailed } = scoreOf(items, a.checks);
      const round = Number(r.get('quality.round') ?? 0) + 1;
      const text = new Map(items.map((i) => [i.id, i.text]));
      await ref.update({
        quality: {
          score, passed, round, at: FieldValue.serverTimestamp(),
          checks: items.map((i) => { const c = a.checks.find((x) => x.id === i.id); return { id: i.id, text: i.text.slice(0, 300), critical: !!i.critical, ok: c?.ok === true, note: c?.note?.slice(0, 300) ?? (c ? '' : 'Sin revisar') }; }),
        },
      });
      const fails = items.filter((i) => a.checks.find((c) => c.id === i.id)?.ok !== true).map((i) => `- [${i.id}] ${text.get(i.id)}`);
      return { content: [{ type: 'text' as const, text: passed
        ? `Pasa: ${score}/100. Puedes entregar.`
        : `No pasa: ${score}/100${criticalFailed.length ? ` · críticos: ${criticalFailed.join(', ')}` : ''}. Corrige esto y vuelve a revisar:\n${fails.join('\n')}` }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });
}
