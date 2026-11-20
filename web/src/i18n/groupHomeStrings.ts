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
};
