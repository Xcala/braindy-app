// NickMark Taste · answers to the typical objections. Triggers are lowercase fragments (accents are ignored when matching).
import type { ObjectionSeed } from './types.js';

export const OBJECTIONS: ObjectionSeed[] = [
  {
    id: 'logo-mas-grande', area: 'logos', order: 1, lessonId: 'sistema-de-logo',
    phrase: { es: 'Haz el logo más grande', en: 'Make the logo bigger' },
    answer: {
      es: 'El logo firma, el mensaje vende. Cada centímetro que gana el logo se lo quita a la razón por la que tu cliente compra. Lo dejamos del tamaño en que se reconoce y el resto del espacio trabaja para vender.',
      en: 'The logo signs, the message sells. Every inch the logo gains is taken from the reason your client buys. We keep it at the size where it\'s recognized and let the rest of the space sell.',
    },
    triggers: ['logo mas grande', 'logo más grande', 'agrandar el logo', 'agranda el logo', 'aumentar el logo', 'logo mas visible', 'logo bigger', 'bigger logo', 'make the logo larger', 'larger logo'],
  },
  {
    id: 'que-haga-pop', area: 'logos', order: 2, lessonId: 'neuromarketing-en-5-minutos',
    phrase: { es: 'Que haga pop', en: 'Make it pop' },
    answer: {
      es: '"Pop" puede ser más contraste, más color, movimiento o un mensaje más fuerte. Dinos qué sentiste que faltaba (¿no se ve? ¿no emociona? ¿no destaca en el feed?) y lo resolvemos con intención, no con ruido.',
      en: '"Pop" can mean more contrast, more color, motion or a stronger message. Tell us what felt missing (hard to see? not exciting? lost in the feed?) and we solve it with intent, not noise.',
    },
    triggers: ['que haga pop', 'mas pop', 'más pop', 'que resalte mas', 'que resalte más', 'que llame mas la atencion', 'que llame más la atención', 'make it pop', 'more pop', 'needs to pop'],
  },
  {
    id: 'todo-relevante', area: 'logos', order: 3, lessonId: 'sitio-que-vende',
    phrase: { es: 'Que todo sea relevante', en: 'Make everything stand out' },
    answer: {
      es: 'Si todo destaca, nada destaca. La jerarquía es decidir qué se lee primero, qué después y qué al final. Elige la una cosa que tu cliente no puede perderse y la hacemos protagonista.',
      en: 'If everything stands out, nothing does. Hierarchy means deciding what is read first, second and last. Pick the one thing your client can\'t miss and we make it the hero.',
    },
    triggers: ['todo sea relevante', 'todo relevante', 'todo resalte', 'todo importante', 'todo igual de grande', 'everything stand out', 'everything important', 'all of it bigger'],
  },
  {
    id: 'mas-informacion', area: 'strategy', order: 4, lessonId: 'neuromarketing-en-5-minutos',
    phrase: { es: 'Ponle más información', en: 'Add more information' },
    answer: {
      es: 'Una pieza, una idea. Lo que se recuerda es el principio y el final; lo que agregamos en el medio le quita fuerza a lo importante. El resto de la información va en el siguiente paso: tu sitio, tu WhatsApp, tu catálogo.',
      en: 'One piece, one idea. People remember the beginning and the end; whatever we add in the middle weakens what matters. The rest of the information belongs in the next step: your site, your WhatsApp, your catalog.',
    },
    triggers: ['mas informacion', 'más información', 'mas texto', 'más texto', 'agrega mas datos', 'agregar mas datos', 'ponle mas', 'ponle más', 'add more info', 'more text', 'more information', 'add more details'],
  },
  {
    id: 'color-que-me-gusta', area: 'logos', order: 5, lessonId: 'una-marca-no-es-un-logo',
    phrase: { es: 'Usa este color que me gusta', en: 'Use this color I like' },
    answer: {
      es: 'Tu marca no es tu gusto: es lo que reconoce y siente tu cliente. Cada color está elegido por lo que comunica y por cómo te separa de tu competencia. Si quieres, te mostramos la pieza con tu color al lado de la propuesta para decidir con la razón.',
      en: 'Your brand isn\'t your taste: it\'s what your client recognizes and feels. Each color is chosen for what it says and how it separates you from competitors. If you like, we show the piece with your color next to the proposal so you decide with the reason.',
    },
    triggers: ['me gusta mas el', 'me gusta más el', 'cambia el color', 'cambiar el color', 'otro color', 'mi color favorito', 'i like this color', 'change the color', 'different color', 'my favorite color'],
  },
  {
    id: 'no-me-gusta', area: 'process', order: 6, lessonId: 'como-revisar-y-dar-feedback',
    phrase: { es: 'No me gusta', en: 'I don\'t like it' },
    answer: {
      es: 'Es válido, y nos sirve mucho más si sabemos por qué. ¿No cumple el objetivo, hay un dato mal o no se siente como tu marca? Dinos qué sentiste y marca el punto exacto en la pieza: así la siguiente versión acierta.',
      en: 'Fair enough, and it helps us much more if we know why. Does it miss the goal, is a fact wrong, or does it not feel like your brand? Tell us what you felt and mark the exact spot: that way the next version lands.',
    },
    triggers: ['no me gusta', 'no me convence', 'no me encanta', 'no me late', 'i dont like', "i don't like", 'not convinced', "don't love it"],
  },
  {
    id: 'algo-como-apple', area: 'logos', order: 7, lessonId: 'como-se-disena-un-logo',
    phrase: { es: 'Quiero algo como Apple', en: 'I want something like Apple' },
    answer: {
      es: 'Apple funciona por foco, no por estética: una idea, mucho aire, cero ruido. Copiamos el foco, no la forma, porque una marca que se parece a otra se vuelve una opción más. Dinos qué te gusta de esa marca y lo traducimos a la tuya.',
      en: 'Apple works because of focus, not looks: one idea, lots of air, zero noise. We copy the focus, not the form, because a brand that looks like another becomes just one more option. Tell us what you like about that brand and we translate it to yours.',
    },
    triggers: ['como apple', 'como nike', 'como la de', 'parecido a', 'igual a la de', 'like apple', 'like nike', 'similar to', 'like the one from'],
  },
  {
    id: 'se-parece-a-otro', area: 'logos', order: 8, lessonId: 'como-se-disena-un-logo',
    phrase: { es: 'Se parece a otro logo', en: 'It looks like another logo' },
    answer: {
      es: 'Gracias por revisarlo: es importante. La similitud no es un error, muchas marcas comparten formas o letras y conviven sin problema, incluso en la misma industria. El límite es el plagio. Mándanos la referencia y la comparamos; si hay riesgo real, lo ajustamos.',
      en: 'Thanks for checking, it matters. Similarity is not a mistake: many brands share shapes or letters and coexist fine, even in the same industry. The line is plagiarism. Send us the reference and we compare; if there is real risk, we adjust it.',
    },
    triggers: ['se parece a', 'parecido al logo', 'ya existe un logo', 'igualito a', 'looks like another', 'similar logo', 'looks like the logo of', 'already exists'],
  },
  {
    id: 'que-diga-todo', area: 'logos', order: 9, lessonId: 'una-marca-no-es-un-logo',
    phrase: { es: 'Que el logo diga todo lo que hacemos', en: 'The logo should say everything we do' },
    answer: {
      es: 'Un logo no comunica, identifica. Ningún logo grande del mundo explica lo que hace la empresa, y por eso se recuerdan. Lo que haces lo cuenta tu mensaje, tu sitio y tu servicio; el logo es la firma que lo hace reconocible.',
      en: 'A logo doesn\'t communicate, it identifies. None of the world\'s great logos explains what the company does, and that\'s why they\'re remembered. What you do is told by your message, your site and your service; the logo is the signature that makes it recognizable.',
    },
    triggers: ['que diga lo que hacemos', 'que represente todo', 'que se entienda a que nos dedicamos', 'que muestre lo que hacemos', 'que incluya', 'say what we do', 'represent everything', 'show what we do'],
  },
  {
    id: 'mas-efectos', area: 'logos', order: 10, lessonId: 'sistema-de-logo',
    phrase: { es: 'Ponle más colores, efectos o 3D', en: 'Add more colors, effects or 3D' },
    answer: {
      es: 'Menos es más: un logo plano y simple funciona en un sello, en un favicon, bordado y en negativo. Los efectos y el 3D se ven bien en una pantalla grande y fallan en todas las demás. Si quieres más impacto, lo ponemos en las piezas, no en el logo.',
      en: 'Less is more: a flat, simple logo works on a stamp, a favicon, embroidered and in negative. Effects and 3D look good on a big screen and fail everywhere else. If you want more impact, we put it in the pieces, not in the logo.',
    },
    triggers: ['mas colores', 'más colores', 'efecto 3d', 'en 3d', 'degradado al logo', 'sombra al logo', 'brillo', 'more colors', '3d effect', 'add a gradient', 'add a shadow', 'more effects'],
  },
];
