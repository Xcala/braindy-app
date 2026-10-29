// Example requests shown in "Do you need something?": what a complete ask looks like for the pieces asked most.
// Each one answers what it is, for whom, the goal, what goes inside, what is attached and when.
export interface AskExample { id: string; label: { es: string; en: string }; category: string; text: { es: string; en: string } }

export const ASK_EXAMPLES: AskExample[] = [
  {
    id: 'carousel', category: 'social', label: { es: 'Carrusel', en: 'Carousel' },
    text: {
      es: 'Carrusel de 6 slides para Instagram sobre el lanzamiento de nuestro servicio de mantenimiento. Objetivo: que agenden una cita.\nSlide 1: gancho con la pregunta "¿Tu equipo está listo para la temporada alta?".\nSlides 2 a 5: los 4 beneficios (adjunto el PDF con la información).\nSlide 6: llamado a la acción "Agenda por WhatsApp".\nTono cercano, con fotos reales del equipo. Lo necesito para el viernes.',
      en: 'Six-slide Instagram carousel announcing our maintenance service. Goal: get people to book a visit.\nSlide 1: hook with the question "Is your equipment ready for peak season?".\nSlides 2 to 5: the 4 benefits (PDF with the details attached).\nSlide 6: call to action "Book on WhatsApp".\nWarm tone, real photos of the team. I need it by Friday.',
    },
  },
  {
    id: 'video', category: 'multimedia', label: { es: 'Video', en: 'Video' },
    text: {
      es: 'Reel de 30 segundos para Instagram y TikTok que muestre cómo funciona la app en 3 pasos, para clientes que nunca la han usado.\nGancho en los primeros 3 segundos, subtítulos grandes, música animada y cierre con el logo y "Descárgala gratis".\nAdjunto grabaciones de pantalla y el logo. Para el lunes.',
      en: '30-second reel for Instagram and TikTok showing how the app works in 3 steps, for people who have never used it.\nHook in the first 3 seconds, big subtitles, upbeat music, and an ending with the logo and "Download it free".\nScreen recordings and logo attached. For Monday.',
    },
  },
  {
    id: 'logo', category: 'branding', label: { es: 'Logo', en: 'Logo' },
    text: {
      es: 'Logo para nuestra nueva línea de productos orgánicos "Raíz". Público: mamás de 28 a 40 años que compran saludable.\nQueremos que se sienta natural, cálido y confiable, no genérico. Debe funcionar pequeño en la etiqueta y en redes.\nAdjunto 3 referencias que nos gustan y el logo de la marca madre. Idealmente en 2 semanas.',
      en: 'Logo for our new organic product line "Raíz". Audience: moms aged 28 to 40 who shop healthy.\nIt should feel natural, warm and trustworthy, not generic. It must work small on the label and on social media.\n3 references we like and the parent brand logo attached. Ideally in 2 weeks.',
    },
  },
  {
    id: 'web', category: 'web', label: { es: 'Página web', en: 'Web page' },
    text: {
      es: 'Landing page para la campaña de Black Friday: 30 % de descuento en planes anuales. Objetivo: que compren o dejen su correo.\nSecciones: portada con la oferta, 3 beneficios, testimonios, preguntas frecuentes y botón de compra.\nAdjunto los textos y las fotos de producto. Debe estar publicada el 20 de noviembre.',
      en: 'Landing page for the Black Friday campaign: 30% off annual plans. Goal: purchases or email sign-ups.\nSections: hero with the offer, 3 benefits, testimonials, FAQ and a buy button.\nCopy and product photos attached. It must be live on November 20.',
    },
  },
  {
    id: 'deck', category: 'graphic', label: { es: 'Presentación', en: 'Presentation' },
    text: {
      es: 'Presentación comercial de 12 diapositivas para una reunión con inversionistas el martes.\nAdjunto la presentación anterior y el Excel con las cifras nuevas: hay que actualizar los números, aplicar nuestra marca y que cuente la historia en menos de 10 minutos.',
      en: '12-slide sales deck for an investor meeting on Tuesday.\nPrevious deck and the spreadsheet with the new numbers attached: update the figures, apply our brand and make it tell the story in under 10 minutes.',
    },
  },
];

/** The example for a taxonomy category, if there is one. */
export const exampleFor = (category: string) => ASK_EXAMPLES.find((e) => e.category === category);
