// What Braindy sells, the same for every client: Build / ReBuild (three Neuro phases) and BOS (NickMark runs the
// brand every month). Prices are NOT here: each proposal carries its own (see Offer). Hosting and Studio are fixed.

export type Lang = 'en' | 'es';
type T = readonly [es: string, en: string];
export const tr = (t: T, lang: Lang) => (lang === 'es' ? t[0] : t[1]);

export type PhaseKey = 'strategy' | 'image' | 'web';
export type BosKey = 'starter' | 'intermediate' | 'fullstack';
export type Kind = 'build' | 'rebuild';
export type Block = readonly [T, readonly T[]];

/** The client's offer, saved under proposal.options.offer (the public API already serves `options`). */
export interface Offer {
  kind: Kind;
  phases: Partial<Record<PhaseKey, number | null>>; // chosen phases → price for this client (null = included, no price)
  bos?: BosKey | null;
  bosMonthly?: number | null;
  bosMonths?: number | null;
  note?: string; // one line for the client under the total (e.g. a discount)
}

export const PHASE_KEYS: PhaseKey[] = ['strategy', 'image', 'web'];
export const BOS_KEYS: BosKey[] = ['starter', 'intermediate', 'fullstack'];

export const PHASES: Record<PhaseKey, { name: string; brain: 'researcher' | 'creator' | 'builder'; weeks: T; blocks: readonly Block[]; build?: readonly Block[]; rebuild?: readonly Block[] }> = {
  strategy: {
    name: 'Neuro Estrategia', brain: 'researcher', weeks: ['1 semana', '1 week'],
    blocks: [
      [['Diagnóstico de mercado', 'Market diagnosis'], [['Competencia', 'Competitors'], ['Tipos de clientes', 'Customer types'], ['Análisis de referentes', 'Benchmarks']]],
      [['Estrategia', 'Strategy'], [['Cliente ideal', 'Ideal customer'], ['Personalidad y voz de la marca', 'Brand personality and voice'], ['Primal Branding', 'Primal Branding']]],
      [['Storytelling', 'Storytelling'], [['Narrativa de la marca', 'Brand narrative'], ['Casos de éxito', 'Success stories']]],
    ],
  },
  image: {
    name: 'Neuro Imagen', brain: 'creator', weeks: ['2 semanas', '2 weeks'],
    build: [[['Nombre y logo', 'Name and logo'], [['Diseño del nombre', 'Naming'], ['Logotipo responsivo', 'Responsive logo']]]],
    rebuild: [[['Rediseño del logo', 'Logo redesign'], [['Logotipo responsivo renovado', 'Renewed responsive logo'], ['Mascota con IA (opcional)', 'AI mascot (optional)']]]],
    blocks: [
      [['Identidad visual', 'Visual identity'], [['Sistema de identidad visual', 'Visual identity system'], ['Guía de estilo', 'Style guide']]],
      [['Manual de marca', 'Brand book'], [['6 elementos de la marca', '6 brand elements'], ['Brochure y presentación', 'Brochure and deck'], ['Banners y firma de correo', 'Banners and email signature']]],
      [['Brand messaging', 'Brand messaging'], [['Tono y tagline', 'Tone and tagline'], ['Mensajes para redes', 'Social messages'], ['Palabras clave SEO y hashtags', 'SEO keywords and hashtags']]],
    ],
  },
  web: {
    name: 'Neuro Web', brain: 'builder', weeks: ['3 semanas', '3 weeks'],
    blocks: [
      [['Sitio de marca', 'Brand website'], [['UX y arquitectura de la información', 'UX and information architecture'], ['Diseño visual y animaciones', 'Visual design and motion'], ['Copywriting', 'Copywriting']]],
      [['Contenido editable', 'Editable content'], [['Blog, videocast o podcast', 'Blog, videocast or podcast'], ['Servicios y productos', 'Services and products'], ['Cursos y casos de éxito', 'Courses and success stories']]],
      [['Medición y SEO', 'Measurement and SEO'], [['Google Analytics', 'Google Analytics'], ['Microsoft Clarity', 'Microsoft Clarity'], ['Optimización SEO', 'SEO optimization']]],
    ],
  },
};

/** A phase's blocks for this kind of project (Neuro Imagen opens with naming or with the logo redesign). */
export const phaseBlocks = (k: PhaseKey, kind: Kind) => [...(PHASES[k][kind] ?? []), ...PHASES[k].blocks];

export const BOS: Record<BosKey, { name: string; brain: 'researcher' | 'marketer' | 'builder'; focus: T; plus?: T; blocks: readonly Block[] }> = {
  starter: {
    name: 'Starter', brain: 'researcher', focus: ['La marca fuerte y completa en todos sus puntos de contacto.', 'A strong, complete brand at every touchpoint.'],
    blocks: [
      [['Assets de marca', 'Brand assets'], [['Manual y brochures', 'Brand book and brochures'], ['Empaques', 'Packaging'], ['Regalos corporativos', 'Corporate gifts']]],
      [['Espacios', 'Spaces'], [['Señalética', 'Signage'], ['Diseño de interiores', 'Interior design']]],
      [['Sitio web', 'Website'], [['Diseño base', 'Base design'], ['Actualización mensual', 'Monthly update']]],
      [['Fotografía', 'Photography'], [['Productos y espacios', 'Products and spaces'], ['Una sesión cada trimestre', 'One shoot per quarter']]],
    ],
  },
  intermediate: {
    name: 'Intermediate', brain: 'marketer', focus: ['Un ecosistema digital sólido que convierte.', 'A solid digital ecosystem that converts.'], plus: ['Todo Starter, más:', 'Everything in Starter, plus:'],
    blocks: [
      [['Sitio web completo', 'Full website'], [['Blog', 'Blog'], ['Productos y servicios', 'Products and services']]],
      [['Redes y pauta', 'Social and ads'], [['Manejo de redes', 'Social media management'], ['Pauta en Google, Meta o LinkedIn', 'Ads on Google, Meta or LinkedIn']]],
      [['Contenido al mes', 'Content every month'], [['8 piezas gráficas', '8 graphic pieces'], ['2 videos (incluye UGC)', '2 videos (UGC included)']]],
      [['Campañas', 'Campaigns'], [['Automatización de contactos', 'Contact automation'], ['SEO', 'SEO']]],
    ],
  },
  fullstack: {
    name: 'Fullstack', brain: 'builder', focus: ['Escalar con tecnología e inteligencia artificial.', 'Scale with technology and AI.'], plus: ['Todo Intermediate, más:', 'Everything in Intermediate, plus:'],
    blocks: [
      [['App o software a medida', 'Custom app or software'], [['Módulos de ventas', 'Sales modules'], ['Automatizaciones', 'Automations']]],
      [['IA aplicada', 'Applied AI'], [['Chatbots y agentes', 'Chatbots and agents'], ['IA en ventas y atención al cliente', 'AI in sales and customer service']]],
      [['Embudo de ventas', 'Sales funnel'], [['Captación, conversión y fidelización', 'Acquisition, conversion and loyalty'], ['Integración con tu CRM', 'CRM integration']]],
      [['Posicionamiento', 'Positioning'], [['SEO avanzado', 'Advanced SEO'], ['Análisis de resultados', 'Results analysis']]],
    ],
  },
};

/** Fixed prices, the same for everyone (Mi plan › Sitio and Studio). */
export const ADDONS = {
  site: [['Esencial', 19900, 5], ['Pro', 59900, 15], ['Ultra', 139900, 35]] as Array<[string, number, number]>,
  studio: [['300', 194900, 49], ['1.000', 794900, 199], ['3.000', 1989900, 499]] as Array<[string, number, number]>,
};

export const money = (n: number | null | undefined, cur: string, lang: Lang) =>
  n == null ? '' : cur === 'cop' ? `$${Math.round(n).toLocaleString('es-CO')}` : `USD ${Math.round(n).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US')}`;

/** Which payment path the accepted offer becomes (billing understands launch / transform / continuity). */
export const pathOf = (o: Offer) => {
  const project = PHASE_KEYS.some((k) => k in o.phases);
  return project && o.bos ? 'transform' : project ? 'launch' : 'continuity';
};
export const projectTotal = (o: Offer) => PHASE_KEYS.reduce((a, k) => a + (o.phases[k] ?? 0), 0);
