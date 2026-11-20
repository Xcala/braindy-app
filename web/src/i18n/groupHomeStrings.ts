/** Group Home (2026-11-20): a group only lists its companies; requests, brand and files live inside each company. */
export const groupHomeEn = {
  'gh.kicker': 'Group',
  'gh.title': 'Your companies',
  'gh.sub': 'Open a company to see its requests, brand and files. Each one keeps its own work.',
  'gh.open': 'Open',
  'gh.toApprove': '{n} to approve',
  'gh.inProd': '{n} in production',
  'gh.quiet': 'Nothing pending',
  'gh.companies': '{n} companies',
  'gh.empty': 'This group has no companies yet.',
  'gh.openName': 'Open {name}', 'gh.sApprove': 'To approve', 'gh.sProd': 'In production', 'gh.sDone': 'Delivered this month',
  'gh.last': 'Latest', 'gh.untitled': 'Untitled request', 'gh.noWork': 'No requests yet.', 'gh.nextDue': 'Next due · {date}',
  'gh.newReq': 'New request', 'gh.brand': 'Brand kit',
  'gh.r.kicker': 'Result · last 28 days', 'gh.r.visits': 'people visited the website', 'gh.r.impr': 'times it showed up on Google', 'gh.r.clicks': 'visits from Google', 'gh.r.vs': 'vs. the previous 28 days',
} as const;

export const groupHomeEs: Record<keyof typeof groupHomeEn, string> = {
  'gh.kicker': 'Grupo',
  'gh.title': 'Tus empresas',
  'gh.sub': 'Abre una empresa para ver sus pedidos, su marca y sus archivos. Cada una lleva su propio trabajo.',
  'gh.open': 'Abrir',
  'gh.toApprove': '{n} por aprobar',
  'gh.inProd': '{n} en producción',
  'gh.quiet': 'Nada pendiente',
  'gh.companies': '{n} empresas',
  'gh.empty': 'Este grupo todavía no tiene empresas.',
  'gh.openName': 'Abrir {name}', 'gh.sApprove': 'Por aprobar', 'gh.sProd': 'En producción', 'gh.sDone': 'Entregado este mes',
  'gh.last': 'Lo último', 'gh.untitled': 'Pedido sin título', 'gh.noWork': 'Todavía no hay pedidos.', 'gh.nextDue': 'Próxima entrega · {date}',
  'gh.newReq': 'Nuevo pedido', 'gh.brand': 'Kit de marca',
  'gh.r.kicker': 'Resultado · últimos 28 días', 'gh.r.visits': 'personas visitaron el sitio web', 'gh.r.impr': 'veces apareció en Google', 'gh.r.clicks': 'visitas desde Google', 'gh.r.vs': 'frente a los 28 días anteriores',
};
