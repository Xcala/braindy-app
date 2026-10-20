// Request taxonomy (category → subcategory → piece), rescued from brief's categories.ts and translated.
// Keys are stable ids stored on each request; labels are per language.
export type BrainId = 'researcher' | 'marketer' | 'creator' | 'builder';
type L = { en: string; es: string };
export interface Category { id: string; label: L; lead: BrainId; helpers: BrainId[]; withNicolas?: boolean; subs: Array<{ id: string; label: L; withNicolas?: boolean; types: L[] }> }

const t = (en: string, es: string): L => ({ en, es });

export const TAXONOMY: Category[] = [
  { id: 'web', label: t('Web and digital product', 'Web y producto digital'), lead: 'builder', helpers: ['creator'], subs: [
    { id: 'landing', label: t('Landing pages', 'Landing pages'), types: [t('Landing page (sales / leads)', 'Landing page (venta / leads)'), t('Home page', 'Home page'), t('Inner page (about, services, blog)', 'Página interna (nosotros, servicios, blog)'), t('Website redesign', 'Rediseño web'), t('Webflow build', 'Desarrollo en Webflow'), t('Smart forms', 'Formularios inteligentes'), t('Integrations (HubSpot, Shopify, APIs)', 'Integraciones (HubSpot, Shopify, APIs)'), t('Technical SEO', 'SEO técnico')] },
    { id: 'site', label: t('Full websites', 'Sitios web completos'), types: [t('Corporate website', 'Sitio corporativo'), t('E-commerce', 'E-commerce'), t('Portfolio', 'Portafolio'), t('Blog / magazine', 'Blog / revista')] },
    { id: 'apps', label: t('Web apps / SaaS', 'Web apps / SaaS'), types: [t('MVP', 'MVP'), t('Internal platform', 'Plataforma interna'), t('Admin panel', 'Panel de administración')] },
    { id: 'ux', label: t('UX/UI', 'UX/UI'), types: [t('UX audit', 'Auditoría UX'), t('Interface redesign', 'Rediseño de interfaz'), t('Wireframes', 'Wireframes')] },
    { id: 'integrations', label: t('Integrations', 'Integraciones'), types: [t('Analytics setup', 'Configuración de analítica'), t('CRM connection', 'Conexión con CRM'), t('Zapier / Make automation', 'Automatización con Zapier / Make')] },
  ] },
  { id: 'social', label: t('Social media', 'Redes sociales'), lead: 'creator', helpers: ['marketer'], subs: [
    { id: 'organic', label: t('Organic content', 'Contenido orgánico'), types: [t('Static post', 'Post estático'), t('Carousel', 'Carrusel'), t('Story', 'Historia'), t('Highlight cover', 'Portada destacada'), t('Content adaptation', 'Adaptación de contenido')] },
    { id: 'ads', label: t('Paid content (ads)', 'Contenido pago (ads)'), types: [t('Static ad', 'Ad estático'), t('Animated / video ad', 'Ad animado / video'), t('A/B variation set', 'Set de variaciones A/B')] },
    { id: 'video', label: t('Video', 'Video'), types: [t('Reel', 'Reel'), t('Short video (TikTok / Shorts)', 'Video corto (TikTok / Shorts)'), t('Thumbnail', 'Miniatura'), t('Video script', 'Guion de video'), t('Video editing', 'Edición de video')] },
    { id: 'strategy', label: t('Strategy', 'Estrategia'), withNicolas: true, types: [t('Content calendar', 'Calendario de contenido'), t('Media plan', 'Plan de medios'), t('Profile audit', 'Auditoría de perfil')] },
  ] },
  { id: 'graphic', label: t('Graphic design and brand assets', 'Diseño gráfico y piezas de marca'), lead: 'creator', helpers: ['marketer'], subs: [
    { id: 'pieces', label: t('Graphic pieces', 'Piezas gráficas'), types: [t('Flyer', 'Flyer'), t('Banner', 'Banner'), t('Infographic', 'Infografía'), t('Mockups', 'Mockups'), t('Illustration', 'Ilustración')] },
    { id: 'identity', label: t('Visual identity', 'Identidad visual'), types: [t('Iconography', 'Iconografía'), t('Brand guidelines', 'Lineamientos de marca'), t('Logo refresh', 'Rediseño de logotipo')] },
    { id: 'corporate', label: t('Corporate material', 'Material corporativo'), types: [t('Pitch deck', 'Presentación (pitch deck)'), t('Brochure', 'Brochure'), t('Business cards', 'Tarjetas de presentación')] },
    { id: 'digital', label: t('Digital assets', 'Piezas digitales'), types: [t('Editable templates', 'Plantillas editables'), t('Digital packaging', 'Empaque digital'), t('Email assets', 'Piezas para email')] },
  ] },
  { id: 'branding', label: t('Branding', 'Branding'), lead: 'creator', helpers: ['researcher', 'marketer'], withNicolas: true, subs: [
    { id: 'identity', label: t('Brand identity', 'Identidad de marca'), types: [t('Logo', 'Logo'), t('Logo redesign', 'Rediseño de logo'), t('Sub-brand', 'Submarca'), t('Brand system', 'Sistema de marca')] },
    { id: 'architecture', label: t('Brand architecture', 'Arquitectura de marca'), types: [t('Brand manual', 'Manual de marca'), t('Brand guidelines', 'Lineamientos de marca')] },
    { id: 'naming', label: t('Naming and voice', 'Naming y voz'), types: [t('Naming', 'Naming'), t('Slogan / tagline', 'Slogan / tagline'), t('Brand story', 'Historia de marca'), t('Positioning', 'Posicionamiento'), t('Voice and tone', 'Voz y tono')] },
  ] },
  { id: 'marketing', label: t('Digital marketing', 'Marketing digital'), lead: 'marketer', helpers: ['creator', 'researcher'], subs: [
    { id: 'performance', label: t('Performance', 'Performance'), withNicolas: true, types: [t('Ad campaigns (Meta, Google, TikTok)', 'Campañas (Meta, Google, TikTok)'), t('Ad creatives', 'Creatividades para ads'), t('Sales funnels', 'Embudos de venta')] },
    { id: 'automation', label: t('Automation', 'Automatización'), types: [t('Email marketing', 'Email marketing'), t('CRM setup (HubSpot)', 'Configuración de CRM (HubSpot)'), t('Automations', 'Automatizaciones'), t('Lead magnets', 'Lead magnets')] },
    { id: 'strategy', label: t('Strategy', 'Estrategia'), withNicolas: true, types: [t('Landing optimization', 'Optimización de landing'), t('Copywriting', 'Copywriting'), t('Growth strategy', 'Estrategia de crecimiento')] },
  ] },
  { id: 'ai', label: t('AI, automation and apps', 'IA, automatización y apps'), lead: 'builder', helpers: ['researcher'], subs: [
    { id: 'tools', label: t('AI tools', 'Herramientas de IA'), types: [t('AI agent', 'Agente de IA'), t('Chatbot', 'Chatbot'), t('Content generator', 'Generador de contenido'), t('AI API integration', 'Integración con APIs de IA')] },
    { id: 'apps', label: t('Apps', 'Apps'), types: [t('Internal app', 'App interna'), t('Smart dashboards', 'Tableros inteligentes'), t('Reporting systems', 'Sistemas de reportes')] },
    { id: 'automation', label: t('Automation', 'Automatización'), types: [t('Marketing automation', 'Automatización de marketing'), t('Custom workflows', 'Flujos personalizados')] },
  ] },
  { id: 'multimedia', label: t('Multimedia and production', 'Multimedia y producción'), lead: 'creator', helpers: ['builder'], subs: [
    { id: 'video', label: t('Video', 'Video'), types: [t('Video production', 'Producción de video'), t('Professional editing', 'Edición profesional'), t('Motion graphics', 'Motion graphics'), t('Animation', 'Animación')] },
    { id: 'photo', label: t('Photography', 'Fotografía'), types: [t('Product photography', 'Fotografía de producto'), t('Lifestyle photography', 'Fotografía lifestyle'), t('Retouching', 'Retoque')] },
    { id: 'audio', label: t('Audio', 'Audio'), types: [t('Podcast', 'Podcast'), t('Studio recording', 'Grabación en estudio'), t('Audio editing', 'Edición de audio')] },
  ] },
  { id: 'other', label: t('Other', 'Otros'), lead: 'researcher', helpers: ['marketer'], withNicolas: true, subs: [
    { id: 'special', label: t('Special requests', 'Solicitudes especiales'), types: [t('Consulting', 'Consultoría'), t('Brand diagnosis', 'Diagnóstico de marca'), t('Web audit', 'Auditoría web'), t('Social audit', 'Auditoría de redes'), t("I'm not sure what I need", 'No sé exactamente qué necesito')] },
  ] },
];

export const findCategory = (id?: string) => TAXONOMY.find((c) => c.id === id);
export const findSub = (cat?: string, sub?: string) => findCategory(cat)?.subs.find((s) => s.id === sub);
