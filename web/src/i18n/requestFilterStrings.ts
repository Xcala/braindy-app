/** Requests toolbar: search, who asked, due and requested dates, sort and status tabs (what the old brief app had). */
export const requestFilterEn = {
  'rf.search': 'Search by title or type',
  'rf.who': 'Who asked', 'rf.whoAll': 'Everyone ({n})', 'rf.team': 'Braindy team',
  'rf.due': 'Due date', 'rf.due.all': 'Due: any', 'rf.due.late': 'Due: overdue', 'rf.due.week': 'Due: next 7 days', 'rf.due.month': 'Due: next 30 days', 'rf.due.none': 'Due: no date',
  'rf.asked': 'Requested', 'rf.asked.all': 'Requested: any time', 'rf.asked.7': 'Requested: last 7 days', 'rf.asked.30': 'Requested: last 30 days', 'rf.asked.90': 'Requested: last 3 months', 'rf.asked.year': 'Requested: this year',
  'rf.sort.new': 'Newest first', 'rf.sort.old': 'Oldest first', 'rf.sort.due': 'Due soonest', 'rf.sort.updated': 'Recently updated', 'rf.sort.name': 'Title A–Z',
  'rf.status': 'Filter by status',
  'rf.tab.all': 'All', 'rf.tab.to_approve': 'To approve', 'rf.tab.in_production': 'In production', 'rf.tab.late': 'Overdue', 'rf.tab.approved': 'Approved', 'rf.tab.published': 'Published',
  'rf.count': '{n} of {total}', 'rf.clear': 'Clear filters', 'rf.none': 'No request matches these filters.',
};
export const requestFilterEs: Record<keyof typeof requestFilterEn, string> = {
  'rf.search': 'Buscar por título o tipo',
  'rf.who': 'Quién pidió', 'rf.whoAll': 'Todas las personas ({n})', 'rf.team': 'Equipo Braindy',
  'rf.due': 'Fecha de entrega', 'rf.due.all': 'Entrega: todas', 'rf.due.late': 'Entrega: atrasadas', 'rf.due.week': 'Entrega: próximos 7 días', 'rf.due.month': 'Entrega: próximos 30 días', 'rf.due.none': 'Entrega: sin fecha',
  'rf.asked': 'Fecha de solicitud', 'rf.asked.all': 'Solicitud: todas', 'rf.asked.7': 'Solicitud: últimos 7 días', 'rf.asked.30': 'Solicitud: últimos 30 días', 'rf.asked.90': 'Solicitud: últimos 3 meses', 'rf.asked.year': 'Solicitud: este año',
  'rf.sort.new': 'Más recientes primero', 'rf.sort.old': 'Más antiguas primero', 'rf.sort.due': 'Entrega más próxima', 'rf.sort.updated': 'Actualizadas hace poco', 'rf.sort.name': 'Título A–Z',
  'rf.status': 'Filtrar por estado',
  'rf.tab.all': 'Todas', 'rf.tab.to_approve': 'Por aprobar', 'rf.tab.in_production': 'En producción', 'rf.tab.late': 'Atrasadas', 'rf.tab.approved': 'Aprobadas', 'rf.tab.published': 'Publicadas',
  'rf.count': '{n} de {total}', 'rf.clear': 'Quitar filtros', 'rf.none': 'Ninguna solicitud coincide con estos filtros.',
};
