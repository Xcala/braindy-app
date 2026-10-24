// NickMark Taste · website, brand kit and process lessons. Drafted from the onboarding decks ("Neuro Web") plus new ones.
import type { LessonSeed } from './types.js';

export const WEB_LESSONS: LessonSeed[] = [
  {
    id: 'el-hero', area: 'web', order: 30, minutes: 4,
    categories: ['web'], stages: ['ask', 'review'],
    title: { es: 'El hero: tres preguntas en quince segundos', en: 'The hero: three questions in fifteen seconds' },
    summary: {
      es: 'La primera pantalla de tu sitio decide si la persona se queda. Tiene que responder qué es esto, qué haces y qué gano yo.',
      en: 'The first screen of your site decides whether people stay. It must answer what this is, what you do and what is in it for me.',
    },
    body: {
      es: `El hero es lo primero que se ve al abrir tu sitio, antes de hacer scroll. Tienes unos **quince segundos** para que la persona decida quedarse. La mayoría se va antes.

## Las tres preguntas
Un buen hero responde, sin que nadie tenga que buscar:
- **¿Qué es esto?** Una marca, un producto, un servicio.
- **¿Qué haces?** En palabras de tu cliente, no en jerga.
- **¿Qué gano yo?** El resultado que la persona quiere.

## Lo que lleva
- Un **titular** corto que diga el beneficio.
- Una línea de apoyo que lo aterrice.
- **Una acción principal** clara (cotizar, agendar, comprar) y como máximo una secundaria.
- Una imagen o video que muestre el resultado, mejor si hay personas reales. Si una cara mira hacia el botón, la gente también mira hacia allá.

## Lo que sobra
- Carruseles que cambian solos: casi nadie ve la segunda lámina.
- Tres botones con el mismo peso: cuando todo es importante, nada lo es.
- Frases como "Bienvenidos a nuestro sitio web" o "Somos líderes en el sector".

## Cómo revisarlo
Abre el hero en el celular, cuenta hasta cinco y ciérralo. Si no puedes decir qué haces y qué gana tu cliente, todavía no está listo. Pídenos el cambio con esa frase: "en cinco segundos no se entiende X".`,
      en: `The hero is the first thing people see when they open your site, before scrolling. You have about **fifteen seconds** for them to decide to stay. Most leave before that.

## The three questions
A good hero answers, without anyone having to look:
- **What is this?** A brand, a product, a service.
- **What do you do?** In your client's words, not jargon.
- **What is in it for me?** The result the person wants.

## What it holds
- A short **headline** that states the benefit.
- A supporting line that grounds it.
- **One main action** that is clear (quote, book, buy) and at most one secondary.
- An image or video that shows the result, ideally with real people. If a face looks toward the button, people look there too.

## What it doesn't need
- Auto-rotating sliders: almost nobody sees the second slide.
- Three buttons with the same weight: when everything is important, nothing is.
- Lines like "Welcome to our website" or "We are leaders in the industry".

## How to review it
Open the hero on your phone, count to five and close it. If you can't say what you do and what your client gains, it isn't ready yet. Ask us for the change with that sentence: "in five seconds X isn't clear".`,
    },
    script: {
      es: `Tienes quince segundos. Eso es lo que alguien le da a tu sitio antes de irse.
Por eso la primera pantalla, el hero, responde tres preguntas: qué es esto, qué haces y qué gano yo.
Un titular con el beneficio, una línea de apoyo y un solo botón principal. Nada de carruseles que giran solos ni de "bienvenidos a nuestro sitio".
Haz la prueba: ábrelo en el celular, cuenta hasta cinco y ciérralo. ¿Se entendió? Soy NicoMarca.`,
      en: `You have fifteen seconds. That is what someone gives your site before leaving.
That is why the first screen, the hero, answers three questions: what is this, what do you do and what is in it for me.
A headline with the benefit, a supporting line and one main button. No auto-rotating sliders and no "welcome to our website".
Try it: open it on your phone, count to five and close it. Was it clear? I'm NickMark.`,
    },
  },
  {
    id: 'sitio-que-vende', area: 'web', order: 31, minutes: 6,
    categories: ['web'], stages: ['review'],
    title: { es: 'Las 15 reglas de un sitio que vende', en: 'The 15 rules of a website that sells' },
    summary: {
      es: 'Un buen sitio convierte visitantes en clientes. Estas son las reglas que aplicamos en cada página, y lo que puedes revisar tú.',
      en: 'A good website turns visitors into clients. These are the rules we apply on every page, and what you can check yourself.',
    },
    body: {
      es: `Hay sitios para informar o entretener y sitios para convertir. Los de tus clientes casi siempre son de los segundos. Estas son las reglas que usamos.

## Mensaje
- **Di qué haces y qué quieres que haga la persona.** En el hero, sin rodeos.
- **El menú cuenta de qué se trata el sitio.** Pocas opciones, nombres claros.
- **El buen diseño empieza en el texto.** Primero el copy, después el diseño.
- **Testimonios reales** de clientes reales, con nombre y foto si se puede.

## Decisión
- **Llamados a la acción** visibles en cada sección importante.
- **Menos opciones, decisiones más rápidas** (ley de Hick).
- **Contraste en los botones:** el botón principal se ve antes que todo lo demás.
- **Caras humanas,** idealmente mirando hacia la acción.

## Lectura
- La gente lee en **forma de F**: titulares a la izquierda, frases cortas.
- **Espacio en blanco** e interlineado generoso: el aire también comunica.
- **Regla de tercios** para ubicar lo importante.
- **Simple:** si se puede quitar sin que se pierda nada, se quita.

## Experiencia
- **Velocidad:** cada segundo de carga cuesta conversiones. Usamos carga progresiva, no ruedas que giran.
- **Animaciones con propósito:** guían la mirada, no distraen.
- **Ahorra pasos y clics.** La mayoría de las personas no vuelve después de una mala experiencia.

## Cómo revisar tu sitio
Recórrelo como si fueras tu cliente, en el celular. Anota dónde dudaste, dónde tuviste que buscar y dónde te dieron ganas de irte. Esas notas son el mejor feedback que nos puedes dar.`,
      en: `Some sites exist to inform or entertain and some to convert. Your clients' sites are almost always the second kind. These are the rules we use.

## Message
- **Say what you do and what you want the visitor to do.** In the hero, plainly.
- **The menu tells what the site is about.** Few options, clear names.
- **Good design starts with the text.** Copy first, design second.
- **Real testimonials** from real clients, with name and photo when possible.

## Decision
- **Calls to action** visible in every important section.
- **Fewer options, faster decisions** (Hick's law).
- **Contrast on buttons:** the main button is seen before anything else.
- **Human faces,** ideally looking toward the action.

## Reading
- People read in an **F pattern**: headlines on the left, short sentences.
- **White space** and generous line height: air communicates too.
- **Rule of thirds** to place what matters.
- **Simple:** if something can go without losing anything, it goes.

## Experience
- **Speed:** every second of loading costs conversions. We use progressive loading, not spinning wheels.
- **Animations with a purpose:** they guide the eye, they don't distract.
- **Save steps and clicks.** Most people don't come back after a bad experience.

## How to review your site
Walk through it as if you were your client, on your phone. Note where you hesitated, where you had to search and where you felt like leaving. Those notes are the best feedback you can give us.`,
    },
  },
  {
    id: 'presentacion-y-manual-de-marca', area: 'brandkit', order: 70, minutes: 4,
    categories: ['graphic', 'branding'], stages: ['review'],
    title: { es: 'Cómo se usa una presentación y un manual de marca', en: 'How to use a brand presentation and a brand manual' },
    summary: {
      es: 'El manual no es para guardarlo. Es la herramienta para que tu equipo y tus proveedores hagan todo igual de bien cuando no estamos.',
      en: 'The manual is not for filing away. It is the tool that lets your team and suppliers do everything equally well when we are not around.',
    },
    body: {
      es: `Después de construir tu marca te entregamos dos cosas que suelen confundirse.

## La presentación de marca
Cuenta la historia: de dónde partimos, qué descubrimos, qué decidimos y por qué. Sirve para **presentarle la marca a tu equipo, a socios o a inversionistas**. Es la que usas para inspirar.

## El manual de marca
Es el reglamento: logo y sus versiones, área de seguridad, tamaños mínimos, colores con sus códigos (Hex, RGB, CMYK, Pantone), tipografías, tono de voz, ejemplos de uso correcto e incorrecto. Sirve para que **cualquiera que toque tu marca la aplique bien**. Es la que usas para cuidar.

## Cómo usarlos bien
- Cuando contrates una imprenta, un fotógrafo o una agencia de pauta, mándales el manual el primer día.
- Cuando alguien de tu equipo haga una pieza interna, que abra el manual antes de empezar.
- Si algo no está en el manual, pregúntanos antes de inventarlo. Lo agregamos y queda para siempre.
- En **Mi marca** tienes los colores y las fuentes listos para copiar con un clic.

## Elementos de marca
Las firmas de correo, las tarjetas virtuales, las plantillas de presentación y de redes son el manual aplicado. Son lo que tu equipo usa todos los días, por eso hacen que la marca se vea consistente sin esfuerzo.`,
      en: `After building your brand we hand you two things that are often confused.

## The brand presentation
It tells the story: where we started, what we found, what we decided and why. It is for **presenting the brand to your team, partners or investors**. It is the one you use to inspire.

## The brand manual
It is the rulebook: the logo and its versions, clear space, minimum sizes, colors with their codes (Hex, RGB, CMYK, Pantone), typefaces, tone of voice, examples of right and wrong use. It exists so **anyone who touches your brand applies it well**. It is the one you use to protect.

## How to use them well
- When you hire a printer, a photographer or an ads agency, send them the manual on day one.
- When someone on your team makes an internal piece, they open the manual before starting.
- If something isn't in the manual, ask us before inventing it. We add it and it stays forever.
- In **My brand** you have colors and fonts ready to copy with one click.

## Brand elements
Email signatures, virtual cards, presentation and social templates are the manual in action. They are what your team uses every day, so they make the brand look consistent without effort.`,
    },
  },
  {
    id: 'como-revisar-y-dar-feedback', area: 'process', order: 1, minutes: 4,
    categories: [], stages: ['onboarding', 'ask'],
    title: { es: 'Cómo revisar una pieza y dar feedback que sirva', en: 'How to review a piece and give feedback that works' },
    summary: {
      es: 'Un buen comentario ahorra una versión entera. Qué mirar primero, cómo decir lo que no te convence y cuándo aprobar.',
      en: 'A good comment saves a whole version. What to look at first, how to say what doesn\'t convince you and when to approve.',
    },
    body: {
      es: `Cada pieza llega con su razón: por qué funciona. Léela primero. Después revisa en este orden.

## 1. ¿Cumple el objetivo?
¿La pieza logra lo que pedimos? Un post para vender, una landing para captar datos, un logo para que te reconozcan. Si no lo cumple, eso es lo primero que hay que decir.

## 2. ¿Es verdad y está completo?
Datos, precios, nombres, fechas. Esto solo lo sabes tú.

## 3. ¿Se siente como tu marca?
Tono, colores, estilo. Compáralo con tu Brand Brain, no con tu gusto del día.

## Cómo decir lo que no te convence
- **Describe el problema, no la solución.** "No se entiende que es un descuento" sirve más que "pon el texto en rojo".
- **Marca sobre la pieza** el punto exacto con un clic.
- **Un comentario por idea.** Así se puede resolver uno por uno.
- **Si es gusto personal, dilo.** Lo tomamos en cuenta, pero lo pesamos contra lo que funciona para tu cliente.

## Cuándo aprobar
Cuando cumple el objetivo, los datos están bien y suena a tu marca. No hace falta que sea perfecto para ti: tiene que funcionar para tu cliente. Lo que se aprende de cada aprobación queda en el Brand Brain y la siguiente pieza sale mejor.

## Tiempos
Responde el mismo día si puedes. Cada día de espera mueve la entrega un día.`,
      en: `Every piece arrives with its reason: why it works. Read it first. Then review in this order.

## 1. Does it meet the goal?
Does the piece achieve what we asked for? A post to sell, a landing page to capture leads, a logo to be recognized. If it doesn't, that is the first thing to say.

## 2. Is it true and complete?
Data, prices, names, dates. Only you know this.

## 3. Does it feel like your brand?
Tone, colors, style. Compare it with your Brand Brain, not with your taste of the day.

## How to say what doesn't convince you
- **Describe the problem, not the solution.** "It's not clear it's a discount" works better than "make the text red".
- **Mark the exact spot** on the piece with one click.
- **One comment per idea.** That way they can be solved one by one.
- **If it's personal taste, say so.** We take it into account, and weigh it against what works for your client.

## When to approve
When it meets the goal, the data is right and it sounds like your brand. It doesn't have to be perfect for you: it has to work for your client. What we learn from each approval goes into the Brand Brain and the next piece comes out better.

## Timing
Answer the same day if you can. Every day of waiting moves the delivery one day.`,
    },
    script: {
      es: `Un buen comentario te ahorra una versión entera. Te cuento cómo.
Primero lee por qué funciona la pieza. Después revisa tres cosas: si cumple el objetivo, si los datos son correctos y si se siente como tu marca.
Cuando algo no te convenza, describe el problema, no la solución. "No se entiende el descuento" sirve más que "ponlo en rojo". Marca el punto exacto y deja un comentario por idea.
Y responde el mismo día: cada día de espera mueve la entrega. Soy NicoMarca.`,
      en: `A good comment saves you a whole version. Here's how.
First read why the piece works. Then check three things: does it meet the goal, is the data right, and does it feel like your brand.
When something doesn't convince you, describe the problem, not the solution. "The discount isn't clear" works better than "make it red". Mark the exact spot and leave one comment per idea.
And answer the same day: every day of waiting moves the delivery. I'm NickMark.`,
    },
  },
];
