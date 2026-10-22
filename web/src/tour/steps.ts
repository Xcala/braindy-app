import type { Lang } from '../i18n/I18nProvider';
import type { Paso } from './engine.js';

// Each step: what it is → what it is for → how to do it well. Elements are marked with data-tour="…".
const visible = (...sels: string[]) => sels.find((s) => document.querySelector(s)?.getClientRects().length) ?? sels[0];
const ask = () => visible('[data-tour="ask-nav-m"]', '[data-tour="ask-nav"]');
const fin = { es: '<p>¿Quieres verlo otra vez? Abre el menú de tu cuenta (tu inicial, arriba a la derecha) y elige <b>Ver el recorrido</b>.</p>', en: '<p>Want to see it again? Open your account menu (your initial, top right) and choose <b>See the tour</b>.</p>' };

export function homeSteps(lang: Lang): Paso[] {
  const es = lang === 'es';
  return [
    { logo: true, titulo: es ? 'Bienvenido a Braindy' : 'Welcome to Braindy',
      texto: es ? '<p>En un minuto te mostramos cómo funciona tu app: <b>qué te necesita</b>, quién está trabajando y cómo pedir algo nuevo.</p><p>No hay nada que configurar. Todo lo que hagas se guarda solo.</p>'
        : '<p>In one minute we show you how your app works: <b>what needs you</b>, who is working, and how to ask for something new.</p><p>There is nothing to set up. Everything you do saves itself.</p>' },
    { el: '[data-tour="home-needs"]', titulo: es ? '1 · Lo que te necesita' : '1 · What needs you',
      texto: es ? '<p>Arriba siempre ves lo que espera tu respuesta: una entrega por aprobar o un plan por revisar. Revisar toma <b>unos 2 minutos</b>.</p><p>Responde el mismo día si puedes: cada día de espera corre la entrega un día.</p>'
        : '<p>At the top you always see what is waiting for your answer: a delivery to approve or a plan to review. Reviewing takes <b>about 2 minutes</b>.</p><p>Answer the same day if you can: every day of waiting moves the delivery one day.</p>' },
    { el: '[data-tour="home-brains"]', titulo: es ? '2 · Los cuatro Brains' : '2 · The four Brains',
      texto: es ? '<p>El equipo de <b>NicoMarca</b>: el <b>Researcher</b> investiga, el <b>Marketer</b> comunica, el <b>Creator</b> crea y el <b>Builder</b> construye. Trabajan juntos en cada pieza; NicoMarca dirige, corrige y firma todo.</p><p>Cada uno muestra su estado: <b>Listo</b>, <b>Trabajando</b> o <b>Esperando aprobación</b> (te espera a ti).</p>'
        : '<p>The team of <b>NickMark</b>: the <b>Researcher</b> researches, the <b>Marketer</b> communicates, the <b>Creator</b> creates and the <b>Builder</b> builds. They work together on every piece; NickMark directs, corrects and signs everything.</p><p>Each shows its state: <b>Ready</b>, <b>Working</b> or <b>Waiting for approval</b> (waiting on you).</p>' },
    { el: '[data-tour="home-prod"]', titulo: es ? '3 · En producción' : '3 · In production',
      texto: es ? '<p>Lo que se está haciendo ahora, quién lo lidera y la <b>fecha de la primera versión</b>.</p><p>Toca una solicitud para ver el plan, las versiones y los comentarios.</p>'
        : '<p>What is being made right now, who leads it and the <b>date of the first version</b>.</p><p>Tap a request to see its plan, versions and comments.</p>' },
    { el: '[data-tour="home-delivered"]', titulo: es ? '4 · Entregado hace poco' : '4 · Recently delivered',
      texto: es ? '<p>Lo último que aprobaste. Todo lo entregado queda también en <b>Mis archivos</b>, listo para descargar.</p>'
        : '<p>The latest things you approved. Everything delivered also stays in <b>My assets</b>, ready to download.</p>' },
    { el: ask(), titulo: es ? '5 · Pedir algo' : '5 · Ask for something',
      texto: es ? '<p>Aquí empieza todo trabajo nuevo: eliges qué necesitas, lo cuentas en tres tarjetas y un Brain te propone un plan.</p><p class="tg-ej"><span>Mejor</span> una pieza por solicitud («3 posts del open house»)<br><span>Que</span> «todo lo de noviembre» en una sola</p>'
        : '<p>Every new piece of work starts here: you choose what you need, describe it in three cards and a Brain proposes a plan.</p><p class="tg-ej"><span>Better</span> one piece per request ("3 posts for the open house")<br><span>Than</span> "everything for November" in one</p>' },
    { el: '[data-tour="home-brain"]', titulo: es ? '6 · Tu Brand Brain' : '6 · Your Brand Brain',
      texto: es ? '<p>Todo lo que los Brains saben de tu marca: logos, colores, tipografía y voz. Nicolas lo firma y se actualiza con cada aprobación.</p><p>Truco: en <b>Copia rápida</b> un clic copia el color o la fuente para pasársela a quien la necesite.</p>'
        : '<p>Everything the Brains know about your brand: logos, colors, type and voice. Nicolas signs it and it updates with every approval.</p><p>Tip: in <b>Quick copy</b> one click copies a color or font to share it with whoever needs it.</p>' },
    { el: '[data-tour="home-wa"]', titulo: es ? '7 · Aprueba desde WhatsApp' : '7 · Approve from WhatsApp',
      texto: es ? '<p>Cada entrega te puede llegar por WhatsApp con un enlace para aprobar <b>sin iniciar sesión</b>. El enlace dura 7 días y abre solo esa entrega.</p><p>Si aún no está activo, toca aquí y agrega el número de quien aprueba.</p>'
        : '<p>Every delivery can reach you on WhatsApp with a link to approve <b>without signing in</b>. The link lasts 7 days and opens only that delivery.</p><p>If it is not on yet, tap here and add the number of the person who approves.</p>' },
    { logo: true, titulo: es ? 'Listo para empezar' : 'Ready to start', texto: (es ? '<p>Ya sabes lo esencial. Cuando quieras algo nuevo, ve a <b>Pedir algo</b>.</p>' : '<p>You know the essentials. Whenever you want something new, go to <b>Ask for something</b>.</p>') + fin[lang] },
  ];
}

export function askSteps(lang: Lang): Paso[] {
  const es = lang === 'es';
  return [
    { logo: true, titulo: es ? 'Pedir algo, en 3 minutos' : 'Asking, in 3 minutes',
      texto: es ? '<p>Te mostramos cómo pedir para que la <b>primera versión ya sirva</b>. Son tres partes y un resumen.</p>' : '<p>We show you how to ask so the <b>first version already works</b>. Three parts and a summary.</p>' },
    { el: '[data-tour="ask-what"]', titulo: es ? '1 · Qué hacer' : '1 · What to make',
      texto: es ? '<p>Elige la categoría, luego el tipo y al final la pieza. Eso decide qué Brain lo lidera.</p><p>Las que dicen <b>Con Nicolas</b> (marca, estrategia) pasan por él antes de llegarte. Si no encuentras la tuya, usa <b>Otro</b>.</p>'
        : '<p>Choose the category, then the type, then the piece. That decides which Brain leads it.</p><p>Those marked <b>With Nicolas</b> (brand, strategy) go through him before reaching you. If yours is not there, use <b>Other</b>.</p>' },
    { el: '[data-tour="ask-cards"]', titulo: es ? '2 · Las tres tarjetas' : '2 · The three cards',
      texto: es ? '<p><b>Producto</b>: qué se vende, a quién y por qué elegirlo. <b>Aplicación</b>: dónde se va a usar (post de Instagram 4:5, valla 3×1, correo). <b>Escena</b> (opcional): el ambiente que imaginas.</p><p>Escribe <b>al menos 2 o 3 frases</b> en Producto y pega links de referencia: valen más que cualquier adjetivo.</p><p class="tg-ej"><span>Mejor</span> «Kit de análisis para laboratorios clínicos medianos; el cliente decide por precisión y soporte»<br><span>Que</span> «Algo bonito para el kit»</p>'
        : '<p><b>Product</b>: what is sold, to whom and why choose it. <b>Application</b>: where it will be used (Instagram post 4:5, 3×1 billboard, email). <b>Scene</b> (optional): the mood you imagine.</p><p>Write <b>at least 2 or 3 sentences</b> in Product and paste reference links: they beat any adjective.</p><p class="tg-ej"><span>Better</span> "Analysis kit for mid-size clinical labs; buyers choose for precision and support"<br><span>Than</span> "Something nice for the kit"</p>' },
    { el: '[data-tour="ask-when"]', titulo: es ? '3 · Cuándo y cómo' : '3 · When and how',
      texto: es ? '<p>La <b>fecha real</b> en que lo vas a publicar o usar, el formato (1080×1350, PDF A4…) y el idioma.</p><p>Con la fecha real el plan se arma hacia atrás y nada llega tarde.</p>'
        : '<p>The <b>real date</b> you will publish or use it, the format (1080×1350, A4 PDF…) and the language.</p><p>With the real date the plan is built backwards and nothing arrives late.</p>' },
    { el: '[data-tour="ask-summary"]', titulo: es ? '4 · Tu solicitud' : '4 · Your request',
      texto: es ? '<p>Aquí ves qué Brain la lidera y si pasa por Nicolas. <b>Enviar</b> se activa cuando Producto y Aplicación están completos.</p><p>Después: el Brain propone un plan con fecha, se aprueba y te llega la primera versión, cada pieza con su razón.</p>'
        : '<p>Here you see which Brain leads it and whether it goes through Nicolas. <b>Send</b> turns on when Product and Application are filled in.</p><p>Next: the Brain proposes a plan with a date, it gets approved and the first version reaches you, every piece with its reason.</p>' },
    { logo: true, titulo: es ? 'Eso es todo' : "That's it", texto: (es ? '<p>Pide tranquilo: si algo no queda claro, el Brain te pregunta antes de empezar.</p>' : '<p>Ask with confidence: if something is unclear, the Brain asks you before starting.</p>') + fin[lang] },
  ];
}

export function reviewSteps(lang: Lang): Paso[] {
  const es = lang === 'es';
  return [
    { logo: true, titulo: es ? 'Así revisas una entrega' : 'How to review a delivery',
      texto: es ? '<p>En un minuto: cómo mirar la pieza, marcar lo que cambiarías y aprobar. <b>Una buena revisión ahorra una versión entera.</b></p>' : '<p>In one minute: how to look at the piece, mark what you would change and approve. <b>A good review saves a whole version.</b></p>' },
    { el: '[data-tour="review-viewer"]', titulo: es ? '1 · La pieza' : '1 · The piece',
      texto: es ? '<p>Aquí está la versión actual. Arriba cambias entre <b>v1, v2…</b>; cada versión trae lo que cambió y por qué.</p><p>Mírala en el tamaño en que se va a usar: un post se revisa en el celular.</p>'
        : '<p>This is the current version. At the top you switch between <b>v1, v2…</b>; each version says what changed and why.</p><p>Look at it at the size it will be used: a post is reviewed on a phone.</p>' },
    { el: '[data-tour="review-mark"]', titulo: es ? '2 · Marcar en la pieza' : '2 · Mark on the piece',
      texto: es ? '<p>Toca aquí, dibuja un recuadro sobre la parte exacta y escribe el comentario: queda pegado en ese punto.</p><p class="tg-ej"><span>Mejor</span> «El logo 20% más grande y arriba a la izquierda»<br><span>Que</span> «No me convence el logo»</p>'
        : '<p>Tap here, draw a box over the exact spot and write the comment: it stays pinned there.</p><p class="tg-ej"><span>Better</span> "Logo 20% bigger, top left"<br><span>Than</span> "I am not sure about the logo"</p>' },
    { el: '[data-tour="review-decide"]', titulo: es ? '3 · Aprobar o pedir cambios' : '3 · Approve or ask for changes',
      texto: es ? '<p>Si sirve, <b>aprueba</b>: queda en Mis archivos y el Brain aprende de lo que te gustó. Si no, <b>pide cambios</b> diciendo qué, dónde y por qué.</p><p>Junta todos los cambios en <b>una sola ronda</b>: así la siguiente versión llega completa.</p>'
        : '<p>If it works, <b>approve</b>: it goes to My assets and the Brain learns what you liked. If not, <b>ask for changes</b> saying what, where and why.</p><p>Put all changes in <b>one round</b>: the next version then arrives complete.</p>' },
    { el: '[data-tour="review-comments"]', titulo: es ? '4 · La conversación' : '4 · The conversation',
      texto: es ? '<p>Comentarios con los Brains y con Nicolas sobre esta versión. Cuando un punto queda resuelto, márcalo como <b>Resuelto</b>.</p>'
        : '<p>Comments with the Brains and Nicolas about this version. When a point is settled, mark it <b>Resolved</b>.</p>' },
    { el: '[data-tour="review-compare"]', titulo: es ? '5 · Comparar versiones' : '5 · Compare versions',
      texto: es ? '<p>Pon la v1 y la v2 lado a lado, con deslizador, o mira <b>solo lo que cambió</b>. Útil para confirmar que se hicieron tus cambios.</p>'
        : '<p>Put v1 and v2 side by side, with a slider, or see <b>only what changed</b>. Handy to confirm your changes were made.</p>' },
    { el: '[data-tour="review-brief"]', titulo: es ? '6 · El brief y el plan' : '6 · Brief and plan',
      texto: es ? '<p>Lo que pediste y lo que se acordó. Si cambia algo grande (otro producto, otra fecha), mejor <b>pide algo nuevo</b> que estirar esta solicitud.</p>'
        : '<p>What you asked for and what was agreed. If something big changes (another product, another date), better <b>ask for something new</b> than stretch this request.</p>' },
    { logo: true, titulo: es ? 'Listo' : 'Done', texto: (es ? '<p>Recuerda: también puedes aprobar desde el enlace de WhatsApp, sin iniciar sesión.</p>' : '<p>Remember: you can also approve from the WhatsApp link, without signing in.</p>') + fin[lang] },
  ];
}
