/** Strings for the Account row redesign (2026-11-26): short tab names, Mi plan built from a billing project,
 *  «Mejorar mi plan», how each third-party app is entered, and the compact team list. */
export const cuentaTabEn = {
  'ct.short.plan': 'Plan', 'ct.short.team': 'Team', 'ct.short.apps': 'Apps', 'ct.short.up': 'Upgrade',
  // Mi plan built from the billing project when no plan is loaded.
  'ct.p.live': 'In progress', 'ct.p.paid': 'Paid {p} %', 'ct.p.of': '{paid} of {total}', 'ct.p.next': 'Next installment:', 'ct.p.done': 'All paid',
  'ct.p.contract': 'Contract', 'ct.p.proposal': 'Proposal', 'ct.p.proposalSub': 'What we agreed', 'ct.p.open': 'Open ↗',
  'ct.p.payments': 'Payments', 'ct.p.paymentsSub': '{n} of {of} installments', 'ct.p.see': 'See ›',
  // Mejorar mi plan.
  'ct.u.site': 'Your website', 'ct.u.noSite': 'No site yet', 'ct.u.noHosting': 'No hosting plan', 'ct.u.noHostingSub': 'Pick a plan so we look after it and your team can edit it.',
  'ct.u.seePlans': 'See hosting plans', 'ct.u.hidePlans': 'Hide plans', 'ct.u.pieces': 'Pieces with the Brains', 'ct.u.piecesSub': 'Carousels, videos and research with your brand already loaded, reviewed by NickMark.',
  'ct.u.from': 'from {price}/month', 'ct.u.seeCredits': 'See credits', 'ct.u.hideCredits': 'Hide credits',
  // Third-party apps: how each one is entered.
  'ct.a.how': 'How you sign in', 'ct.a.pw': 'With password', 'ct.a.google': 'Sign in with Google', 'ct.a.facebook': 'Sign in with Facebook', 'ct.a.none': 'No password needed',
  'ct.a.missing': 'Password missing', 'ct.a.filters': 'Filters', 'ct.a.oauth': 'Google or Facebook', 'ct.a.open': 'See details',
  // Team.
  'ct.t.invited': '{n} invited', 'ct.t.name': 'Name', 'ct.t.addName': 'Add a name', 'ct.t.save': 'Save', 'ct.t.approves': 'Approves', 'ct.t.custom': 'custom',
  'ct.t.notIn': 'Invited, not in yet', 'ct.t.more': 'More',
} as const;

export const cuentaTabEs: Record<keyof typeof cuentaTabEn, string> = {
  'ct.short.plan': 'Plan', 'ct.short.team': 'Equipo', 'ct.short.apps': 'Apps', 'ct.short.up': 'Mejorar',
  'ct.p.live': 'En curso', 'ct.p.paid': 'Pagado {p} %', 'ct.p.of': '{paid} de {total}', 'ct.p.next': 'Próxima cuota:', 'ct.p.done': 'Todo pagado',
  'ct.p.contract': 'Contrato', 'ct.p.proposal': 'Propuesta', 'ct.p.proposalSub': 'Lo que acordamos', 'ct.p.open': 'Abrir ↗',
  'ct.p.payments': 'Pagos', 'ct.p.paymentsSub': '{n} de {of} cuotas', 'ct.p.see': 'Ver ›',
  'ct.u.site': 'Tu sitio web', 'ct.u.noSite': 'Aún sin sitio', 'ct.u.noHosting': 'Sin plan de hosting', 'ct.u.noHostingSub': 'Elige un plan para que lo cuidemos y tu equipo pueda editarlo.',
  'ct.u.seePlans': 'Ver planes de hosting', 'ct.u.hidePlans': 'Ocultar planes', 'ct.u.pieces': 'Piezas con los Brains', 'ct.u.piecesSub': 'Carruseles, videos e investigaciones con tu marca ya cargada, revisados por NicoMarca.',
  'ct.u.from': 'desde {price}/mes', 'ct.u.seeCredits': 'Ver créditos', 'ct.u.hideCredits': 'Ocultar créditos',
  'ct.a.how': 'Cómo se entra', 'ct.a.pw': 'Con contraseña', 'ct.a.google': 'Entra con Google', 'ct.a.facebook': 'Entra con Facebook', 'ct.a.none': 'No lleva contraseña',
  'ct.a.missing': 'Falta la contraseña', 'ct.a.filters': 'Filtros', 'ct.a.oauth': 'Con Google o Facebook', 'ct.a.open': 'Ver detalle',
  'ct.t.invited': '{n} invitadas', 'ct.t.name': 'Nombre', 'ct.t.addName': 'Ponle nombre', 'ct.t.save': 'Guardar', 'ct.t.approves': 'Aprueba', 'ct.t.custom': 'a medida',
  'ct.t.notIn': 'Invitada, aún no entra', 'ct.t.more': 'Más',
};
