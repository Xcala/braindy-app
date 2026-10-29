// Publishes a site/app in Braindy App in one go, without the connector loaded: link in My apps, site triage and work log.
// Usage: npx.cmd tsx C:/Users/Mark/braindy-app/server/mcp/publicar.ts <file.json>
//   { "brandId": "revista-level", "link": { "title", "url", "kind?", "description?", "status?" },
//     "triage": { "items": [...], "siteUrl?", "round?", "removeMissing?" }, "log": { "text", "project?" } }
// Every part is optional except brandId. Run with --find <text> to look up a brandId.
import { readFile } from 'node:fs/promises';
import { findBrands, logSession, requireBrand, setLink, syncSiteChanges } from '../src/connector/store.js';

const APP = 'https://braindy-app-staging.web.app';
const [arg, val] = process.argv.slice(2);

if (arg === '--find') {
  for (const b of await findBrands(val ?? '')) console.log(`${b.id} · ${b.name}${b.status !== 'active' ? ' · archivada' : ''}`);
  process.exit(0);
}
if (!arg) { console.error('Falta el archivo JSON. Ver el encabezado de publicar.ts.'); process.exit(1); }

const p = JSON.parse(await readFile(arg, 'utf8'));
const name = await requireBrand(p.brandId);
console.log(`Marca: ${name}`);
if (p.link) {
  const r = await setLink(p.brandId, p.link);
  console.log(`Mis apps: enlace ${r.created ? 'agregado' : 'actualizado'} (${p.link.url})`);
}
if (p.triage?.items?.length) {
  const r = await syncSiteChanges(p.brandId, p.triage.items, p.triage);
  console.log(`Ajustes del sitio: ${r.total} puntos · ${r.created} nuevos · ${r.updated} actualizados · ${r.unchanged} sin cambios${r.removed ? ` · ${r.removed} borrados` : ''}`);
}
if (p.log?.text) {
  await logSession(p.brandId, p.log.text, { project: p.log.project });
  console.log('Registro de trabajo: sesión guardada');
}
console.log(`Ver: ${APP}/apps`);
process.exit(0);
