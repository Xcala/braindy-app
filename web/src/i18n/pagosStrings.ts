/** Mi plan › Pagos rediseñado (26 nov 2026): el proyecto arriba para el cliente, los tres números y el envío programado
 *  para NickMark, filas con menú ⋯ y la marca sin cobros. */
export const pagosEn = {
  // client
  'pg.c.installments': '{n} installments', 'pg.c.paid': 'Paid', 'pg.c.left': 'Left', 'pg.c.paidOf': '{a} of {b} paid',
  'pg.c.now': 'Due now', 'pg.c.upToDate': 'You are up to date. Nothing to pay right now.', 'pg.c.next': 'Coming next',
  'pg.c.due': 'Due {d}', 'pg.c.coming': 'Arrives {d}', 'pg.c.lateSince': 'Overdue since {d}',
  'pg.c.paidList': 'Paid · {n}', 'pg.c.recibos': 'Receipts · {n}', 'pg.c.docs': 'Documents for your accounting',
  'pg.c.fee': 'By card +{pct}% · by bank transfer at no cost', 'pg.c.feeNone': 'By card or by bank transfer',
  // admin
  'pg.a.owed': 'Owed to you', 'pg.a.open1': '1 open request', 'pg.a.openN': '{n} open requests', 'pg.a.paid': 'Paid', 'pg.a.paidPct': '{p}% of the project', 'pg.a.paidPctN': '{p}% of the projects',
  'pg.a.work': 'Progress', 'pg.a.ahead': 'ahead of payments', 'pg.a.behind': 'behind payments', 'pg.a.even': 'even with payments', 'pg.a.noStages': 'no stages yet',
  'pg.a.line': '{total} · {n} installments · numbered {from} to {to}', 'pg.a.workText': '{p}% of the value done · {d} of {n} stages complete', 'pg.a.workOther': ', the other at {p}%',
  'pg.a.auto': 'Automatic sending', 'pg.a.autoOn': 'Each request goes out by itself on day {d} of its month, by email and in their app.', 'pg.a.autoOff': 'Each request waits «not sent» until you send it.', 'pg.a.day': 'Issue day', 'pg.a.dayOf': 'Day {d}',
  'pg.a.payLeft': '{v} left on this project.', 'pg.a.setup': 'Setup', 'pg.a.setupHint': 'Billing data · Documents · Card plan',
  'pg.a.asClient': 'See as client', 'pg.a.asAdmin': 'Back to your view', 'pg.a.asClientNote': 'This is what people with Billing at the brand see: only what was sent.',
  // rows
  'pg.r.autoOn': 'Goes out by itself {d}', 'pg.r.issueOn': 'Issued {d}', 'pg.r.sendOn': 'Goes out {d}', 'pg.r.paidNotSent': 'Paid · not sent', 'pg.r.more': 'More actions for {n}',
  'pg.r.schedule': 'Schedule sending…', 'pg.r.unschedule': 'Cancel scheduled sending', 'pg.r.voidQ': 'Void…', 'pg.r.unscheduled': 'Scheduled sending canceled for {n}',
  // send
  'pg.s.title': 'Send pending', 'pg.s.gPaid': 'Already paid · {n}', 'pg.s.gRec': 'Receipts · {n}', 'pg.s.gOpen': 'To pay · {n}',
  'pg.s.now': 'Now', 'pg.s.later': 'Schedule', 'pg.s.date': 'Day it goes out', 'pg.s.laterHint': 'They go out by themselves that day, to {to} and to their app. You can change it or send them earlier.',
  'pg.s.laterHintApp': 'They go out by themselves that day, to their app. You can change it or send them earlier.', 'pg.s.laterOk': 'Schedule {n}', 'pg.s.scheduled': '{n} scheduled for {d}', 'pg.s.one': 'Schedule {n}', 'pg.s.oneOk': 'Schedule sending',
  'pg.s.app1': 'We alert 1 person with Billing.', 'pg.s.people1': '1 person who sees Billing gets an alert',
  // brand with no billing yet
  'pg.a.listC': 'Payment requests · {n}',
  'pg.e.title': 'No charges yet', 'pg.e.lead': 'Choose how this brand is charged.', 'pg.e.cuentas': 'Project in payment requests', 'pg.e.cuentasHint': 'A total in monthly installments, each with its request and receipt.',
  'pg.e.card': 'Card plan', 'pg.e.cardHint': 'Monthly plan or project paid by card on Stripe.',
} as const;

export const pagosEs: Record<keyof typeof pagosEn, string> = {
  'pg.c.installments': '{n} cuotas', 'pg.c.paid': 'Pagado', 'pg.c.left': 'Falta', 'pg.c.paidOf': '{a} de {b} pagadas',
  'pg.c.now': 'Toca ahora', 'pg.c.upToDate': 'Estás al día. No hay nada por pagar ahora.', 'pg.c.next': 'Las que siguen',
  'pg.c.due': 'Vence {d}', 'pg.c.coming': 'Llega el {d}', 'pg.c.lateSince': 'En mora desde el {d}',
  'pg.c.paidList': 'Pagadas · {n}', 'pg.c.recibos': 'Recibos · {n}', 'pg.c.docs': 'Documentos para tu contabilidad',
  'pg.c.fee': 'Con tarjeta +{pct} % · por transferencia sin costo', 'pg.c.feeNone': 'Con tarjeta o por transferencia',
  'pg.a.owed': 'Te deben', 'pg.a.open1': '1 cuenta abierta', 'pg.a.openN': '{n} cuentas abiertas', 'pg.a.paid': 'Pagado', 'pg.a.paidPct': '{p} % del proyecto', 'pg.a.paidPctN': '{p} % de los proyectos',
  'pg.a.work': 'Avance', 'pg.a.ahead': 'va adelante de los pagos', 'pg.a.behind': 'va detrás de los pagos', 'pg.a.even': 'parejo con los pagos', 'pg.a.noStages': 'sin etapas todavía',
  'pg.a.line': '{total} · {n} cuotas · numeración {from} a {to}', 'pg.a.workText': '{p} % del valor hecho · {d} de {n} etapas completas', 'pg.a.workOther': ', la otra en {p} %',
  'pg.a.auto': 'Envío automático', 'pg.a.autoOn': 'Cada cuenta sale sola el día {d} de su mes, por correo y en su app.', 'pg.a.autoOff': 'Cada cuenta te espera «sin enviar» hasta que la envíes.', 'pg.a.day': 'Día de emisión', 'pg.a.dayOf': 'Día {d}',
  'pg.a.payLeft': 'Faltan {v} de este proyecto.', 'pg.a.setup': 'Configuración', 'pg.a.setupHint': 'Datos de facturación · Documentos · Plan con tarjeta',
  'pg.a.asClient': 'Ver como cliente', 'pg.a.asAdmin': 'Volver a tu vista', 'pg.a.asClientNote': 'Así lo ve quien tiene Pagos en la marca: solo lo que ya se envió.',
  'pg.r.autoOn': 'Sale sola el {d}', 'pg.r.issueOn': 'Se emite el {d}', 'pg.r.sendOn': 'Sale el {d}', 'pg.r.paidNotSent': 'Pagada · sin enviar', 'pg.r.more': 'Más acciones de {n}',
  'pg.r.schedule': 'Programar envío…', 'pg.r.unschedule': 'Cancelar envío programado', 'pg.r.voidQ': 'Anular…', 'pg.r.unscheduled': 'Se canceló el envío programado de {n}',
  'pg.s.title': 'Enviar pendientes', 'pg.s.gPaid': 'Ya pagadas · {n}', 'pg.s.gRec': 'Recibos · {n}', 'pg.s.gOpen': 'Por pagar · {n}',
  'pg.s.now': 'Ahora', 'pg.s.later': 'Programar', 'pg.s.date': 'Día en que salen', 'pg.s.laterHint': 'Salen solas ese día, a {to} y a su app. Puedes cambiarlo o enviarlas antes.',
  'pg.s.laterHintApp': 'Salen solas ese día, a su app. Puedes cambiarlo o enviarlas antes.', 'pg.s.laterOk': 'Programar {n}', 'pg.s.scheduled': '{n} programadas para el {d}', 'pg.s.one': 'Programar {n}', 'pg.s.oneOk': 'Programar envío',
  'pg.s.app1': 'Avisamos a 1 persona con Pagos.', 'pg.s.people1': 'Avisamos a 1 persona que ve Pagos',
  'pg.a.listC': 'Cuentas de cobro · {n}',
  'pg.e.title': 'Aún no hay cobros', 'pg.e.lead': 'Elige cómo se le cobra a esta marca.', 'pg.e.cuentas': 'Proyecto en cuentas', 'pg.e.cuentasHint': 'Un valor total en cuotas mensuales, cada una con su cuenta de cobro y su recibo.',
  'pg.e.card': 'Plan con tarjeta', 'pg.e.cardHint': 'Mensualidad o proyecto pagado con tarjeta en Stripe.',
};
