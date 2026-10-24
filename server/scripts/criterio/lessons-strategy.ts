// NickMark Taste · brand strategy lessons (neuromarketing, Primal Branding, archetypes). Drafted from the onboarding decks.
import type { LessonSeed } from './types.js';

export const STRATEGY_LESSONS: LessonSeed[] = [
  {
    id: 'neuromarketing-en-5-minutos', area: 'strategy', order: 20, minutes: 5,
    categories: ['branding', 'marketing', 'social'], stages: ['onboarding', 'review'],
    title: { es: 'Neuromarketing en 5 minutos', en: 'Neuromarketing in 5 minutes' },
    summary: {
      es: 'Las personas no compran con la razón. Compran con la emoción y lo justifican después. Seis estímulos que usamos en cada pieza.',
      en: 'People don\'t buy with reason. They buy with emotion and justify it later. Six stimuli we use in every piece.',
    },
    body: {
      es: `El neuromarketing es la ciencia de cómo decidimos, aplicada a la comunicación. Mide lo que pasa en el cerebro y en el cuerpo cuando vemos una marca: atención, emoción, recuerdo.

## Tres cerebros que deciden
Una forma simple de entenderlo: tenemos una parte **racional** que analiza, una **emocional** que siente y una **primitiva** que reacciona para sobrevivir. La mayoría de las decisiones de compra pasan primero por las dos últimas. La razón llega después a justificar.

## Los seis estímulos
Para llegarle a esa parte que decide rápido, cada pieza usa uno o varios de estos estímulos:
- **Centrado en la persona:** habla de "tú", no de "nosotros". Al cerebro le importa lo que gana.
- **Contraste:** antes y después, con y sin. Sin contraste no hay decisión.
- **Tangible:** cifras concretas, imágenes reales, ejemplos. Lo abstracto se olvida.
- **Principio y final:** lo que pones al inicio y al cierre es lo que se recuerda. Lo del medio importa mucho menos.
- **Visual:** el ojo llega antes que la palabra. Si se entiende con la imagen, mejor.
- **Emocional:** una emoción clara (alivio, orgullo, deseo, seguridad) fija el mensaje.

## Cómo verlo en tus piezas
Cuando revises algo nuestro, busca estos estímulos. Si un titular habla de "nosotros", si no hay contraste, si todo está en el medio, eso es lo que vamos a corregir. Y si nos pides "poner más información", piensa en el principio y el final: cada cosa extra le quita fuerza a lo importante.`,
      en: `Neuromarketing is the science of how we decide, applied to communication. It measures what happens in the brain and body when we see a brand: attention, emotion, memory.

## Three brains that decide
A simple way to see it: we have a **rational** part that analyzes, an **emotional** part that feels and a **primal** part that reacts to survive. Most buying decisions go through the last two first. Reason arrives later to justify.

## The six stimuli
To reach the part that decides fast, every piece uses one or more of these stimuli:
- **Self-centered:** talk about "you", not "us". The brain cares about what it gains.
- **Contrast:** before and after, with and without. No contrast, no decision.
- **Tangible:** concrete numbers, real images, examples. Abstract gets forgotten.
- **Beginning and end:** what you put first and last is what people remember. The middle matters much less.
- **Visual:** the eye arrives before the word. If the image explains it, better.
- **Emotional:** one clear emotion (relief, pride, desire, safety) makes the message stick.

## How to see it in your pieces
When you review something of ours, look for these stimuli. If a headline talks about "us", if there is no contrast, if everything sits in the middle, that is what we fix. And if you ask us to "add more information", remember beginning and end: every extra item takes strength away from what matters.`,
    },
    script: {
      es: `¿Sabías que decides comprar antes de darte cuenta? Primero sientes, después justificas.
Por eso en Braindy cada pieza usa seis estímulos: habla de ti, no de nosotros. Muestra un contraste, antes y después. Es tangible, con cifras e imágenes reales. Cuida el principio y el final, porque lo del medio casi no se recuerda. Es visual. Y tiene una emoción clara.
La próxima vez que revises una pieza, búscalos. Soy NicoMarca.`,
      en: `Did you know you decide to buy before you notice? First you feel, then you justify.
That is why every Braindy piece uses six stimuli: it talks about you, not us. It shows a contrast, before and after. It is tangible, with real numbers and images. It cares about the beginning and the end, because the middle is barely remembered. It is visual. And it carries one clear emotion.
Next time you review a piece, look for them. I'm NickMark.`,
    },
  },
  {
    id: 'primal-branding', area: 'strategy', order: 21, minutes: 6,
    categories: ['branding', 'marketing'], stages: ['onboarding', 'review'],
    title: { es: 'Primal Branding: los 7 pilares de una marca con comunidad', en: 'Primal Branding: the 7 pillars of a brand with a community' },
    summary: {
      es: 'Las marcas que la gente defiende tienen siete piezas en común. Las construimos contigo en un taller, y se vuelven el ADN de todo lo que comunicamos.',
      en: 'The brands people defend share seven pieces. We build them with you in a workshop, and they become the DNA of everything we communicate.',
    },
    body: {
      es: `Primal Branding es un método de Patrick Hanlon para construir marcas que crean comunidad: marcas con las que la gente se identifica, no solo marcas que compra. Tiene siete pilares.

## Los 7 pilares
- **Historia de creación:** de dónde vienes y por qué existes. La gente confía en lo que tiene origen.
- **Credo:** en qué crees. Una frase que tu equipo y tus clientes pueden repetir.
- **Íconos:** lo que te hace reconocible de un vistazo: logo, color, un objeto, un sonido.
- **Rituales:** las experiencias que se repiten con tu marca: cómo recibes, cómo entregas, cómo celebras.
- **Léxico:** las palabras propias de tu marca. Si tus clientes las usan, ya son parte de la comunidad.
- **No creyentes:** contra qué o contra quién te defines. Saber qué no eres te da carácter.
- **Líder:** la persona o la visión que guía la marca.

## Cómo lo trabajamos
En el taller llenamos cada pilar contigo. El resultado es una línea por pilar y algunos puntos de apoyo. Esa hoja se vuelve parte de tu Brand Brain: los Brains la leen antes de cada pieza y NicoMarca la usa para corregir.

## Cómo usarlo tú
Cuando escribas un post, atiendas un cliente o presentes tu empresa, vuelve a los pilares. Si lo que vas a decir no suena a tu credo o no usa tu léxico, ajústalo. Una marca con comunidad se construye siendo consistente cada día.`,
      en: `Primal Branding is a method by Patrick Hanlon to build brands that create community: brands people identify with, not just brands they buy. It has seven pillars.

## The 7 pillars
- **Creation story:** where you come from and why you exist. People trust what has an origin.
- **Creed:** what you believe. One sentence your team and clients can repeat.
- **Icons:** what makes you recognizable at a glance: logo, color, an object, a sound.
- **Rituals:** the experiences that repeat with your brand: how you welcome, how you deliver, how you celebrate.
- **Lexicon:** your brand's own words. If your clients use them, they are part of the community.
- **Nonbelievers:** what or who you define yourself against. Knowing what you are not gives you character.
- **Leader:** the person or vision that guides the brand.

## How we work on it
In the workshop we fill each pillar with you. The result is one line per pillar plus a few supporting points. That sheet becomes part of your Brand Brain: the Brains read it before every piece and NickMark uses it to correct.

## How you use it
When you write a post, serve a client or present your company, go back to the pillars. If what you are about to say doesn't sound like your creed or doesn't use your lexicon, adjust it. A brand with a community is built by being consistent every day.`,
    },
    script: {
      es: `¿Por qué hay marcas que la gente defiende como si fueran suyas? Porque tienen siete piezas: una historia de origen, un credo, íconos, rituales, un léxico propio, saben contra qué están y tienen un líder.
En Braindy las construimos contigo en un taller, una línea por pilar. Esa hoja la leen mis Brains antes de cada pieza.
Tu marca no se vuelve comunidad por un logo. Se vuelve comunidad por ser consistente. Soy NicoMarca.`,
      en: `Why do people defend some brands as if they were their own? Because those brands have seven pieces: a creation story, a creed, icons, rituals, their own lexicon, they know what they stand against, and they have a leader.
At Braindy we build them with you in a workshop, one line per pillar. My Brains read that sheet before every piece.
Your brand doesn't become a community because of a logo. It becomes one by being consistent. I'm NickMark.`,
    },
  },
  {
    id: 'arquetipos-de-marca', area: 'strategy', order: 22, minutes: 4,
    categories: ['branding'], stages: ['review'],
    title: { es: 'Arquetipos: ¿qué personaje es tu marca?', en: 'Archetypes: which character is your brand?' },
    summary: {
      es: 'Doce personajes que todos reconocemos sin explicación. Elegir uno le da a tu marca una personalidad coherente en colores, tono y decisiones.',
      en: 'Twelve characters everyone recognizes without explanation. Choosing one gives your brand a coherent personality in color, tone and decisions.',
    },
    body: {
      es: `Los arquetipos vienen de Carl Jung: personajes que aparecen en todas las culturas y que reconocemos sin que nadie nos los explique. Las marcas fuertes se parecen a uno de ellos.

## Los doce
Inocente, Sabio, Explorador, Rebelde, Mago, Héroe, Amante, Bufón, Persona común, Cuidador, Gobernante y Creador. Cada uno tiene un deseo, un miedo, una estrategia y una debilidad. Por ejemplo, el **Héroe** quiere demostrar su valor y teme la debilidad; el **Cuidador** quiere proteger y teme el egoísmo.

## Para qué sirve
Elegir un arquetipo principal (y a veces uno de apoyo) resuelve muchas decisiones de una vez:
- Qué colores y formas usar.
- Cómo suena la marca cuando escribe.
- Qué tipo de fotos y de historias cuenta.
- Qué cosas nunca haría.

## Cómo saber si tu pieza está en personaje
Pregúntate: si mi marca fuera una persona, ¿diría esto? ¿Se vestiría así? Una marca Cuidadora que de pronto habla como Rebelde confunde, aunque el post sea bonito.

En tu Brand Brain está tu arquetipo. Cuando dudes de un texto o de una foto, vuelve a él.`,
      en: `Archetypes come from Carl Jung: characters that appear in every culture and that we recognize without anyone explaining them. Strong brands resemble one of them.

## The twelve
Innocent, Sage, Explorer, Outlaw, Magician, Hero, Lover, Jester, Everyman, Caregiver, Ruler and Creator. Each one has a desire, a fear, a strategy and a weakness. For example, the **Hero** wants to prove their worth and fears weakness; the **Caregiver** wants to protect and fears selfishness.

## What it is for
Choosing a main archetype (sometimes with a supporting one) settles many decisions at once:
- Which colors and shapes to use.
- How the brand sounds when it writes.
- What kind of photos and stories it tells.
- What it would never do.

## How to tell if a piece is in character
Ask yourself: if my brand were a person, would it say this? Would it dress like this? A Caregiver brand that suddenly talks like an Outlaw confuses people, even if the post looks nice.

Your archetype is in your Brand Brain. When you doubt a text or a photo, go back to it.`,
    },
  },
];
