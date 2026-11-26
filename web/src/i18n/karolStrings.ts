/** Three client wishes (Karol, 2026-11-17): what I asked beside Approve, rate a delivery, add details to a sent request. */
export const karolEn = {
  'kw.asked': 'What you asked for',
  'kw.askedSub': 'Check it against the piece before approving.',
  'kw.addenda': 'Details you added',
  'kw.addTitle': 'Remembered something else?',
  'kw.addPh': 'Add a note or detail to this request…',
  'kw.addBtn': 'Add to the request',
  'kw.added': 'Added. Nicolas and his Brains will see it.',
  'kw.rateTitle': 'How did it turn out?',
  'kw.rateStar': '{n} of 5',
  'kw.praisePh': 'A word for the team (optional)',
  'kw.rateBtn': 'Send',
  'kw.rated': 'You rated it {n} of 5. Thank you!',
  'kw.ratingText': 'Rated {n} of 5',
} as const;

export const karolEs: Record<keyof typeof karolEn, string> = {
  'kw.asked': 'Lo que pediste',
  'kw.askedSub': 'Compáralo con la pieza antes de aprobar.',
  'kw.addenda': 'Detalles que agregaste',
  'kw.addTitle': '¿Te acordaste de algo más?',
  'kw.addPh': 'Agrega una nota o un detalle a este pedido…',
  'kw.addBtn': 'Agregar al pedido',
  'kw.added': 'Agregado. Nicolas y sus Brains lo verán.',
  'kw.rateTitle': '¿Cómo quedó?',
  'kw.rateStar': '{n} de 5',
  'kw.praisePh': 'Unas palabras para el equipo (opcional)',
  'kw.rateBtn': 'Enviar',
  'kw.rated': 'Lo calificaste {n} de 5. ¡Gracias!',
  'kw.ratingText': 'Calificó {n} de 5',
};
