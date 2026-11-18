// The brand's brain for the Brains: knowledge chapters (rules, client corrections, lessons) plus the latest work sessions,
// read before any work. braindy_brand_brain hands it over on demand; the quality checklist and the start of each Brain's turn
// (braindy_work_step "doing") carry it too, so no turn works without it.
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { brandBrain, requireBrand } from '../connector/store.js';

/** The brain as a block of text to append to a tool reply; empty when the brand has nothing saved yet. */
export async function brainBlock(brandId: string, lead: string): Promise<string> {
  const brain = await brandBrain(brandId);
  if (!brain.text) return `

${lead}: esta marca todavía no tiene conocimiento guardado (se guarda con braindy_log_session y brain: true).`;
  return `

${lead} (${brain.chapters} capítulo(s), ${brain.sessions} sesión(es) recientes):

${brain.text}`;
}

export function registerKnowledgeTools(server: McpServer) {
  server.registerTool('braindy_brand_brain', {
    title: 'Leer el cerebro de la marca',
    description: 'Call this FIRST, before any work for a brand (a request, a piece, a review, a reply): returns everything the Brains know about it, '
      + 'the knowledge chapters (brand rules, client corrections, lessons, people, where files live) and the latest work sessions. '
      + 'Read it completely and apply it; it outranks your general defaults. Then use braindy_quality_checklist before delivering.',
    inputSchema: { brandId: z.string() },
  }, async ({ brandId }) => {
    try {
      const name = await requireBrand(brandId);
      const brain = await brandBrain(brandId);
      const text = brain.text
        ? `Cerebro de ${name}: ${brain.chapters} capítulo(s) y ${brain.sessions} sesión(es) recientes.

${brain.text}`
        : `${name} todavía no tiene conocimiento guardado. Guárdalo con braindy_log_session y brain: true.`;
      return { content: [{ type: 'text' as const, text }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });
}
