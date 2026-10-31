// The website hosting offer, same as the public pricing page (hosting-braindy): Esencial, Pro, Ultra, add-ons and Enterprise.
// Prices are monthly in major units; annual = 10 months (2 free). Keep in sync with server/src/hosting.ts.
type Tx = readonly [es: string, en: string];
export type Cur = 'usd' | 'cop';
export type Bill = 'm' | 'y';
export type WebPlan = 'esencial' | 'pro' | 'ultra';

export const CHECKOUT = 'https://braindy-api-283103160183.us-central1.run.app/public/hosting/checkout';

export interface PlanCard {
  id: string; name: string; price: Record<Cur, number>; badge?: Tx; ideal: Tx; lead?: Tx;
  features: Array<{ b: Tx; rest?: Tx }>; specs: Array<[Tx, Tx]>;
}

export const WEB_PLANS: Array<PlanCard & { id: WebPlan }> = [
  {
    id: 'esencial', name: 'Esencial', price: { usd: 5, cop: 19900 },
    ideal: ['una empresa de servicios con un sitio de pocas páginas que cambia textos y fotos de vez en cuando.', 'a service business with a few-page site that changes texts and photos now and then.'],
    features: [
      { b: ['Editas textos, fotos y botones', 'You edit texts, photos and buttons'], rest: [' haciendo clic sobre la misma página', ' by clicking on the page itself'] },
      { b: ['Agregas, ordenas y ocultas secciones', 'You add, sort and hide sections'], rest: [' con el diseño de tu marca', ' in your brand’s design'] },
      { b: ['Nada se ve en público', 'Nothing goes public'], rest: [' hasta que tocas Publicar', ' until you hit Publish'] },
      { b: ['Videos tutoriales', 'Video tutorials'], rest: [' del nivel básico', ', basic level'] },
    ],
    specs: [[['Editores', 'Editors'], ['1 persona', '1 person']], [['Visitas', 'Visits'], ['~5.000 / mes', '~5,000 / month']], [['Espacio', 'Storage'], ['1 GB', '1 GB']], [['Respuesta', 'Reply'], ['2 días hábiles', '2 business days']]],
  },
  {
    id: 'pro', name: 'Pro', price: { usd: 15, cop: 59900 }, badge: ['Recomendado para crecer', 'Best to grow'],
    ideal: ['marcas que publican seguido: blog, catálogo, landings de campaña o una tienda pequeña.', 'brands that publish often: blog, catalog, campaign landings or a small store.'],
    lead: ['Todo lo de Esencial, más:', 'Everything in Esencial, plus:'],
    features: [
      { b: ['Páginas y landings propias', 'Your own pages and landings'], rest: [' a partir de plantillas', ' from templates'] },
      { b: ['CMS:', 'CMS:'], rest: [' blog, catálogo o colecciones, hasta 1.000 entradas', ' blog, catalog or collections, up to 1,000 entries'] },
      { b: ['Varias personas editando', 'Several people editing'], rest: [', cada una con su acceso', ', each with their own access'] },
      { b: ['Tienda en línea opcional', 'Optional online store'], rest: [' y tutoriales intermedios', ' and intermediate tutorials'] },
    ],
    specs: [[['Editores', 'Editors'], ['Hasta 3', 'Up to 3']], [['Visitas', 'Visits'], ['~10.000 / mes', '~10,000 / month']], [['Espacio', 'Storage'], ['5 GB', '5 GB']], [['Respuesta', 'Reply'], ['1 día hábil', '1 business day']]],
  },
  {
    id: 'ultra', name: 'Ultra', price: { usd: 35, cop: 139900 }, badge: ['El que todos quieren', 'The one everyone wants'],
    ideal: ['equipos que quieren cambiar el sitio pidiéndolo en sus palabras, desde su IA o su WhatsApp.', 'teams that change the site by asking in their own words, from their AI or WhatsApp.'],
    lead: ['Todo lo de Pro, más:', 'Everything in Pro, plus:'],
    features: [
      { b: ['Edita desde tu Claude o ChatGPT', 'Edit from your Claude or ChatGPT'], rest: [' con una conexión MCP: pides “crea una landing para diciembre” y queda en borrador', ' over MCP: ask “make a December landing” and it lands as a draft'] },
      { b: ['Edita desde WhatsApp:', 'Edit from WhatsApp:'], rest: [' mandas el texto o la foto y se aplica (solo números autorizados)', ' send the text or photo and it is applied (authorized numbers only)'] },
      { b: ['Monitoreo 24/7:', '24/7 monitoring:'], rest: [' si el sitio falla, nos llega una alerta antes de que nos escribas', ' if the site fails we get an alert before you write'] },
      { b: ['CMS hasta 3.000 entradas', 'CMS up to 3,000 entries'], rest: [' y tutoriales avanzados', ' and advanced tutorials'] },
    ],
    specs: [[['Editores', 'Editors'], ['Hasta 5', 'Up to 5']], [['Visitas', 'Visits'], ['~25.000 / mes', '~25,000 / month']], [['Espacio', 'Storage'], ['10 GB', '10 GB']], [['Respuesta', 'Reply'], ['Mismo día hábil', 'Same business day']]],
  },
];

/** Comparison rows: label, then Esencial, Pro, Ultra ('✓' and '–' as is). */
export const COMPARE: Array<{ group: Tx; rows: Array<[Tx, Tx, Tx, Tx]> }> = [
  { group: ['Editar tu sitio', 'Editing your site'], rows: [
    [['Textos, fotos y botones', 'Texts, photos and buttons'], ['✓', '✓'], ['✓', '✓'], ['✓', '✓']],
    [['Secciones con el diseño de tu marca', 'Sections in your brand’s design'], ['✓', '✓'], ['✓', '✓'], ['✓', '✓']],
    [['Páginas y landings propias', 'Your own pages and landings'], ['–', '–'], ['✓', '✓'], ['✓', '✓']],
    [['CMS (blog, catálogo, colecciones)', 'CMS (blog, catalog, collections)'], ['–', '–'], ['1.000 entradas', '1,000 entries'], ['3.000 entradas', '3,000 entries']],
    [['Tienda en línea', 'Online store'], ['–', '–'], ['Complemento', 'Add-on'], ['Complemento', 'Add-on']],
    [['Edición desde Claude o ChatGPT (MCP)', 'Editing from Claude or ChatGPT (MCP)'], ['–', '–'], ['–', '–'], ['✓', '✓']],
    [['Edición desde WhatsApp', 'Editing from WhatsApp'], ['–', '–'], ['–', '–'], ['300 mensajes / mes', '300 messages / month']],
    [['Personas con acceso', 'People with access'], ['1', '1'], ['Hasta 3', 'Up to 3'], ['Hasta 5', 'Up to 5']],
    [['Videos tutoriales', 'Video tutorials'], ['Básicos', 'Basic'], ['Intermedios', 'Intermediate'], ['Avanzados', 'Advanced']],
  ] },
  { group: ['Capacidad', 'Capacity'], rows: [
    [['Visitas al mes', 'Visits per month'], ['~5.000', '~5,000'], ['~10.000', '~10,000'], ['~25.000', '~25,000']],
    [['Transferencia incluida', 'Included transfer'], ['10 GB', '10 GB'], ['20 GB', '20 GB'], ['50 GB', '50 GB']],
    [['Espacio para archivos', 'File storage'], ['1 GB · ~3.000 fotos', '1 GB · ~3,000 photos'], ['5 GB · ~15.000 fotos', '5 GB · ~15,000 photos'], ['10 GB · ~30.000 fotos', '10 GB · ~30,000 photos']],
  ] },
  { group: ['Soporte técnico', 'Technical support'], rows: [
    [['Primera respuesta', 'First reply'], ['2 días hábiles', '2 business days'], ['1 día hábil', '1 business day'], ['Mismo día hábil', 'Same business day']],
    [['Si el sitio está caído', 'If the site is down'], ['8 h hábiles', '8 business hours'], ['4 h hábiles', '4 business hours'], ['2 h hábiles', '2 business hours']],
    [['Monitoreo automático 24/7', 'Automatic 24/7 monitoring'], ['–', '–'], ['–', '–'], ['✓', '✓']],
    [['Historial de versiones publicadas', 'History of published versions'], ['✓', '✓'], ['✓', '✓'], ['✓', '✓']],
  ] },
];

export const ADDONS: Array<{ name: Tx; for: string; price: Record<Cur, number>; body: Tx; note?: Tx }> = [
  { name: ['Créditos Braindy', 'Braindy credits'], for: 'Esencial · Pro · Ultra', price: { usd: 49, cop: 194900 },
    body: ['300 créditos al mes para pedirle a los Brains carruseles, imágenes, videos, investigaciones y planes de marketing con tu marca ya cargada.', '300 credits a month to ask the Brains for carousels, images, videos, research and marketing plans with your brand already loaded.'],
    note: ['También hay planes de 1.000 y 3.000 créditos.', 'There are also 1,000 and 3,000 credit plans.'] },
  { name: ['Tienda en línea', 'Online store'], for: 'Pro · Ultra', price: { usd: 10, cop: 39900 },
    body: ['Hasta 100 productos con pago por Stripe, Mercado Pago o Wompi, o conexión con Shopify o Ecwid.', 'Up to 100 products paid with Stripe, Mercado Pago or Wompi, or a link to Shopify or Ecwid.'],
    note: ['La pasarela cobra su propia comisión por venta.', 'The payment gateway charges its own fee per sale.'] },
  { name: ['CMS adicional', 'Extra CMS'], for: 'Pro · Ultra', price: { usd: 3, cop: 11900 },
    body: ['Cada 1.000 entradas más allá de las incluidas en tu plan. Te avisamos antes de llegar al límite.', 'Each 1,000 entries beyond your plan. We warn you before you reach the limit.'] },
];

export const ENTERPRISE: PlanCard[] = [
  { id: 'plataforma', name: 'Plataforma', price: { usd: 89, cop: 349900 },
    ideal: ['revistas, medios y sitios con mucho contenido, tráfico alto y un equipo editorial.', 'magazines, media and content-heavy sites with high traffic and an editorial team.'],
    lead: ['Todo lo de Ultra, más:', 'Everything in Ultra, plus:'],
    features: [{ b: ['Flujo editorial', 'Editorial flow'], rest: [': autor, editor y publicador', ': author, editor and publisher'] }, { b: ['Ambiente de pruebas', 'Staging environment'] }, { b: ['Respaldo diario', 'Daily backup'], rest: [' de la base de datos', ' of the database'] }, { b: ['SEO técnico', 'Technical SEO'], rest: [' y panel de métricas', ' and metrics panel'] }],
    specs: [[['Editores', 'Editors'], ['Hasta 15', 'Up to 15']], [['Visitas', 'Visits'], ['~150.000 / mes', '~150,000 / month']]] },
  { id: 'app', name: 'App', price: { usd: 179, cop: 699900 },
    ideal: ['convertir tu web en una app con usuarios registrados y herramientas para clientes o equipo.', 'turning your site into an app with signed-in users and tools for clients or team.'],
    lead: ['Todo lo de Plataforma, más:', 'Everything in Plataforma, plus:'],
    features: [{ b: ['App instalable', 'Installable app'], rest: [' con notificaciones', ' with notifications'] }, { b: ['Área privada con login', 'Private area with login'] }, { b: ['Servicio propio en Cloud Run', 'Its own Cloud Run service'] }, { b: ['Módulos', 'Modules'], rest: [': emailing, onboarding, dashboards', ': emailing, onboarding, dashboards'] }],
    specs: [[['Usuarios', 'Users'], ['Hasta 5.000', 'Up to 5,000']], [['Visitas', 'Visits'], ['~250.000 / mes', '~250,000 / month']]] },
  { id: 'medida', name: 'A medida', price: { usd: 349, cop: 1389900 },
    ideal: ['apps en tiendas, integraciones con tus sistemas y agentes de IA, con acuerdo de servicio.', 'store apps, integrations with your systems and AI agents, with a service agreement.'],
    lead: ['Todo lo de App, más:', 'Everything in App, plus:'],
    features: [{ b: ['App Store y Google Play', 'App Store and Google Play'] }, { b: ['Integraciones', 'Integrations'], rest: [' con CRM, ERP o facturación', ' with CRM, ERP or invoicing'] }, { b: ['Agentes de IA', 'AI agents'], rest: [' y automatizaciones', ' and automations'] }, { b: ['SLA por contrato', 'SLA by contract'] }],
    specs: [[['Módulos', 'Modules'], ['4 incluidos', '4 included']], [['Ambientes', 'Environments'], ['Desarrollo, pruebas, producción', 'Dev, staging, production']]] },
];
