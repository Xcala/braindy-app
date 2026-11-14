# Brief · Estudio SF rehecho para la cámara

Brief del 14-nov-2026 para recrear la escena del estudio antes de generarla en Higgsfield y Magnific. La versión visual (planta, encuadres y revisión) está en el artifact "Studio SF Shot Brief".

## La regla del set
Todo va de frente y paralelo a la cámara (perspectiva de un punto). La cámara recorre P0 → P1 → P2 solo trasladándose, adelante y un poco a la derecha, siempre mirando al ventanal. Así la pantalla de Nico, el reloj y el letrero son rectángulos en todos los frames, y su contenido (UI de Braindy, hora en vivo, logo, "Step inside.") se pone encima en HTML. La IA no lo pinta.

## Planta
- Ventanal centrado al fondo, con el Golden Gate. Reloj y placa del letrero a la derecha del ventanal, de frente. Repisas a la izquierda.
- Mesa redonda de mármol blanco al centro.
- Puestos: Builder en la cabecera; Researcher al fondo a la izquierda y Marketer al fondo a la derecha, los tres de frente. Creator adelante a la izquierda y Nicolas adelante a la derecha, los dos de espaldas.
- El monitor de 27" de Nico va bien apoyado sobre la mesa, a unos 25 cm del borde, de frente a la cámara y a la derecha del eje, sin tapar al Builder. El teclado queda entre el monitor y Nico.

## Encuadres
| Keyframe | Lente / altura | Composición |
|---|---|---|
| P0 · Amplio | 35 mm · 1.30 m | Ventanal centrado. Monitor ~18% del ancho, de frente. Horizonte al 44%. El recorte 9:16 se corre a la derecha para incluir al Builder, el monitor y a Nico |
| P1 · Sobre el hombro | 50 mm · altura de su cabeza | Monitor al centro-izquierda, ~44% del ancho. Nuca y hombro de Nico en el tercio derecho, manos en el teclado. El fondo desenfocado |
| P2 · Pantalla | — | La pantalla llena ~90% del ancho, con un borde fino del monitor. Asoma el hombro abajo a la derecha |

## Especificaciones
- 16:9, mínimo 3840 × 2160 (6K si se puede).
- Golden hour, ~40 min antes del atardecer. Sin HDR, con grano leve. Acabado de referencia: `docs/el-estudio/closeups/cu-nico.mp4`.
- Nicolas de espaldas, con camisa camel de gamuza (igual que cu-nico), sin cara.
- Monitor de escritorio fotorrealista de 27", plano (no curvo), 16:9, negro mate, pantalla mate antirreflejo, bordes finos en los cuatro lados, base delgada, sin logos ni Apple (referencia: Samsung ViewFinity S8 de 27"). Apoyado sobre la mesa a ~25 cm del borde. El borde de arriba queda a la altura de los ojos de Nico y el de abajo ~12 cm sobre la mesa. Es 16:9 para que, cuando la pantalla llena el cuadro en P2, coincida exacto con el formato de la web. Teclado y mouse negros. Taza blanca lisa.
- Los Brains fieles a sus renders 3D, con pantallas holográficas de su color.
- Lo que va encima después: el contenido de la pantalla, la hora del reloj, el logo del letrero y el texto de la taza.
- Reloj en vivo: a la izquierda siempre San Francisco; a la derecha, la ciudad de quien visita, según la zona horaria de su navegador (sin pedir permisos). Si la visita es desde SF, la derecha muestra Bogotá.

## Prompts

### A · Escena maestra (P0) · Higgsfield
```
Photorealistic interior photograph of a modern brand studio in San Francisco at golden hour, about 40 minutes before sunset. One-point perspective, camera at 1.3 m height, 35 mm lens, looking straight at a floor-to-ceiling window centered on the back wall that frames the Golden Gate Bridge and the bay. Vertical lines perfectly straight, horizon at 44% of the frame height.

A round white marble table with grey veins stands in the middle of the room. Five seats around it:
- Near-right seat: a man seen from behind (dark short hair, short beard, camel suede overshirt), hands on a black keyboard. In front of him, standing firmly on the table about 25 cm in from the edge, a photorealistic 27-inch flat (not curved) 16:9 desktop monitor, matte black, matte anti-glare screen, thin bezels on all four sides, slim black stand, no logos, facing the camera perfectly frontally, its edges parallel to the frame. The top edge of the screen is at his eye level and the bottom edge about 12 cm above the table. The screen shows a clean, bright, white app interface. A plain white espresso cup on a saucer to his left.
- Near-left seat: a cyan plush furry character seen from behind.
- Far-left seat: an amber plush furry character holding a magnifying glass, facing the camera.
- Head of the table, far center: a blue plush furry character, facing the camera.
- Far-right seat: a violet plush furry character, facing the camera.
The four characters match the attached 3D renders exactly: round sun-like heads with soft spikes and wide smiles, soft believable fur. Each one works on a translucent holographic screen glowing in its own color.

Back wall, right of the window, facing the camera: a dark digital wall clock and, below it, a plain backlit sign plate. Left of the window: warm walnut shelves with plants and books. The view through the window looks like a real photograph: slight atmospheric haze, the bridge a little softer than the table because focus is on the interior, the window slightly brighter than the room. Warm low ceiling lights, soft natural window light, gentle contrast, realistic materials, subtle film grain. Editorial architecture photography, not CGI.
```

### B · Sobre el hombro (P1)
```
Same scene, same lighting and time of day as the reference image. The camera has moved forward and slightly right, to just behind the man's right shoulder at his head height, 50 mm lens, still looking straight at the window (no rotation). The black monitor sits center-left, perfectly frontal, about 44% of the frame width, showing the same bright white app interface. The back of his head and his right shoulder fill the right third of the frame, camel suede overshirt, his hands visible on the keyboard. Behind the monitor: the marble table, the violet character and the window, softly out of focus. Photorealistic, natural contrast, film grain.
```

### C · Pantalla llena (P2)
```
Same scene and lighting. The camera is now very close behind the man's shoulder, looking straight at the monitor: the screen fills 90% of the frame width, perfectly frontal and rectangular, a thin black bezel visible on all four sides, the same bright white app interface on screen. Only a small part of his camel suede shoulder is visible at the lower right corner. Photorealistic, sharp screen edges, natural light.
```

### Negativo
```
Apple products, apple logo, MacBook, iMac, laptop, curved monitor, ultrawide monitor, glossy screen reflections, tilted or angled monitor, readable text, letters, logos, garbled writing, HDR look, oversharpening, halos, plastic skin, CGI render look, fisheye, wide-angle distortion, converging verticals, the man's face, extra characters, extra people, cluttered table, painterly texture, oil painting look, smeared water, posterization, banding, crunchy detail, halos around edges, pink haze, hyper-detailed background.
```

### D · Variante atardecer (final F2) · Magnific relight
```
Relight the same scene to dusk, about 10 minutes after sunset: deep orange and pink sky over the Golden Gate, the bridge lights just turning on, warmer interior lamps, the holographic screens glowing a little stronger. Keep every object, position and composition identical.
```

## Orden de producción
1. Maestra P0 en Higgsfield: prompt A con referencias (fotos de Nicolas, renders de los Brains, `braindy-background-SF-big.jpg`, studio-sf.jpg y un fotograma de cu-nico), con 3–4 variantes. Nicolas elige.
2. Magnific: una sola pasada en modo Precision (`ultra-photo` o `ultra-sublime` a 2x, nitidez 5–7, grano 8–10, sin HDR), en PNG. Nunca el modo Creative: es el que deja la textura de óleo de la ventana actual.
3. Keyframes P1 y P2 desde la maestra (prompts B y C) y escalarlos igual.
4. Variante atardecer con Magnific relight (prompt D).
5. Kling 3.0: dos clips con primer y último frame fijos, P0 → P1 y P1 → P2.
6. Seguir los rectángulos de la pantalla, el reloj y el letrero en cada frame y montar el contenido en vivo.

## Decisiones (14-nov-2026)
- Los Brains con pantallas holográficas de su color; Nicolas con un computador real.
- Los Brains de fieltro, sin ojos ni nariz (la misma versión de los close-ups). La cara es solo la sonrisa negra y la cabeza tiene puntas suaves como un sol.
- Golden hour al abrir y atardecer al cerrar.
- La taza lleva "Café de Colombia", agregado en post.
- La vista de la ventana es una foto real de stock del Golden Gate (no se graba una toma propia).

## La ventana y la textura
La ventana actual se ve pintada al óleo: manchas en el agua y los cerros, colores en escalones, halos y un velo rosado. Viene de generar pequeño y escalar en modo creativo. En la escena nueva:
- Generar grande desde el inicio.
- Escalar una sola vez en modo Precision, nunca Creative, sin HDR y trabajando en PNG.
- Pedir la vista como en una foto real de interiores: algo de bruma, el puente un poco más suave que la mesa y la ventana algo más luminosa.
- Usar una foto real de la vista como referencia.
- Opción máxima: reemplazar la vista por una foto o un video real en 4K (grabado por Nicolas con trípode). La ventana está de frente, así que es posible; requiere recortar a los Brains que la tapan.

## Cómo grabar la vista real
- Dónde: Baker Beach o el mirador de Lands End, mirando al norte, con el puente de lado y Marin detrás.
- Cuándo: golden hour (~40 min antes del atardecer). Si se puede, otra toma 10 min después del atardecer, para el cierre.
- Equipo: Samsung en trípode (obligatorio).
- Encuadre: horizontal 16:9, teléfono nivelado (grilla y nivel activos), horizonte al centro, puente completo y aire arriba y abajo. Lente 1x, sin zoom digital.
- Ajustes: video 4K 30 fps, exposición y foco bloqueados sobre el puente, sin estabilización por software y sin HDR.
- Qué grabar: una toma fija de 30 s y una foto RAW (modo Pro) del mismo encuadre como plan B.
- La perspectiva no tiene que coincidir: a ~2 km, la vista se mueve unos 3 px en todo el recorrido.

## Contenido de la pantalla de Nico (14-nov-2026)
No lleva la UI de Braindy: en la imagen base la pantalla va completamente en negro y sin elementos (`keyframes/p0-escena-maestra-*.jpg`). Encima se muestra en vivo el mismo túnel 3D de marcos luminosos, en los colores de los Brains, con el que empieza el mundo de Braindy. El zoom endereza la pantalla y entra en el túnel sin cortes, con "Step inside." encima. Prototipo: `scripts/zoom-to-screen.py` y `keyframes/zoom-p0-p2.mp4`.

## Revisión de la escena maestra (14-nov-2026)
Archivo: `keyframes/p0-escena-maestra-5504.jpg` (web: `-3840.jpg`).

Cumple:
- Monitor de 27" negro, sin logo y sin Apple. Está casi de frente; el zoom termina de enderezarlo. La pantalla va en negro, lista para el túnel.
- Nicolas de espaldas, con camisa camel y sin cara (asoma un poco la oreja).
- Los cuatro Brains de fieltro, sin ojos, con sus colores y en sus puestos.
- Ventana con una foto real del Golden Gate ("Beautiful sunset view of the Golden Gate Bridge", Freepik/Magnific), llevada a golden hour. Es definitiva (decisión de Nicolas, 14-nov).
- Sin letras inventadas: el reloj está en blanco y la taza es lisa.
- 5504 px de ancho.
- Acabado fotográfico: HDR bajado (menos contraste local y saturación, altas luces suaves) y profundidad de campo real a partir de un mapa de profundidad (`scripts/photo-finish.py`). El piso perdió los rayones pintados.

Se aparta del brief (por haber elegido la variante A):
- El ventanal no está centrado y la cámara no está en perspectiva de un punto. No afecta el recorrido P0 → P2.
- En mobile (9:16), el recorte que mejor funciona va centrado entre el monitor y Nico; el Builder queda en el borde.
- Debajo del reloj hay un círculo y no una placa. Ahí va el logo de Braindy (es un sol circular), montado en post.

Hecho después de la revisión:
- Logo de Braindy (SVG oficial) retroiluminado en el círculo bajo el reloj, con el mismo desenfoque de la pared.
- "CAFÉ DE COLOMBIA" en la taza, curvado a su forma y con su sombra.
- Variante atardecer (`keyframes/f2-atardecer-*.jpg`, `scripts/dusk-variant.py`): la misma imagen que P0, con la sala más oscura y cálida, los hologramas y el logo brillando y la vista en hora azul. No se hizo con Magnific relight porque entrega 2K y puede mover detalles; el cierre es la reversa de P0 y tiene que coincidir pixel a pixel.
- Loop de 10 s: Kling 3.0 en Magnific, 1080p, con el primer y el último frame iguales a P0.

Pendiente: nada en la escena. Antes de publicar, confirmar en la cuenta de Magnific/Freepik que la licencia de la foto del Golden Gate no exige atribución.
