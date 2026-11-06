// The website hosting offer, same as the public pricing page (hosting-braindy): Esencial, Pro, Ultra, add-ons and Enterprise.
// Prices are monthly in major units; annual = 10 months (2 free). Keep in sync with server/src/hosting.ts.
type Tx = readonly [es: string, en: string];
export type Cur = 'usd' | 'cop';
export type Bill = 'm' | 'y';
export type WebPlan = 'esencial' | 'pro' | 'ultra';
export type Term = 'mcp' | 'cms' | 'transfer' | 'https' | 'dns' | 'pwa' | 'sla' | 'dkim';

export const CHECKOUT = 'https://braindy-api-283103160183.us-central1.run.app/public/hosting/checkout';

export interface PlanCard {
  id: string; name: string; price: Record<Cur, number>; badge?: Tx; color: string; top?: boolean; ideal: Tx; lead?: Tx;
  features: Array<{ b: Tx; rest?: Tx; small?: Tx; term?: Term }>; specs: Array<[Tx, Tx]>;
}

export const WEB_PLANS: Array<PlanCard & { id: WebPlan }> = [
  {
    id: 'esencial', name: 'Esencial', price: { usd: 5, cop: 19900 }, color: '#06B6D4',
    ideal: ['una empresa de servicios con un sitio de pocas páginas que cambia textos y fotos de vez en cuando.', 'a service business with a few-page site that changes texts and photos now and then.'],
    features: [
      { b: ['Editas textos, fotos y botones', 'You edit texts, photos and buttons'], rest: [' haciendo clic sobre la misma página', ' by clicking on the page itself'] },
      { b: ['Agregas, ordenas y ocultas secciones', 'You add, sort and hide sections'], rest: [' con el diseño de tu marca', ' in your brand’s design'] },
      { b: ['CMS:', 'CMS:'], rest: [' blog o catálogo, hasta 300 entradas', ' blog or catalog, up to 300 entries'], term: 'cms' },
      { b: ['Nada se ve en público', 'Nothing goes public'], rest: [' hasta que tocas Publicar', ' until you hit Publish'] },
      { b: ['Videos tutoriales', 'Video tutorials'], rest: [' del nivel básico', ', basic level'] },
    ],
    specs: [[['Editores', 'Editors'], ['1 persona', '1 person']], [['Visitas', 'Visits'], ['~5.000 / mes', '~5,000 / month']], [['Espacio', 'Storage'], ['1 GB', '1 GB']], [['Respuesta', 'Reply'], ['2 días hábiles', '2 business days']]],
  },
  {
    id: 'pro', name: 'Pro', price: { usd: 15, cop: 59900 }, color: '#8B5CF6', badge: ['Recomendado para crecer', 'Best to grow'],
    ideal: ['marcas que publican seguido: blog, catálogo, landings de campaña o una tienda pequeña.', 'brands that publish often: blog, catalog, campaign landings or a small store.'],
    lead: ['Todo lo de Esencial, más:', 'Everything in Esencial, plus:'],
    features: [
      { b: ['Páginas y landings propias', 'Your own pages and landings'], rest: [' a partir de plantillas', ' from templates'] },
      { b: ['CMS:', 'CMS:'], rest: [' blog, catálogo o colecciones, hasta 1.000 entradas', ' blog, catalog or collections, up to 1,000 entries'], term: 'cms' },
      { b: ['Varias personas editando', 'Several people editing'], rest: [', cada una con su acceso', ', each with their own access'] },
      { b: ['Tienda en línea opcional', 'Optional online store'], rest: [' y tutoriales intermedios', ' and intermediate tutorials'] },
    ],
    specs: [[['Editores', 'Editors'], ['Hasta 3', 'Up to 3']], [['Visitas', 'Visits'], ['~10.000 / mes', '~10,000 / month']], [['Espacio', 'Storage'], ['5 GB', '5 GB']], [['Respuesta', 'Reply'], ['1 día hábil', '1 business day']]],
  },
  {
    id: 'ultra', name: 'Ultra', price: { usd: 35, cop: 139900 }, color: '#2A7FFF', top: true, badge: ['El que todos quieren', 'The one everyone wants'],
    ideal: ['equipos que quieren cambiar el sitio pidiéndolo en sus palabras, desde su IA o su WhatsApp.', 'teams that change the site by asking in their own words, from their AI or WhatsApp.'],
    lead: ['Todo lo de Pro, más:', 'Everything in Pro, plus:'],
    features: [
      { b: ['Edita desde tu Claude o ChatGPT', 'Edit from your Claude or ChatGPT'], rest: [' con una conexión MCP', ' over an MCP connection'], term: 'mcp', small: ['Pides “crea una landing para diciembre con estas fotos” y queda en borrador.', 'You ask “make a December landing with these photos” and it lands as a draft.'] },
      { b: ['Edita desde WhatsApp:', 'Edit from WhatsApp:'], rest: [' mandas el texto o la foto y se aplica', ' send the text or photo and it is applied'], small: ['Solo los números autorizados. Correo, Telegram o Slack a pedido.', 'Authorized numbers only. Email, Telegram or Slack on request.'] },
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
    [['CMS (blog, catálogo, colecciones)', 'CMS (blog, catalog, collections)'], ['300 entradas', '300 entries'], ['1.000 entradas', '1,000 entries'], ['3.000 entradas', '3,000 entries']],
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

/** On-brand pieces (Braindy credits, 300 a month, in the Brand tab of Mi plan), and the Ultra + credits combo. */
export const CREDITS = { usd: 49, cop: 194900 }, COMBO = { usd: 79, cop: 314900 };

export const ADDONS: Array<{ name: Tx; for: string; price: Record<Cur, number>; body: Tx; note?: Tx }> = [
  { name: ['Tienda en línea', 'Online store'], for: 'Pro · Ultra', price: { usd: 10, cop: 39900 },
    body: ['Hasta 100 productos con pago por Stripe, Mercado Pago o Wompi, o conexión con Shopify o Ecwid.', 'Up to 100 products paid with Stripe, Mercado Pago or Wompi, or a link to Shopify or Ecwid.'],
    note: ['La pasarela cobra su propia comisión por venta.', 'The payment gateway charges its own fee per sale.'] },
  { name: ['CMS adicional', 'Extra CMS'], for: 'Esencial · Pro · Ultra', price: { usd: 3, cop: 11900 },
    body: ['Cada 1.000 entradas más allá de las incluidas en tu plan. Te avisamos antes de llegar al límite.', 'Each 1,000 entries beyond your plan. We warn you before you reach the limit.'] },
];

export const ENTERPRISE: PlanCard[] = [
  { id: 'plataforma', name: 'Plataforma', price: { usd: 89, cop: 349900 }, color: '#F5B301',
    ideal: ['revistas, medios y sitios con mucho contenido, tráfico alto y un equipo editorial.', 'magazines, media and content-heavy sites with high traffic and an editorial team.'],
    lead: ['Todo lo de Ultra, más:', 'Everything in Ultra, plus:'],
    features: [{ b: ['Flujo editorial', 'Editorial flow'], rest: [': autor, editor y publicador', ': author, editor and publisher'] }, { b: ['Ambiente de pruebas', 'Staging environment'] }, { b: ['Respaldo diario', 'Daily backup'], rest: [' de la base de datos', ' of the database'] }, { b: ['SEO técnico', 'Technical SEO'], rest: [' y panel de métricas', ' and metrics panel'] }],
    specs: [[['Editores', 'Editors'], ['Hasta 15', 'Up to 15']], [['Visitas', 'Visits'], ['~150.000 / mes', '~150,000 / month']]] },
  { id: 'app', name: 'App', price: { usd: 179, cop: 699900 }, color: '#06B6D4',
    ideal: ['convertir tu web en una app con usuarios registrados y herramientas para clientes o equipo.', 'turning your site into an app with signed-in users and tools for clients or team.'],
    lead: ['Todo lo de Plataforma, más:', 'Everything in Plataforma, plus:'],
    features: [{ b: ['App instalable', 'Installable app'], rest: [' en el celular, con notificaciones', ' on the phone, with notifications'], term: 'pwa' }, { b: ['Área privada con login', 'Private area with login'] }, { b: ['Servicio propio en Cloud Run', 'Its own Cloud Run service'] }, { b: ['Módulos', 'Modules'], rest: [': emailing, onboarding, dashboards', ': emailing, onboarding, dashboards'] }],
    specs: [[['Usuarios', 'Users'], ['Hasta 5.000', 'Up to 5,000']], [['Visitas', 'Visits'], ['~250.000 / mes', '~250,000 / month']]] },
  { id: 'medida', name: 'A medida', price: { usd: 349, cop: 1389900 }, color: '#2A7FFF', top: true, badge: ['Hecho a tu escala', 'Built to your scale'],
    ideal: ['apps en tiendas, integraciones con tus sistemas y agentes de IA, con acuerdo de servicio.', 'store apps, integrations with your systems and AI agents, with a service agreement.'],
    lead: ['Todo lo de App, más:', 'Everything in App, plus:'],
    features: [{ b: ['App Store y Google Play', 'App Store and Google Play'] }, { b: ['Integraciones', 'Integrations'], rest: [' con CRM, ERP o facturación', ' with CRM, ERP or invoicing'] }, { b: ['Agentes de IA', 'AI agents'], rest: [' y automatizaciones', ' and automations'] }, { b: ['Acuerdo de servicio (SLA)', 'Service agreement (SLA)'], rest: [' por contrato, con atención de caídas fuera de horario', ' by contract, with outage response after hours'], term: 'sla' }],
    specs: [[['Módulos', 'Modules'], ['4 incluidos', '4 included']], [['Ambientes', 'Environments'], ['Desarrollo, pruebas, producción', 'Dev, staging, production']]] },
];

/** Development modules, added to any Enterprise plan (monthly covers operation, infrastructure and support). */
export const MODULES: Array<{ name: Tx; price: Record<Cur, number>; body: Tx; note?: Tx }> = [
  { name: ['Emailing', 'Emailing'], price: { usd: 55, cop: 219900 }, body: ['Newsletters y secuencias automáticas con plantillas de tu marca. Hasta 20.000 correos al mes con métricas de apertura y clics.', 'Newsletters and automated sequences with your brand templates. Up to 20,000 emails a month with open and click metrics.'], note: ['Dominio autenticado con SPF, DKIM y DMARC para no caer en spam.', 'Domain authenticated with SPF, DKIM and DMARC so it stays out of spam.'] },
  { name: ['Onboarding de clientes', 'Client onboarding'], price: { usd: 69, cop: 269900 }, body: ['Tu cliente nuevo llena sus datos, firma el contrato dentro de la app, paga y recibe la bienvenida, sin papeles ni correos sueltos.', 'Your new client fills in their data, signs the contract in the app, pays and gets the welcome, no paperwork.'] },
  { name: ['Dashboard de datos', 'Data dashboard'], price: { usd: 59, cop: 229900 }, body: ['Ventas, campañas, inventario o indicadores en un tablero que se actualiza solo, con acceso por roles.', 'Sales, campaigns, inventory or KPIs on a board that updates itself, with role-based access.'] },
  { name: ['Área privada con login', 'Private area with login'], price: { usd: 49, cop: 189900 }, body: ['Portal para clientes, aliados o equipo: documentos, pedidos, solicitudes y contenido exclusivo.', 'A portal for clients, partners or team: documents, orders, requests and exclusive content.'] },
  { name: ['App instalable (PWA)', 'Installable app (PWA)'], price: { usd: 39, cop: 149900 }, body: ['Tu sitio se instala en el celular como una app, con ícono propio, notificaciones y uso sin conexión.', 'Your site installs on the phone as an app, with its own icon, notifications and offline use.'] },
  { name: ['App en tiendas', 'Store apps'], price: { usd: 99, cop: 389900 }, body: ['Publicación y actualizaciones en App Store y Google Play.', 'Publishing and updates on the App Store and Google Play.'], note: ['Las cuentas de desarrollador de Apple y Google van a nombre de tu empresa.', 'The Apple and Google developer accounts are in your company’s name.'] },
  { name: ['Agente de IA', 'AI agent'], price: { usd: 79, cop: 309900 }, body: ['Un asistente en tu sitio o WhatsApp que responde con la información de tu marca y pasa a una persona cuando hace falta.', 'An assistant on your site or WhatsApp that answers with your brand’s information and hands over to a person when needed.'], note: ['Incluye un volumen base de conversaciones; el resto se factura según consumo.', 'Includes a base volume of conversations; the rest is billed by use.'] },
  { name: ['WhatsApp Business', 'WhatsApp Business'], price: { usd: 49, cop: 189900 }, body: ['Confirmaciones, recordatorios y avisos automáticos por WhatsApp con plantillas aprobadas.', 'Automatic confirmations, reminders and notices on WhatsApp with approved templates.'], note: ['Meta cobra aparte cada conversación iniciada por la empresa.', 'Meta charges separately for each business-initiated conversation.'] },
  { name: ['Automatizaciones', 'Automations'], price: { usd: 45, cop: 179900 }, body: ['Flujos entre tus herramientas: formularios a CRM, pagos a facturación, alertas a tu equipo.', 'Flows between your tools: forms to CRM, payments to invoicing, alerts to your team.'] },
  { name: ['Reservas y agenda', 'Bookings and scheduling'], price: { usd: 39, cop: 149900 }, body: ['Citas, clases o eventos con calendario, cupos, pago anticipado y recordatorios.', 'Appointments, classes or events with calendar, capacity, prepayment and reminders.'] },
];

/** "Which one fits me?": four yes/no questions; login, app, emailing or dashboards mean Enterprise. */
export const FINDER: Array<{ id: 'pages' | 'team' | 'chat' | 'app'; q: Tx }> = [
  { id: 'pages', q: ['¿Vas a crear páginas nuevas, blog o catálogo?', 'Will you create new pages, a blog or a catalog?'] },
  { id: 'team', q: ['¿Más de una persona va a editar?', 'Will more than one person edit?'] },
  { id: 'chat', q: ['¿Quieres editar desde WhatsApp, Claude o ChatGPT?', 'Do you want to edit from WhatsApp, Claude or ChatGPT?'] },
  { id: 'app', q: ['¿Necesitas usuarios con login, una app, emailing o un dashboard?', 'Do you need users with login, an app, emailing or a dashboard?'] },
];
export const PICKS: Record<'esencial' | 'pro' | 'ultra' | 'ent', { name: string; why: Tx }> = {
  esencial: { name: 'Esencial', why: ['Tu sitio publicado y tú cambias lo que necesites dentro del diseño.', 'Your site published, and you change what you need within the design.'] },
  pro: { name: 'Pro', why: ['Creas páginas, blog o catálogo, y varias personas editan con su propio acceso.', 'You create pages, a blog or a catalog, and several people edit with their own access.'] },
  ultra: { name: 'Ultra', why: ['Editas el sitio pidiéndolo en tus palabras desde WhatsApp, Claude o ChatGPT.', 'You edit the site by asking in your own words from WhatsApp, Claude or ChatGPT.'] },
  ent: { name: 'Enterprise', why: ['Usuarios con login, app, emailing o dashboards viven en los planes Enterprise.', 'Users with login, apps, emailing or dashboards live in the Enterprise plans.'] },
};
