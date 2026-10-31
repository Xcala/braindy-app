import type { Contract } from './types';

/** Starting point for the panel editor: the "Pack A + Pack C" route, 6 quincenas, with maintenance after. */
export const EXAMPLE: Contract = {
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
  schedule: {
    title: 'Plan de trabajo · 3 meses', note: 'Arranque la semana del 6 de septiembre · cierre el 30 de noviembre · 12 reuniones semanales de 1 hora.',
    periods: [
      { label: 'SEP 1', sub: '7-15', from: '2026-09-07' }, { label: 'SEP 2', sub: '16-30', from: '2026-09-16' },
      { label: 'OCT 1', sub: '1-15', from: '2026-10-01' }, { label: 'OCT 2', sub: '16-31', from: '2026-10-16' },
      { label: 'NOV 1', sub: '1-15', from: '2026-11-01' }, { label: 'NOV 2', sub: '16-30', from: '2026-11-16' },
    ],
    meetings: { label: 'Reunión semanal · 1h', detail: 'Jueves · 12 en total', cells: ['10 sep', '17 · 24 sep', '1 · 8 · 15 oct', '22 · 29 oct', '5 · 12 nov', '19 · 26 nov'] },
    sections: [
      { title: 'Pack A · Marca · quincenas 1–3', rows: [
        { name: 'Discovery, talleres y auditoría', detail: 'Marca, producto y política de imagen', from: 0, to: 0, tone: 'strategy', milestone: false, done: false },
        { name: 'Sistema de identidad', detail: 'Símbolo, tipografía, color y tokens', from: 0, to: 0, tone: 'brand', milestone: false, done: false },
        { name: 'Entrega de identidad', detail: 'Símbolo, logotipo y sistema en SVG', from: 1, to: 1, tone: 'brand', milestone: true, label: 'Identidad', done: true },
        { name: 'Manual, plantillas y empaque', detail: 'Aplicación, prohibiciones y artes para impresión', from: 1, to: 1, tone: 'brand', milestone: false, done: false },
        { name: 'Entrega de manual y empaque', detail: 'Manual, kit editable y artes listas para el impresor', from: 2, to: 2, tone: 'brand', milestone: true, label: 'Manual', done: true },
      ] },
      { title: 'Pack C · Brand OS y pauta · quincenas 4–6', rows: [
        { name: 'Base de conocimiento', detail: 'ADN, productos, precios y cobertura', from: 2, to: 3, tone: 'knowledge', milestone: false, ready: 4, done: false },
        { name: 'Agentes de identidad y contenido', detail: 'Aplican el sistema y escriben con la voz de marca', from: 3, to: 3, tone: 'agents', milestone: false, ready: 4, done: false },
        { name: 'Agentes de producto e imagen', detail: 'Catálogo y edición de material real', from: 3, to: 4, tone: 'agents', milestone: false, done: false },
        { name: 'Agente Vendedor', detail: 'WhatsApp 24/7 · cotiza y cierra', from: 3, to: 4, tone: 'web', milestone: false, done: false },
        { name: 'Setup de pauta', detail: 'Píxel, catálogo y conversiones', from: 4, to: 4, tone: 'strategy', milestone: false, done: false },
        { name: 'Las 4 campañas encendidas', detail: 'Montadas y midiendo', from: 5, to: 5, tone: 'ads', milestone: false, done: false },
        { name: 'Entrega Pack C', detail: 'Los agentes montados y la pauta encendida', from: 5, to: 5, tone: 'brand', milestone: true, label: 'Pack C', done: false },
      ] },
    ],
  },
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
