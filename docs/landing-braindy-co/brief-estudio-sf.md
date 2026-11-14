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

Back wall, right of the window, facing the camera: a dark digital wall clock and, below it, a plain backlit sign plate. Left of the window: warm walnut shelves with plants and books. Warm low ceiling lights, soft natural window light, gentle contrast, realistic materials, subtle film grain. Editorial architecture photography, not CGI.
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
Apple products, apple logo, MacBook, iMac, laptop, curved monitor, ultrawide monitor, glossy screen reflections, tilted or angled monitor, readable text, letters, logos, garbled writing, HDR look, oversharpening, halos, plastic skin, CGI render look, fisheye, wide-angle distortion, converging verticals, the man's face, extra characters, extra people, cluttered table.
```

### D · Variante atardecer (final F2) · Magnific relight
```
Relight the same scene to dusk, about 10 minutes after sunset: deep orange and pink sky over the Golden Gate, the bridge lights just turning on, warmer interior lamps, the holographic screens glowing a little stronger. Keep every object, position and composition identical.
```

## Orden de producción
1. Maestra P0 en Higgsfield: prompt A con referencias (fotos de Nicolas, renders de los Brains, `braindy-background-SF-big.jpg`, studio-sf.jpg y un fotograma de cu-nico), con 3–4 variantes. Nicolas elige.
2. Magnific: escalar a 4K/6K y retocar el pelaje y el HDR.
3. Keyframes P1 y P2 desde la maestra (prompts B y C) y escalarlos igual.
4. Variante atardecer con Magnific relight (prompt D).
5. Kling 3.0: dos clips con primer y último frame fijos, P0 → P1 y P1 → P2.
6. Seguir los rectángulos de la pantalla, el reloj y el letrero en cada frame y montar el contenido en vivo.

## Para decidir antes de generar
- ¿Los Brains siguen con pantallas holográficas? Recomendado: sí. Nicolas trabaja con un computador real y sus Brains con hologramas.
- ¿Golden hour al abrir y atardecer al cerrar? Recomendado: sí.
- ¿La taza lleva "Café de Colombia"? Se puede agregar en post.
