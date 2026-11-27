/** Admin › Brands (UX audit MA1–MA4): one count of active brands, one selector, health sections, archive inside Manage. */
export const brandsAdminEn = {
  'brandsA.summary': '{brands} active · {groups} groups · {archived} archived',
  'brandsA.capacity': 'Capacity: {n} of {cap}', 'brandsA.left': '{n} left', 'brandsA.over': '{n} over the cap',
  'brandsA.ofCap': '{n} of {cap}',
  'brandsA.search': 'Search brand or group', 'brandsA.view': 'Show',
  'brandsA.active': 'Active · {n}', 'brandsA.archived': 'Archived · {n}', 'brandsA.groups': 'Groups · {n}',
  'brandsA.attention': 'Need attention · {n}', 'brandsA.working': 'With work · {n}', 'brandsA.quiet': 'Quiet · {n}',
  'brandsA.noOpen': 'No open requests', 'brandsA.inGroup': 'in {group}',
  'brandsA.none': 'No brands here yet.', 'brandsA.noMatch': 'Nothing here matches «{q}».',
  'brandsA.details': 'Details',
  'brandsA.archiveHead': 'Archive {name}',
  'brandsA.archiveBody': 'Its team keeps its files, but it leaves the active list and stops receiving work. You can activate it again anytime.',
  'brandsA.archiveCta': 'Archive brand', 'brandsA.archiveGroupCta': 'Archive group',
  'brandsA.archivedNote': 'Archived: it does not receive work.', 'brandsA.reactivate': 'Activate again',
};

export const brandsAdminEs: Record<keyof typeof brandsAdminEn, string> = {
  'brandsA.summary': '{brands} activas · {groups} grupos · {archived} archivadas',
  'brandsA.capacity': 'Capacidad: {n} de {cap}', 'brandsA.left': 'quedan {n}', 'brandsA.over': '{n} por encima del tope',
  'brandsA.ofCap': '{n} de {cap}',
  'brandsA.search': 'Buscar marca o grupo', 'brandsA.view': 'Mostrar',
  'brandsA.active': 'Activas · {n}', 'brandsA.archived': 'Archivadas · {n}', 'brandsA.groups': 'Grupos · {n}',
  'brandsA.attention': 'Piden atención · {n}', 'brandsA.working': 'Con trabajo · {n}', 'brandsA.quiet': 'Sin movimiento · {n}',
  'brandsA.noOpen': 'Sin pedidos abiertos', 'brandsA.inGroup': 'en {group}',
  'brandsA.none': 'Todavía no hay marcas aquí.', 'brandsA.noMatch': 'Nada aquí coincide con «{q}».',
  'brandsA.details': 'Datos',
  'brandsA.archiveHead': 'Archivar {name}',
  'brandsA.archiveBody': 'Su equipo conserva sus archivos, pero sale de las activas y deja de recibir trabajo. Puedes volver a activarla cuando quieras.',
  'brandsA.archiveCta': 'Archivar marca', 'brandsA.archiveGroupCta': 'Archivar grupo',
  'brandsA.archivedNote': 'Archivada: no recibe trabajo.', 'brandsA.reactivate': 'Activar de nuevo',
};
