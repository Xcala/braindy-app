/** Page heads of My brand's tabs (one line under the title) and the deliveries gallery. */
export const pageHeadEn = {
  'ph.kit': 'Logos, colors, type and concept, ready to use.',
  'ph.essence': 'Who your brand is: its story, strategy and voice.',
  'dg.empty': 'When you approve a delivery, it shows up here.',
  'dg.files': '{n} files', 'dg.file': '1 file', 'dg.approved': 'Approved {date}',
  'dg.back': 'All deliveries', 'dg.request': 'See the request',
  'dg.search': 'Search deliveries',
} as const;

export const pageHeadEs: Record<keyof typeof pageHeadEn, string> = {
  'ph.kit': 'Logos, colores, tipografía y concepto, listos para usar.',
  'ph.essence': 'Quién es tu marca: su historia, su estrategia y su voz.',
  'dg.empty': 'Cuando apruebes una entrega, aparece aquí.',
  'dg.files': '{n} archivos', 'dg.file': '1 archivo', 'dg.approved': 'Aprobada el {date}',
  'dg.back': 'Todas las entregas', 'dg.request': 'Ver el pedido',
  'dg.search': 'Buscar entregas',
};
