// "Cómo usar Braindy" / "How to use Braindy": the single source for the tutorial videos. The storyboard, the voice lines,
// the recordings and the Learn lessons all come from here. One video per section and one per new feature; the overview
// is cut from the section clips (its `de` points at them), so a change re-records one clip, not the whole tour.
// Scene: zona = where the eye goes in the vignette (hero | lista | panel | visor | rejilla | menu | modal | movil | chat | tarjeta),
// es/en = the voice line (~2.3 words per second at most).

export const SECCIONES = [
  {
    id: 'inicio', kind: 'section', paths: ['/home'], nav: 'Inicio', navEn: 'Home',
    titulo: { es: 'Entrar e Inicio', en: 'Signing in and Home' },
    resumen: { es: 'Cómo entras y qué te muestra Inicio cada día.', en: 'How you sign in and what Home shows you every day.' },
    escenas: [
      { zona: 'modal', ui: 'Entra a Braindy', es: 'Entra a app.braindy.co con Google o con un enlace que te llega al correo. Sin contraseñas que recordar.', en: 'Go to app.braindy.co and sign in with Google or with a link sent to your email. No passwords to remember.' },
      { zona: 'hero', ui: 'Contacta a Nico', es: 'Inicio te dice qué te necesita hoy. Desde aquí le escribes a Nico o agendas treinta minutos con él.', en: 'Home tells you what needs you today. From here you message Nick or book thirty minutes with him.' },
      { zona: 'tarjeta', ui: 'Entregado · espera tu aprobación', es: 'Lo que espera tu aprobación sale primero: tocas Revisar y entras.', en: 'Whatever is waiting for your approval comes first: tap Review and you are in.' },
      { zona: 'lista', ui: 'En producción · Quedan 18 h hábiles', es: 'Abajo ves lo que está en producción y cuántas horas hábiles faltan para cada entrega.', en: 'Below, you see what is in production and how many business hours are left for each delivery.' },
      { zona: 'tarjeta', ui: 'Siguiente reunión · Entrar a la llamada', es: 'Y tu próxima reunión, con el botón para entrar a la llamada y el historial con sus notas.', en: 'And your next meeting, with a button to join the call and the history with its notes.' },
    ],
  },
  {
    id: 'mi-marca', kind: 'section', paths: ['/brand/visual', '/brand'], nav: 'Mi marca', navEn: 'My brand',
    titulo: { es: 'Mi marca: Visual y Esencia', en: 'My brand: Visual and Essence' },
    resumen: { es: 'Tus logos, colores, tipografías, estrategia y voz, listos para usar.', en: 'Your logos, colors, typefaces, strategy and voice, ready to use.' },
    escenas: [
      { zona: 'rejilla', ui: 'Logos · Cambiar fondo', es: 'En Mi marca, Visual tiene tus logos. Cambia el fondo para verlos en blanco, en oscuro o a una tinta, y descárgalos.', en: 'In My brand, Visual holds your logos. Change the background to see them on white, on dark or in one color, and download them.' },
      { zona: 'rejilla', ui: 'Colores · Copia rápida', es: 'Toca un color para copiar su código. Copia rápida te da los tres principales y la fuente de una vez.', en: 'Tap a color to copy its code. Quick copy gives you the top three and the typeface at once.' },
      { zona: 'tarjeta', ui: 'Tipografía · Descargar fuente', es: 'En Tipografía descargas la fuente o la activas en Adobe Fonts.', en: 'In Typography you download the font or activate it in Adobe Fonts.' },
      { zona: 'hero', ui: 'Esencia · Estrategia · Voz', es: 'Esencia es el porqué de tu marca: su historia, la estrategia firmada por NicoMarca y su voz, cómo suena y cómo nunca suena.', en: 'Essence is the why of your brand: its story, the strategy signed by NickMark and its voice, how it sounds and how it never sounds.' },
    ],
  },
  {
    id: 'cerebro', kind: 'section', paths: ['/brand/brain'], nav: 'Mi marca', navEn: 'My brand',
    titulo: { es: 'El Cerebro de tu marca', en: 'Your brand’s Brain' },
    resumen: { es: 'Lo que los Brains saben de tu marca y cómo lo usan.', en: 'What the Brains know about your brand and how they use it.' },
    escenas: [
      { zona: 'hero', ui: 'Ya sabe 745 cosas de tu marca', es: 'El Cerebro es lo que los Brains saben de tu marca: cuántas cosas sabe y qué aprendió esta semana.', en: 'The Brain is what the Brains know about your brand: how much it knows and what it learned this week.' },
      { zona: 'visor', ui: 'Así está creciendo · Ver cómo creció', es: 'El mapa crece por áreas. Toca Ver cómo creció para repasar su historia.', en: 'The map grows by area. Tap See how it grew to replay its story.' },
      { zona: 'lista', ui: 'Lo que aprendió', es: 'En Lo que aprendió ves de dónde salió cada dato: un pedido, una aprobación, una reunión.', en: 'In What it learned you see where each fact came from: a request, an approval, a meeting.' },
      { zona: 'tarjeta', ui: 'Reglas que nunca olvida · Lo que aún no sabe', es: 'Abajo, las reglas que nunca olvida y lo que aún no sabe. Tus contraseñas nunca entran aquí.', en: 'Below, the rules it never forgets and what it does not know yet. Your passwords never go in here.' },
    ],
  },
  {
    id: 'investigacion', kind: 'section', paths: ['/research'], nav: 'Mi marca', navEn: 'My brand',
    titulo: { es: 'Investigación', en: 'Research' },
    resumen: { es: 'Los estudios y market maps de tu marca y tu mercado.', en: 'The studies and market maps of your brand and your market.' },
    escenas: [
      { zona: 'hero', ui: 'Mi investigación', es: 'En Investigación está lo que estudiamos de tu marca y de tu mercado.', en: 'Research holds what we studied about your brand and your market.' },
      { zona: 'rejilla', ui: 'Market maps', es: 'Los market maps muestran dónde está tu marca frente a la competencia.', en: 'Market maps show where your brand stands against the competition.' },
      { zona: 'lista', ui: 'Estudios e investigaciones · Abrir', es: 'Y cada estudio se abre con un toque.', en: 'And every study opens with one tap.' },
    ],
  },
  {
    id: 'pedir', kind: 'section', paths: ['/requests'], nav: 'Pedidos', navEn: 'Requests',
    titulo: { es: 'Pedir lo que necesitas', en: 'Asking for what you need' },
    resumen: { es: 'Un pedido claro en menos de un minuto.', en: 'A clear request in under a minute.' },
    escenas: [
      { zona: 'hero', ui: 'Pedidos · Nuevo pedido', es: 'Para pedir algo, ve a Pedidos y toca Nuevo pedido.', en: 'To ask for something, go to Requests and tap New request.' },
      { zona: 'panel', ui: 'Empieza por aquí', es: 'Elige por dónde empezar: redes, una pieza puntual, tu web o una campaña. Si no sabes, toca No sé, ayúdame.', en: 'Pick where to start: social, a single piece, your website or a campaign. If you are not sure, tap Help me choose.' },
      { zona: 'panel', ui: '¿Qué pieza? · ¿Dónde? · ¿Para cuándo?', es: 'Escríbelo corto y toca qué pieza es, dónde se publica y para cuándo.', en: 'Write it short, then tap what piece it is, where it goes and when you need it.' },
      { zona: 'panel', ui: 'Material · Nota de voz', es: 'Adjunta material o una nota de voz. Si no tienes, pide que te lo propongan.', en: 'Attach material or a voice note. If you have none, ask us to propose it.' },
      { zona: 'panel', ui: 'Así lo entendió NicoMarca · Enviar', es: 'La lista te dice qué falta y cómo lo entendió NicoMarca. Toca Enviar a NicoMarca.', en: 'The checklist tells you what is missing and how NickMark read it. Tap Send to NickMark.' },
    ],
  },
  {
    id: 'revisar', kind: 'section', paths: ['/requests/*'], nav: 'Pedidos', navEn: 'Requests',
    titulo: { es: 'Revisar y aprobar una entrega', en: 'Reviewing and approving a delivery' },
    resumen: { es: 'Comparar versiones, marcar ajustes y aprobar.', en: 'Compare versions, mark changes and approve.' },
    escenas: [
      { zona: 'hero', ui: 'Solicitud › Plan › Trabajo › Tu aprobación', es: 'Cuando llega una entrega, ábrela. Arriba ves en qué paso va, de la solicitud a publicada.', en: 'When a delivery arrives, open it. At the top you see which step it is in, from request to published.' },
      { zona: 'visor', ui: 'Versiones · Comparar', es: 'Cambia de versión y compara: con deslizador, lado a lado o solo los cambios.', en: 'Switch versions and compare them: with a slider, side by side or changes only.' },
      { zona: 'visor', ui: 'Marcar en la pieza', es: 'Para un ajuste, toca Marcar en la pieza, encierra el área y escribe qué cambiarías.', en: 'For a change, tap Mark on piece, draw around the area and write what you would change.' },
      { zona: 'panel', ui: 'Aprobar esta versión · Pedir cambios', es: 'Si está lista, Aprobar esta versión. Si no, Pedir cambios con tus comentarios.', en: 'If it is ready, Approve this version. If not, Request changes with your comments.' },
      { zona: 'lista', ui: 'Aprobar de una vez', es: '¿Hay varias esperando? Con Aprobar de una vez las eliges y las apruebas juntas.', en: 'Several waiting? With Approve at once you pick them and approve them together.' },
    ],
  },
  {
    id: 'archivos', kind: 'section', paths: ['/assets'], nav: 'Entregas', navEn: 'Deliveries',
    titulo: { es: 'Archivos', en: 'Files' },
    resumen: { es: 'Todo lo de tu marca, ordenado y listo para descargar.', en: 'Everything of your brand, organized and ready to download.' },
    escenas: [
      { zona: 'rejilla', ui: 'Entregas aprobadas', es: 'Archivos guarda todo lo de tu marca. Lo que apruebas llega solo a Entregas aprobadas.', en: 'Files keeps everything of your brand. What you approve lands by itself in Approved deliveries.' },
      { zona: 'hero', ui: 'Buscar · Tipo · Ordenar', es: 'Busca por nombre, filtra por tipo y ordena como prefieras.', en: 'Search by name, filter by type and sort the way you like.' },
      { zona: 'rejilla', ui: '3 seleccionados · Descargar .zip', es: 'Selecciona varios y descárgalos juntos en un zip.', en: 'Select several and download them together as a zip.' },
      { zona: 'hero', ui: 'Subir', es: 'Y con Subir compartes tus propios archivos con el equipo.', en: 'And with Upload you share your own files with the team.' },
    ],
  },
  {
    id: 'apps-sitio', kind: 'section', paths: ['/apps'], nav: 'Entregas', navEn: 'Deliveries',
    titulo: { es: 'Tu sitio y tus apps', en: 'Your website and apps' },
    resumen: { es: 'Ver tu sitio dentro de Braindy y pedirle ajustes.', en: 'See your site inside Braindy and ask for adjustments.' },
    escenas: [
      { zona: 'visor', ui: 'Computador · Tableta · Celular', es: 'En Apps está tu sitio web dentro de Braindy. Míralo como en computador, tableta o celular.', en: 'Apps shows your website inside Braindy. See it as on a computer, a tablet or a phone.' },
      { zona: 'panel', ui: 'Ajustes del sitio · Pedir un ajuste', es: 'Abre Ajustes del sitio para pedir un cambio: lo escribes y tocas Enviar.', en: 'Open Website adjustments to ask for a change: write it and tap Send.' },
      { zona: 'panel', ui: 'Lo que pidieron · Lo que hicimos', es: 'Cada punto muestra lo que pediste, lo que hicimos y un botón para verlo en la página.', en: 'Each point shows what you asked, what we did and a button to see it on the page.' },
      { zona: 'visor', ui: 'Comentar', es: 'En Comentar, haz clic en una parte del sitio y deja tu comentario justo ahí.', en: 'In Comment, click a part of the site and leave your comment right there.' },
    ],
  },
  {
    id: 'calendario', kind: 'section', paths: ['/calendar'], nav: 'Entregas', navEn: 'Deliveries',
    titulo: { es: 'Calendario de redes', en: 'Social calendar' },
    resumen: { es: 'Lo publicado y lo que viene en tus redes.', en: 'What was published and what is coming on your social media.' },
    escenas: [
      { zona: 'rejilla', ui: 'Calendario · Hoy', es: 'Calendario muestra lo que publicamos y lo que viene en tus redes, mes a mes.', en: 'Calendar shows what we published and what is coming on your social media, month by month.' },
      { zona: 'rejilla', ui: 'Publicada · Programada · Redes', es: 'Cada día, la hora, la red y si ya salió o está programada. Puedes filtrar por red.', en: 'Each day shows the time, the network and whether it went out or is scheduled. You can filter by network.' },
      { zona: 'tarjeta', ui: '¿Un cambio? En Pedidos', es: 'Para cambiar algo, pídelo en Pedidos.', en: 'To change something, ask for it in Requests.' },
    ],
  },
  {
    id: 'resultados', kind: 'section', paths: ['/report'], nav: 'Resultados', navEn: 'Results',
    titulo: { es: 'Resultados', en: 'Results' },
    resumen: { es: 'Tu reporte del mes: ventas, no likes.', en: 'Your monthly report: sales, not likes.' },
    escenas: [
      { zona: 'hero', ui: 'Reportamos ventas, no likes', es: 'Resultados es tu reporte del mes. Reportamos ventas, no likes.', en: 'Results is your monthly report. We report sales, not likes.' },
      { zona: 'rejilla', ui: 'Ventas · Leads · Costo por lead', es: 'Ventas atribuidas, leads calificados, costo por lead y piezas entregadas.', en: 'Attributed sales, qualified leads, cost per lead and pieces delivered.' },
      { zona: 'tarjeta', ui: 'Qué movió el número · El próximo mes', es: 'Luego, qué movió el número y qué viene el próximo mes.', en: 'Then, what moved the number and what comes next month.' },
      { zona: 'hero', ui: 'PDF · WhatsApp · Agendar', es: 'Descárgalo en PDF, compártelo por WhatsApp o agenda veinte minutos para revisarlo.', en: 'Download it as a PDF, share it on WhatsApp or book twenty minutes to go over it.' },
    ],
  },
  {
    id: 'accesos', kind: 'section', paths: ['/accesses'], nav: 'Apps de terceros', navEn: 'Third party apps',
    titulo: { es: 'Apps de terceros y contraseñas', en: 'Third party apps and passwords' },
    resumen: { es: 'Los accesos de tu marca, cifrados y con registro.', en: 'Your brand’s logins, encrypted and logged.' },
    escenas: [
      { zona: 'lista', ui: 'Apps de terceros', es: 'Apps de terceros guarda los accesos de tu marca: redes, hosting, dominios.', en: 'Third party apps keeps your brand’s logins: social media, hosting, domains.' },
      { zona: 'modal', ui: 'Agregar app · Se cifra antes de guardar', es: 'Al agregar una app, la contraseña se cifra antes de guardarse.', en: 'When you add an app, the password is encrypted before it is saved.' },
      { zona: 'lista', ui: 'Ver contraseña · 30 s', es: 'Ver contraseña la muestra treinta segundos y luego se oculta sola.', en: 'Show password reveals it for thirty seconds, then it hides itself.' },
      { zona: 'tarjeta', ui: 'Registro de accesos', es: 'Cada vez que alguien la ve o la copia queda en el registro. Solo los dueños de la marca entran aquí.', en: 'Every view or copy is logged. Only the brand owners can open this page.' },
    ],
  },
  {
    id: 'plan', kind: 'section', paths: ['/plan', '/pay'], nav: 'Mi plan', navEn: 'My plan',
    titulo: { es: 'Mi plan y pagos', en: 'My plan and payments' },
    resumen: { es: 'Tu contrato, el cronograma, tu hosting y tus pagos.', en: 'Your contract, the schedule, your hosting and your payments.' },
    escenas: [
      { zona: 'tarjeta', ui: 'Resumen · Tu contrato · Lista de arranque', es: 'Mi plan resume tu contrato, lo que incluye y la lista de arranque.', en: 'My plan sums up your contract, what it includes and the kickoff checklist.' },
      { zona: 'rejilla', ui: 'Cronograma', es: 'En Cronograma ves cada entrega semana a semana.', en: 'In Schedule you see every delivery week by week.' },
      { zona: 'rejilla', ui: 'Sitio y apps · Esencial · Pro · Ultra', es: 'Sitio y apps muestra tu plan de hosting y te deja cambiarlo.', en: 'Site and apps shows your hosting plan and lets you change it.' },
      { zona: 'tarjeta', ui: 'Pagos · Pago seguro · Transferencia', es: 'En Pagos pagas en línea, o por transferencia enviando la referencia.', en: 'In Payments you pay online, or by bank transfer sending the reference.' },
    ],
  },
  {
    id: 'ajustes', kind: 'section', paths: ['/settings', '/account'], nav: 'Ajustes', navEn: 'Settings',
    titulo: { es: 'Tu cuenta, tu equipo y tus avisos', en: 'Your account, team and notices' },
    resumen: { es: 'Invitar al equipo, elegir avisos e idioma.', en: 'Invite your team, choose notices and language.' },
    escenas: [
      { zona: 'menu', ui: 'Mi plan · Equipo · Idioma · Apariencia', es: 'Toca tu foto para abrir tu cuenta: plan, facturación, equipo, idioma y apariencia.', en: 'Tap your photo to open your account: plan, billing, team, language and appearance.' },
      { zona: 'lista', ui: 'Equipo y aprobadores · Invitar', es: 'En Equipo invitas a alguien con su correo y eliges qué puede ver y si puede aprobar.', en: 'In Team you invite someone by email and choose what they can see and whether they can approve.' },
      { zona: 'tarjeta', ui: 'WhatsApp y avisos', es: 'En WhatsApp y avisos guardas tu número y eliges qué avisos te llegan.', en: 'In WhatsApp and notices you save your number and choose which notices you get.' },
      { zona: 'tarjeta', ui: 'Idioma · Español · English', es: 'Y en Idioma cambias entre español e inglés.', en: 'And in Language you switch between Spanish and English.' },
    ],
  },
  {
    id: 'whatsapp', kind: 'section', paths: [], nav: 'WhatsApp', navEn: 'WhatsApp',
    titulo: { es: 'Pedir por WhatsApp', en: 'Asking on WhatsApp' },
    resumen: { es: 'Pide, aprueba y pide cambios desde WhatsApp.', en: 'Ask, approve and request changes from WhatsApp.' },
    escenas: [
      { zona: 'chat', ui: 'Tu número registrado', es: 'También puedes pedir por WhatsApp, escribiendo desde tu número registrado.', en: 'You can also ask on WhatsApp, writing from your registered number.' },
      { zona: 'chat', ui: 'Recibido · enlace', es: 'Cada mensaje, con fotos, audios o documentos, se vuelve un pedido, y te llega el enlace para seguirlo.', en: 'Each message, with photos, audio or documents, becomes a request, and you get the link to follow it.' },
      { zona: 'chat', ui: 'Aprobar · Pedir cambios', es: 'Cuando hay una entrega, apruebas o pides cambios con un botón.', en: 'When something is delivered, you approve it or request changes with one button.' },
      { zona: 'chat', ui: 'BAJA · ALTA', es: 'Escribe BAJA para dejar de recibir avisos, y ALTA para volver.', en: 'Write STOP to stop the notices, and START to get them back.' },
    ],
  },
];

export const NOVEDADES = [
  {
    id: 'contrato-un-paso', kind: 'feature', paths: [], nav: 'Mi plan', navEn: 'My plan', fecha: '2026-11-05',
    titulo: { es: 'Firmar el contrato en un paso', en: 'Signing the contract in one step' },
    resumen: { es: 'Lees, firmas y a los dos les llega el PDF.', en: 'Read, sign, and both of you get the PDF.' },
    escenas: [
      { zona: 'tarjeta', ui: 'Listo para firmar', es: 'Antes de empezar, firmas el contrato dentro de Braindy. NicoMarca ya lo firmó.', en: 'Before we start, you sign the contract inside Braindy. NickMark has already signed it.' },
      { zona: 'visor', ui: 'Contrato completo · Anexos', es: 'Lees el contrato completo y sus anexos.', en: 'You read the full contract and its annexes.' },
      { zona: 'panel', ui: 'Tu firma · Firmar el contrato', es: 'Llenas los datos de la empresa, dibujas tu firma y aceptas.', en: 'You fill in the company details, draw your signature and accept.' },
      { zona: 'tarjeta', ui: 'Contrato firmado · Descargar PDF', es: 'Listo: queda firmado y a los dos nos llega el PDF.', en: 'Done: it is signed and we both get the PDF.' },
    ],
  },
  {
    id: 'instalar-app', kind: 'feature', paths: [], nav: 'Cuenta', navEn: 'Account', fecha: '2026-11-02',
    titulo: { es: 'Instalar Braindy en tu celular', en: 'Installing Braindy on your phone' },
    resumen: { es: 'Braindy como una app, en Android, iPhone o computador.', en: 'Braindy as an app, on Android, iPhone or your computer.' },
    escenas: [
      { zona: 'movil', ui: 'Braindy en tu pantalla de inicio', es: 'Braindy se instala como una app, con su ícono en tu pantalla.', en: 'Braindy installs like an app, with its icon on your screen.' },
      { zona: 'menu', ui: 'Instalar la app', es: 'En Android o en el computador: toca tu foto y luego Instalar la app.', en: 'On Android or a computer: tap your photo, then Install the app.' },
      { zona: 'movil', ui: 'Compartir › Agregar a inicio', es: 'En iPhone: en Safari toca Compartir y después Agregar a inicio.', en: 'On iPhone: in Safari tap Share, then Add to Home Screen.' },
      { zona: 'hero', ui: 'Hay una versión nueva · Actualizar', es: 'Cuando haya una versión nueva, toca Actualizar.', en: 'When there is a new version, tap Update.' },
    ],
  },
  {
    id: 'filtros-pedidos', kind: 'feature', paths: [], nav: 'Pedidos', navEn: 'Requests', fecha: '2026-11-03',
    titulo: { es: 'Encontrar cualquier pedido', en: 'Finding any request' },
    resumen: { es: 'Buscar, filtrar, ver en calendario y descargar.', en: 'Search, filter, see on a calendar and download.' },
    escenas: [
      { zona: 'hero', ui: 'Buscar · Por aprobar · En producción', es: 'En Pedidos encuentras cualquier cosa: busca por título o filtra por estado.', en: 'In Requests you find anything: search by title or filter by status.' },
      { zona: 'modal', ui: 'Filtros · Quién pidió · Fechas · Campaña', es: 'En Filtros eliges quién pidió, las fechas y la campaña.', en: 'In Filters you choose who asked, the dates and the campaign.' },
      { zona: 'rejilla', ui: 'Lista · Tablero · Calendario', es: 'Míralos como lista, como tablero o en el calendario de entregas.', en: 'See them as a list, a board or on the delivery calendar.' },
      { zona: 'menu', ui: 'Excel · PDF · Copiar enlace', es: 'Y descárgalos en Excel o PDF, o copia el enlace de esta vista.', en: 'And download them as Excel or PDF, or copy the link to this view.' },
    ],
  },
  {
    id: 'comentar-sitio', kind: 'feature', paths: [], nav: 'Entregas', navEn: 'Deliveries', fecha: '2026-11-03',
    titulo: { es: 'Comentar sobre tu sitio', en: 'Commenting on your site' },
    resumen: { es: 'Señala una parte de la página y comenta ahí.', en: 'Point at a part of the page and comment right there.' },
    escenas: [
      { zona: 'visor', ui: 'Tu sitio en Braindy', es: 'Ahora comentas directo sobre tu sitio.', en: 'Now you comment right on your site.' },
      { zona: 'panel', ui: 'Comentar · Haz clic en la página', es: 'En Ajustes del sitio, abre Comentar y haz clic en la parte de la página.', en: 'In Website adjustments, open Comment and click the part of the page.' },
      { zona: 'visor', ui: 'Comentario fijado · Responder', es: 'Escribe tu comentario: queda marcado en el sitio y te pueden responder ahí.', en: 'Write your comment: it stays pinned on the site and we can reply right there.' },
      { zona: 'visor', ui: 'Ver en la página', es: 'Ver en la página te lleva justo a esa parte.', en: 'Show on the page takes you right to that spot.' },
    ],
  },
];

// The overview: an opening card, one clip from each section (same clip, same voice line), and a closing card.
export const GENERAL = {
  id: 'braindy-en-90', kind: 'general', paths: [],
  titulo: { es: 'Braindy en 90 segundos', en: 'Braindy in 90 seconds' },
  resumen: { es: 'La app completa: tu marca, tus pedidos, las entregas y cómo apruebas.', en: 'The whole app: your brand, your requests, the deliveries and how you approve.' },
  escenas: [
    { zona: 'tarjeta', ui: 'Braindy', es: 'Esto es Braindy: tu marca, hecha por NicoMarca y sus cuatro Brains.', en: 'This is Braindy: your brand, made by NickMark and his four Brains.' },
    { de: 'inicio.1' }, { de: 'inicio.2' }, { de: 'pedir.3' }, { de: 'revisar.2' }, { de: 'revisar.4' },
    { de: 'mi-marca.1' }, { de: 'archivos.1' }, { de: 'apps-sitio.2' }, { de: 'resultados.1' }, { de: 'accesos.3' },
    { zona: 'tarjeta', ui: 'Aprende', es: 'Todo en app.braindy.co. Y si quieres ver una sección a fondo, está en Aprende.', en: 'All at app.braindy.co. And to see any section in depth, go to Learn.' },
  ],
};

export const TODOS = [GENERAL, ...SECCIONES, ...NOVEDADES];

/** The overview's scenes with the section clips resolved. */
export const escenasDe = (v) => v.escenas.map((e) => {
  if (!e.de) return e;
  const [id, n] = e.de.split('.'); const s = SECCIONES.find((x) => x.id === id);
  return { ...s.escenas[Number(n) - 1], de: e.de };
});
