/** Section keys as people say them (the counts store the short key). */
const SECTION_NAME: Record<string, [string, string]> = {
  home: ['Inicio', 'Home'], brand: ['Mi marca', 'My brand'], requests: ['Pedidos', 'Requests'], files: ['Archivos y entregas', 'Files and deliveries'],
  apps: ['Sitios y apps', 'Sites and apps'], research: ['Investigación', 'Research'], results: ['Resultados', 'Results'], learn: ['Aprende', 'Learn'],
  accesses: ['Accesos', 'Accesses'], billing: ['Plan y pagos', 'Plan and billing'], admin: ['Admin', 'Admin'], account: ['Cuenta', 'Account'],
  settings: ['Ajustes', 'Settings'], resources: ['Recursos', 'Resources'], wishlist: ['Wishlist', 'Wishlist'], onboarding: ['Onboarding', 'Onboarding'],
  team: ['Equipo', 'Team'], alerts: ['Avisos', 'Alerts'], open: ['Archivo abierto', 'Opened file'], conectar: ['Conectar', 'Connect'], ask: ['Pedir', 'Ask'], other: ['Otras', 'Other'],
};
/** First path segment → section key, where the route name differs from the section (same as team/sections ROUTE_SECTION). */
const PATH_SECTION: Record<string, string> = { assets: 'files', deliveries: 'files', calendar: 'files', pauta: 'files', report: 'results', pay: 'billing', plan: 'billing' };

export const sectionName = (key: string, lang: string) => SECTION_NAME[key]?.[lang === 'es' ? 0 : 1] ?? key;

/** "/requests/:id" → "Pedidos › detalle"; "/brand/visual" → "Mi marca › visual". */
export function pageName(path: string, lang: string, detail: string) {
  const [first = 'home', ...rest] = path.split('/').filter(Boolean);
  const head = sectionName(PATH_SECTION[first] ?? first, lang);
  return [head, ...rest.map((s) => (s.startsWith(':') ? detail : s.replace(/-/g, ' ')))].join(' › ');
}
