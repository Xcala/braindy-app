import type { Lang } from '../i18n/I18nProvider';

// Keep keys in sync with server/src/onboarding.ts (BRIEF_KEYS).
export const QUESTIONS: Array<{ key: string; topic: Record<Lang, string>; ask: Record<Lang, string> }> = [
  { key: 'voice', topic: { en: 'Voice and personality', es: 'Voz y personalidad' },
    ask: { en: 'If your brand were a person, how would it talk? Three words, and one thing it would never say.', es: 'Si su marca fuera una persona, ¿cómo hablaría? Tres palabras, y algo que nunca diría.' } },
  { key: 'audiences', topic: { en: 'Audiences', es: 'Públicos' },
    ask: { en: 'Who buys from you, and who decides? Tell us about your main and second audience.', es: '¿Quién les compra y quién decide? Cuéntennos de su público principal y el segundo.' } },
  { key: 'competitors', topic: { en: 'Competitors', es: 'Competidores' },
    ask: { en: 'Who do you compete with when a client chooses? Name two or three, or paste their websites.', es: '¿Con quién compiten cuando un cliente elige? Nombren dos o tres, o peguen sus sitios web.' } },
  { key: 'offer', topic: { en: 'Prices and offer', es: 'Precios y oferta' },
    ask: { en: 'What do you sell, at what price, and what is the offer you want to push the most?', es: '¿Qué venden, a qué precio, y cuál es la oferta que más quieren mover?' } },
  { key: 'proof', topic: { en: 'Proof you already have', es: 'Pruebas que ya tienen' },
    ask: { en: 'What proves you are good? Numbers, clients, awards, testimonials.', es: '¿Qué prueba que son buenos? Cifras, clientes, premios, testimonios.' } },
  { key: 'references', topic: { en: 'References you love', es: 'Referencias que les encantan' },
    ask: { en: 'Brands or pieces you love (any industry). Links are perfect.', es: 'Marcas o piezas que les encantan (de cualquier industria). Los links son perfectos.' } },
  { key: 'avoid', topic: { en: 'What to avoid', es: 'Qué evitar' },
    ask: { en: 'Words, images or promises you never want to see with your brand.', es: 'Palabras, imágenes o promesas que nunca quieren ver con su marca.' } },
  { key: 'goals', topic: { en: 'Goals in sales, not likes', es: 'Metas en ventas, no en likes' },
    ask: { en: 'What should happen in the next six months? Sales, leads, enrollments, with a number if you have one.', es: '¿Qué debería pasar en los próximos seis meses? Ventas, leads, matrículas, con un número si lo tienen.' } },
];
