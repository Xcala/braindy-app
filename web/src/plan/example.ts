import type { BrandPlan, StackItem } from './types';

/** Starting point for the panel editor: the "Pack A + Pack C" route with maintenance after. The schedule is the contract's. */
export const EXAMPLE: BrandPlan = {
  title: 'Ruta Pack A + Pack C',
  summary: 'Identidad en septiembre, manual y empaque a comienzos de octubre, y el Brand OS montado al cierre de noviembre.',
  currency: 'cop', start: '2026-09-07', end: '2026-11-30', status: 'active',
  packs: [
    { label: 'Pack A', name: 'Marca', subtitle: 'El sistema visual · 4 semanas', price: 2500000, period: 'once', status: 'delivered',
      includes: ['Símbolo y logotipo en SVG', 'Color y tipografía en tokens', 'Manual de aplicación', 'Plantillas editables para redes', 'Artes de sticker, bolsa y etiqueta'], excludes: [] },
    { label: 'Pack C', name: 'Brand OS y pauta', subtitle: 'Setup, no operación · 4 semanas', price: 4000000, period: 'once', status: 'in_progress',
      includes: ['Base de conocimiento de marca', 'Los 4 agentes de producción', 'Agente Vendedor y Agente de Recompra en WhatsApp', 'Setup de pauta: píxel, catálogo y conversiones', 'Las 4 campañas montadas y encendidas'],
      excludes: ['No incluye operar la pauta ni producir contenido mes a mes'] },
  ],
  total: { amount: 6500000, label: 'Tu ruta · pago único' },
  payment: ['50% al iniciar cada pack · 50% al entregarlo', '10% de descuento pagando todo al iniciar'],
  notIncluded: ['La inversión en medios: se paga directo a Meta y a Google', 'Dominio y hosting a nombre de la marca', 'La impresión del empaque'],
  care: {
    name: 'Plan de mantenimiento · Todo, operando', price: 6000000, period: 'month', note: 'Se factura mes a mes, con corte el día 1',
    includes: [
      { title: 'Marca', body: 'Aplicación continua del sistema a cada pieza nueva.' },
      { title: 'Web y catálogo', body: 'Mantenimiento del sitio, páginas nuevas, fichas y precios al día.' },
      { title: 'Contenido', body: 'Calendario mensual, guiones de reel y copy con la voz de la marca.' },
      { title: 'Pauta digital', body: 'Meta y Google: 4 campañas, optimización e informe.' },
    ],
    excludes: ['la inversión en medios'],
    metrics: [{ value: '48', label: 'horas hábiles de respuesta' }, { value: '1', label: 'reunión por semana' }, { value: '4', label: 'campañas activas' }, { value: '1', label: 'informe mensual' }],
    hosting: 'pro', startsAfter: 'Arranca cuando termina el cronograma, el 30 de noviembre. Recomendamos al menos 3 meses.',
  },
};

/** A sample apps stack, generic: what the brand runs on and who pays it. */
export const EXAMPLE_STACK: StackItem[] = [
  { name: 'Webflow', category: 'web', purpose: 'Sitio web y CMS', plan: 'CMS anual', cost: 276, currency: 'usd', period: 'year', payer: 'braindy', renews: '2027-03-12', url: 'https://webflow.com', status: 'active' },
  { name: 'Mailchimp', category: 'email', purpose: 'Boletín y correos a clientes', plan: 'Standard', cost: 20, currency: 'usd', period: 'month', payer: 'client', url: 'https://mailchimp.com', status: 'active' },
  { name: 'Resend', category: 'email', purpose: 'Correos del sitio (formularios, avisos)', plan: 'Free', cost: 0, currency: 'usd', period: 'month', payer: 'braindy', url: 'https://resend.com', status: 'active' },
  { name: 'Metricool', category: 'social', purpose: 'Programación y métricas de redes', plan: 'Starter', cost: 22, currency: 'usd', period: 'month', payer: 'braindy', url: 'https://metricool.com', status: 'active' },
];
