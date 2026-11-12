/** Wishlist: what clients ask Braindy (the app) to improve or fix, and the shorter bottom menu (Learn · Wishlist · Account). */
export const wishEn = {
  'nav.learnGroup': 'Learn', 'nav.account': 'Account', 'nav.wishlist': 'Wishlist', 'sub.lessons': 'Videos and lessons',
  'wl.title': 'Wishlist', 'wl.sub': 'Ask for improvements or fixes to the Braindy app. NickMark reads every one, and here you see how each is going.',
  'wl.placeholder': 'What would make Braindy easier or better for you?',
  'wl.kind.improve': 'Improvement', 'wl.kind.fix': 'Fix',
  'wl.send': 'Send', 'wl.sending': 'Sending…', 'wl.sent': 'Thanks! NickMark will read it.', 'wl.error': 'It did not go through. Try again.',
  'wl.needBrand': 'Pick a brand above to send a wish.',
  'wl.all': 'All', 'wl.mine': 'From your team', 'wl.history': 'Everyone',
  'wl.st.new': 'New', 'wl.st.planned': 'Planned', 'wl.st.doing': 'In progress', 'wl.st.done': 'Done', 'wl.st.declined': 'Not for now',
  'wl.metoo': 'Me too', 'wl.metooOn': 'You too', 'wl.reply': 'NickMark', 'wl.you': 'You', 'wl.yourTeam': 'Your team',
  'wl.public': 'From a client', 'wl.empty': 'Nothing here yet. Be the first to ask.', 'wl.noMatch': 'Nothing with that filter.',
  'wl.delete': 'Delete', 'wl.deleteAsk': 'Delete this wish?', 'wl.edit': 'Edit',
  'wl.adm.status': 'Status', 'wl.adm.reply': 'Answer to the client', 'wl.adm.save': 'Save', 'wl.adm.newPublic': 'Add to the history (visible to every client, no names)',
  'wl.done': 'Done on {date}', 'wl.listen': 'Listen to the voice note', 'wl.askedBy': 'Asked by {name}', 'wl.share': 'Share with everyone', 'wl.shareHint': 'Every client sees it, with only the first name of who asked', 'wl.audioError': 'Could not open the voice note',
} as const;

export const wishEs: Record<keyof typeof wishEn, string> = {
  'nav.learnGroup': 'Aprende', 'nav.account': 'Cuenta', 'nav.wishlist': 'Wishlist', 'sub.lessons': 'Videos y lecciones',
  'wl.title': 'Wishlist', 'wl.sub': 'Pide mejoras o ajustes a la app de Braindy. NicoMarca las lee todas y aquí ves cómo va cada una.',
  'wl.placeholder': '¿Qué haría que Braindy te resulte más fácil o mejor?',
  'wl.kind.improve': 'Mejora', 'wl.kind.fix': 'Ajuste',
  'wl.send': 'Enviar', 'wl.sending': 'Enviando…', 'wl.sent': '¡Gracias! NicoMarca la va a leer.', 'wl.error': 'No se pudo enviar. Intenta de nuevo.',
  'wl.needBrand': 'Elige una marca arriba para enviar un deseo.',
  'wl.all': 'Todas', 'wl.mine': 'De tu equipo', 'wl.history': 'De todos',
  'wl.st.new': 'Nueva', 'wl.st.planned': 'Planeada', 'wl.st.doing': 'En camino', 'wl.st.done': 'Hecha', 'wl.st.declined': 'Por ahora no',
  'wl.metoo': 'A mí también', 'wl.metooOn': 'Tú también', 'wl.reply': 'NicoMarca', 'wl.you': 'Tú', 'wl.yourTeam': 'Tu equipo',
  'wl.public': 'De un cliente', 'wl.empty': 'Aún no hay nada. Sé el primero en pedir.', 'wl.noMatch': 'Nada con ese filtro.',
  'wl.delete': 'Borrar', 'wl.deleteAsk': '¿Borrar este deseo?', 'wl.edit': 'Editar',
  'wl.adm.status': 'Estado', 'wl.adm.reply': 'Respuesta al cliente', 'wl.adm.save': 'Guardar', 'wl.adm.newPublic': 'Agregar al historial (lo ven todos los clientes, sin nombres)',
  'wl.done': 'Hecha el {date}', 'wl.listen': 'Escuchar la nota de voz', 'wl.askedBy': 'Lo pidió {name}', 'wl.share': 'Compartir con todos', 'wl.shareHint': 'La ven todos los clientes, solo con el nombre de pila de quien la pidió', 'wl.audioError': 'No se pudo abrir la nota de voz',
};
