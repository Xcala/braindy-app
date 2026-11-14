# /studio: mapa de contenido (home actual → recorrido 3D)

Regla (Nicolas, 14 nov 2026): /studio narra **exactamente el mismo contenido** que la home de braindy.co, en el mismo orden, con los mismos textos (EN y ES desde `copy.json` y los JSON de datos, nunca copy nueva), el mismo manejo de títulos, las mismas animaciones de color, imágenes, pasos y videos. Solo cambia la forma: cámara sobre rieles en lugar de scroll de página.

## Lo que se hereda tal cual (sistema)
| Decisión de la home | Dónde vive | En /studio |
|---|---|---|
| Títulos con contraste w3 / w9 (light + bold en la palabra clave) | componentes | Mismo marcado `<span class="w3">…<span class="w9">` |
| Barrido de color de títulos y ledes (tinte → ink → azul profundo #1F3596 → azul #2F4DE0 → azul claro #9DB0FF) | `src/scripts/motion.ts` (FILL) | Mismo algoritmo, movido por el progreso del beat en vez de la posición en pantalla |
| Palabra rotatoria en azul (buyers. / people. / culture. / business.) con blur | `Hero.astro` | Igual, en el hero sobre la foto del estudio |
| Saludo en burbujas de chat (ciudad del visitante + "We're in Silicon Valley…") tipeado | `Hero.astro` | Igual, reemplaza el kicker sobre la foto |
| Mundo de color por sección (`data-tone`: sky, hielo, sun, researcher, marketer, creator, builder) | `World.astro` | Las mismas paletas pasan a ser las keyframes de atmósfera 3D (fondo, niebla, luz) |
| Símbolo Braindy que viaja con el scroll (orb) | `World.astro` | Orb 3D que acompaña la cámara con el color del tono activo |
| Br**ai**ns: solo "ai" en bold | `md()` | Igual |
| Contadores de proof, logos de marcas | `proof.json` | Igual, al pie del hero |
| Reduced motion | todo | /studio cae a la home normal (enlace) |

## Capítulos, en el orden de la home
| # | Sección home | Contenido exacto | Forma en 3D | Palabra 3D |
|---|---|---|---|---|
| 0 | **Hero** | kicker / burbujas, H1 "Let's make your brand matter to [buyers.…]", lede, CTA brief (WhatsApp) + See work, proof stats + logos | Foto del estudio SF (reemplaza el timelapse de la Bahía: la ventana ya muestra el Golden Gate). Noche del sitio = variante atardecer `f2`. Pill "Scroll to enter" | — |
| 1 | **Our work.** | 6 films (Milohas, Sanuteam, iPark, Cemex, Del Vecchio, Experian) con su título light/strong, cliente y headline; "More work" | Entramos a la pantalla de Nico → túnel → **OUR WORK** extruida → los films como pantallas 16:9 flotando que la cámara recorre; el título del case se llena con el barrido al centrarse | **OUR WORK** |
| 2 | **Voices** | 6 testimonios reales, dos filas en sentidos opuestos | Dos cintas de tarjetas que se cruzan en el espacio mientras la cámara pasa entre ellas | — |
| 3 | **Never one and done.** | Caobos desde 2014, una pieza por año con galería, año gigante pálido detrás, regla de meses | El corredor Caobos: la línea de tiempo como regla en el piso, una tarjeta por año colgando de su nodo, el año enorme al fondo | **NEVER ONE AND DONE** (o solo el año) |
| 4 | **Solutions.** | Sub + 4 tarjetas (Brand strategy & design / Marketing & content / Websites & apps / AI agents & automation) con verbos, frase de los Brains, "done", clip sol-1..4 | Cuatro estaciones, cada una con el color de su Brain (tonos researcher → marketer → creator → builder); el clip de cada solución en su pantalla | **SOLUTIONS** |
| 5 | **Manifesto** | "AI does the volume. / A human does the thinking." | Las dos líneas a tamaño pantalla, la cámara las atraviesa | Las dos líneas |
| 6 | **The Braintrust** | "Not an agency. Not a tool. A Braintrust." + ES "Un equipo de cerebros que hace tu marca", body, retrato recortado de Nicolas + fotos de Silicon Valley | Retrato de Nicolas en el centro, las fotos del Valley en abanico alrededor | **BRAINTRUST** |
| 7 | **App: Brand Brain** | "A brain for your brand. Better with every job." + loop de 4 pasos (You ask / It makes it / You approve / It learns) + promo film + capturas | El anillo de 4 pasos en 3D, un punto lo recorre y enciende cada paso; luego las 3 capturas con la promo al centro | — |
| 8 | **Ways in** | "Where are you starting?" + 3 caminos (Launch, Transform, Continuity) con includes y CTA | Tres tarjetas que se apilan frente a la cámara | — |
| 9 | **Next step** | "Let me build your Braintrust." + close_desc + contacto | Regreso al estudio al atardecer (`f2`), el texto sobre la escena | — |
| 10 | **Stories.** | Último post + 2, y las dos tarjetas next step | Pie de página en HTML normal tras el recorrido | — |

## Cambios respecto a F1 (gris)
- Primera palabra 3D: **OUR WORK** (no NICKMARK). RESEARCH sale; los Brains viven dentro de Solutions.
- Atmósfera: se abandonan NIGHT / PAPER / AMBER inventados; se usan los tonos de `World.astro`.
- Overlays: se borra toda la copy placeholder; todo sale de `copy(lang)` y de los JSON.
- i18n: /studio y /es/studio.

## Decisiones aprobadas (storyboard v3, 14 nov 2026)
- Palabras 3D: OUR WORK, SOLUTIONS, BRAINTRUST. Nunca llevan card: la palabra es el título.
- Navegación como el referente: nuestros elementos reales (films, piezas, clips, citas, fotos, capturas, Brains) sueltos, sin fondo ni marco, flotando en perspectiva a distintas profundidades; la cámara pasa entre ellos.
- Texto en medio del recorrido: card blanca con kicker y su línea. En las tomas del estudio (P0 y el cierre) el texto va directo sobre la foto, sin card.
- Never one and done: más corto (2014, 2018, 2022, 2026), sin card ni regla; las piezas vienen hacia la cámara. Pendiente: recortar las piezas sin su fondo desenfocado.
- Hecho en /studio (rama studio-3d de braindy-co): hero, túnel y capítulo 1 (Our work).
