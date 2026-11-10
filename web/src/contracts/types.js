export const CLIENT_FIELDS = ['razonSocial', 'nit', 'direccion', 'representante', 'tipoDoc', 'doc', 'cargo'];
export const CONTRACTOR_FIELDS = ['nombre', 'tipoDoc', 'doc', 'correo', 'direccion'];
/** Terms Nicolas edits, in the order of the form. Keys match server DEFAULT_TERMS. */
export const TERM_GROUPS = [
    { title: 'scope', keys: ['objeto', 'propuesta.id', 'propuesta.fecha', 'plazo.meses', 'plazo.inicio'] },
    { title: 'money', keys: ['valor.monto', 'valor.moneda', 'pago.frecuencia', 'pago.cuota', 'pago.diasHabiles', 'terceros.incluidos'] },
    { title: 'rules', keys: ['horario', 'zonaHoraria', 'festivos', 'cliente.contacto', 'cliente.aprobadores', 'revisiones', 'urgencia.recargo', 'reuniones.frecuencia', 'reuniones.duracion', 'capacitacion.personas', 'informe.frecuencia'] },
    { title: 'times', keys: ['sla.respuesta', 'sla.entregaMin', 'sla.ajustes', 'cliente.slaInfo', 'cliente.slaAprobacion', 'silencio.dias', 'silencio.diasPausa'] },
    { title: 'legal', keys: ['mora.diasPausa', 'mora.diasTerminacion', 'mora.diasReanudar', 'territorio', 'confidencialidad.anios', 'terminacion.preaviso', 'cierre.meses', 'domicilio'] },
];
