# braindy.co · Landing 3D "Step inside Nico's screen"

Plan del 14-nov-2026. Toma la arquitectura de aibuilders.vip/new: cámara sobre rieles controlada por el scroll, overlays HTML sincronizados, letras 3D que se atraviesan, cambios de atmósfera y cards. Encima pone el contenido de la braindy.co actual y la narrativa del 21-oct.

Lo que se reutiliza es la técnica. No se copian sus textos, sus assets ni su escena exacta.

---

## 1. La idea en una línea

Arrancamos en el estudio de SF con la mesa redonda, Nicolas y sus cuatro Brains. La cámara se acerca por detrás de Nico y entramos en la pantalla que él está mirando. Adentro está el mundo de Braindy, recorrido capítulo por capítulo con los colores de cada Brain. Al final salimos de la pantalla de vuelta al estudio, para el CTA.

Esto cuenta exactamente lo que hacemos: todo pasa por la pantalla de Nicolas. Por eso el inicio y el final ocurren en su mesa.

---

## 2. Decisiones técnicas

| Tema | Decisión | Por qué |
|---|---|---|
| Framework | Sigue siendo **Astro**, que es lo que ya usa braindy.co. El viaje 3D es una isla `client:only` en vanilla TS | Igual que aibuilders: Three.js sin React. No hace falta Next. El resto del sitio (blog, work, ES/EN) no se toca |
| 3D | **Three.js** (versión fija), GSAP + ScrollTrigger (ticker), **Lenis** | El mismo stack probado. Liviano y con control total |
| Prólogo (estudio → hombro de Nico → su pantalla) | **Secuencia de imágenes fotorreal scrubbeada por scroll** (técnica Apple), no 3D en tiempo real | El estudio es fotorreal y un estudio 3D procedural se vería más pobre. La secuencia mantiene el nivel de `studio-sf.jpg` |
| Paso al mundo 3D | Corte en el instante en que **la pantalla de Nico llena el cuadro**. Es una superficie plana y luminosa, así que el empalme no se nota | Es el mismo "cross" que usa aibuilders entre los mundos `room` y `uni` |
| Letras 3D | **Red Hat Display 900** convertida en build a geometría (opentype.js → JSON de shapes → `ExtrudeGeometry`) | No parseamos la fuente en el navegador como ellos (por eso les salía el error de GSUB). Así carga más rápido |
| Texto | Todo el copy son **overlays HTML reales**, con i18n ES/EN | SEO, accesibilidad y traducción. El canvas solo es decoración |
| Hosting | El mismo de braindy.co hoy | Sin cambios de DNS. Lanzamos con preview y Nicolas aprueba |

### Respaldos (obligatorios)
- `prefers-reduced-motion`, sin WebGL o un equipo muy débil (lo medimos en los primeros frames) → se muestra **la landing actual**, estática. Ya existe, así que es gratis.
- Pestaña oculta → el render se pausa.
- Tope de DPR de 1.5 (1.25 en mobile).

### Presupuesto de rendimiento
- JS de la isla 3D ≤ 250 KB gzip.
- Primera pantalla (hero) ≤ 1.5 MB. El resto carga por capítulos según el progreso del scroll.
- Secuencia del prólogo: 150 frames AVIF/WebP a 1600 px en desktop (≈ 6–8 MB, progresiva: primero 1 de cada 4 frames y luego se rellena) y a 900 px en mobile.
- Objetivo: 60 fps en un portátil de gama media y 45+ en un Android de gama media.

---

## 3. Storyboard (el recorrido completo)

Cada fila es un tramo de la cámara. El color es la atmósfera (fondo, niebla y luz) a la que transiciona.

### Prólogo · El estudio (secuencia fotorreal)
| # | Cámara | Overlay (EN, con ES en i18n) | Atmósfera |
|---|---|---|---|
| P0 | Plano amplio del estudio SF: Golden Gate, mesa redonda, los 4 Brains, Nicolas de espaldas. Loop vivo de 10 s (`studio-loop.mp4`) mientras no hay scroll | Eyebrow "From Silicon Valley, for Latino-owned brands" · H1 **"Let's make your brand matter to buyers / people / culture / business."** (la palabra rota como hoy) · CTA "Start the brief" · reloj en vivo SF / Bogotá sobre el letrero | Golden hour cálido |
| P1 | Dolly lento por detrás de Nicolas, hasta quedar sobre su hombro. Los Brains salen de cuadro a los lados | Pill: "Every brand we've made started at this table." | Cálido |
| P2 | Sin cortes desde P1: sobre el hombro de Nicolas, la cámara entra en **la pantalla que él está mirando** (la de Braindy, con la paleta y el check) y su pantalla se funde a negro con **"Step inside."** escrito en ella, en la perspectiva real de la pantalla (keyframe: `keyframes/p2-step-inside.jpg`). La cámara sigue hasta que la pantalla negra llena el cuadro. No hay laptop: es su pantalla de la escena | "Step inside." sobre su pantalla | Negro |

### Cruce · El túnel (desde aquí todo es 3D en tiempo real)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| T | Túnel de marcos (como el de ellos) que van rotando por los 4 colores de los Brains: ámbar → violeta → cian → azul | — | Casi negro con aros de color |

### Capítulo 1 · NICKMARK (el autor primero)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 1a | Letras 3D **"NICKMARK"**. La cámara se alinea con el hueco de la **"A"** y lo atraviesa | "01 · Made by NickMark" / "Every piece passes through Nicolas's hands." | Papel claro |
| 1b | Paneles laterales: fotos de Silicon Valley (Google, LinkedIn, Intel, Dreamforce, TechCrunch, Golden Gate, Moscone) como cards flotantes de vidrio | Card "Nicolas (NickMark) · Founder" + stats **200+ brands · 15 years · One method** | Claro |
| 1c | Manifiesto centrado | **"AI does the volume. A human does the thinking."** | Claro → oscuro |

### Capítulos 2–5 · El equipo (un capítulo por Brain, cada uno con su color)
Plantilla repetible, con la narrativa del 21-oct: **Nicolas es el sujeto y el Brain va "con"**.

| Cap | Letras 3D (hueco que se atraviesa) | Color | Overlay | Solución actual que lo ocupa |
|---|---|---|---|---|
| 2 | **RESEARCH** (la "A") | #F5B301 | "Nicolas, with the Researcher. Your market, known in 72 hours." | Brand strategy (parte) |
| 3 | **COMMUNICATE** (la "O") | #8B5CF6 | "Nicolas, with the Marketer. A content engine that sells." | Marketing & content |
| 4 | **CREATE** (la "A") | #06B6D4 | "Nicolas, with the Creator. A brand people remember." | Brand design |
| 5 | **BUILD** (la "D") | #2A7FFF | "Nicolas, with the Builder. Sites, apps and agents that work while you sleep." | Websites & apps · AI agents |

En cada capítulo:
- La atmósfera toma el color del Brain: niebla tintada, grilla del piso con su color (como la grilla Tron de "BUILD") y luz de acento.
- El **avatar 3D del Brain** aparece como billboard con su loop de 5 s, como indicador de estado. Nunca como autor.
- Close-up de su puesto: los `closeups/cu-res|mkt|cre|bui.mp4` ya existen y entran como textura de video en una card grande.
- 1–2 cards laterales con lo que hace (el texto de "Solutions" de hoy, reescrito con la narrativa nueva).

### Capítulo 6 · OUR WORK (la hélice)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 6a | La cámara recorre una **hélice de pantallas**: Milohas, Sanuteam, iPark, Cemex, Del Vecchio, Experian y más trabajos | "Our work." / **"200+ brands. Every one signed."** | Oscuro, las pantallas brillan |
| 6b | Se detiene frente a 3 casos (left/right alternado), con video "Sound on" | Card de cada caso: nombre + una línea ("From ticket machine to mobility story") + botón "Watch" (modal) | Oscuro |

### Capítulo 7 · NEVER ONE AND DONE (corredor del tiempo)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 7 | Pasillo de **2014 → 2026**: los años como números 3D en el piso y, a los lados, las piezas de Gimnasio Los Caobos (`/img/caobos-years/*`, ya existen) | "Never one and done." + la historia de Caobos. Un hito por año, que aparece al pasar | Pasa de oscuro a claro a medida que avanzan los años |

### Capítulo 8 · CLIENT VOICES
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 8 | Las citas como cards de vidrio flotando en profundidad. La cámara pasa entre ellas | "In their words." · Cemex, Experian, Del Vecchio, Level, Quimiolab, Marco Polo | Claro |

### Capítulo 9 · BRAND BRAIN (la app)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 9 | Un cerebro/esfera de partículas al centro. Los 4 colores giran a su alrededor y van llegando las capturas de la app (`app_brain.webp`, `app_whatsapp_*.webp`) | **"A brain for your brand. Better with every job."** + 4 pasos que se encienden en orden: You ask → It makes it (Nick leads) → You approve → It learns | Oscuro con acentos |

### Capítulo 10 · WAYS IN (pilares)
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| 10 | Tres pilares/tarjetas 3D (como sus p1–p3): **Launch · Transform · Continuity**. La cámara va de uno a otro | Nombre, para quién es y CTA de cada uno | Oscuro → claro |

### Final · De vuelta al estudio
| # | Cámara | Overlay | Atmósfera |
|---|---|---|---|
| F1 | Contra-túnel: **salimos de la pantalla de Nico** (la secuencia del prólogo, en reversa y recortada) | — | Azul → cálido |
| F2 | Plano amplio del estudio, ahora con luz de atardecer | **"Let me build your Braintrust."** · Talk to Nick / Send the brief / WhatsApp · "Made by NickMark. Powered by his Brains." | Cálido |

Después del viaje, en DOM normal: Ways in (detalle), Stories (blog), Contact y footer, tal como están hoy.

### Navegación fija
- Header con el theme light/dark sincronizado con la atmósfera (como el `data-theme` de ellos).
- Barra de capítulos abajo: **Nick · Team · Work · Brain · Start**, con su progreso y salto directo.
- Botón "Skip the tour" → salta a las secciones normales. Importante para quien vuelve al sitio.

---

## 4. Arquitectura del código

```
src/
  islands/journey/
    Journey.ts          // stops → tiempos normalizados, p(id, offset), beats(n)
    CameraRail.ts       // CatmullRom centripetal para pos/look, easing por tramo, fov, up
    atmosphere.ts       // keyframes de bg/fog/hemi/key/env por stop
    stops.ts            // EL GUION: todos los stops (desktop y mobile)
    beats.ts            // overlays: {id, from, to, place, theme, card}
    helpers/
      panelShot.ts      // "mirar un panel" (equivale a su op())
      throughWord.ts    // "atravesar una palabra" (equivale a su om(): 6 stops)
    worlds/
      prologue.ts       // secuencia de imágenes sobre canvas 2D/plane
      tunnel.ts
      word3d.ts         // letras extruidas desde JSON de glifos
      brainChapter.ts   // plantilla de capítulo por Brain
      helix.ts
      timeline.ts       // corredor Caobos
      brandBrain.ts
      pillars.ts
    ui/
      Overlays.astro    // HTML real, i18n
      Chapters.ts
      Loader.ts
    debug/
      Scrubber.ts       // ?debug: slider de progreso + id del stop actual
      CameraEditor.ts   // ?debug: mover la cámara con teclado/mouse y copiar el stop en JSON
scripts/
  build-glyphs.ts       // Red Hat Display 900 → shapes JSON
  build-sequence.ts     // video → frames AVIF/WebP en 2 tamaños
```

Reglas del repo: archivos de menos de ~400 líneas, guion separado del motor y las coordenadas en datos, no mezcladas con lógica.

La pieza que más tiempo ahorra es el **editor de cámara de debug**. Componer ~80 stops a mano sin él es lento. Con él, Nicolas puede ajustar un plano y pasarme el JSON.

---

## 5. Assets a producir

| Asset | Cómo | Estado |
|---|---|---|
| Plano amplio del estudio + loop | `studio-sf.jpg` / `studio-loop.mp4` | **Existen** |
| Close-ups por puesto (Brains + Nico) | `closeups/cu-*.mp4` | **Existen** |
| **Secuencia del prólogo** (estudio → hombro de Nico → su pantalla llenando el cuadro) | Higgsfield/Kling con 3 keyframes: (1) studio-sf, (2) sobre el hombro, (3) su pantalla llenando el cuadro. Cámara controlada y 2 clips empalmados por un frame común | **Nuevo**. Es el asset crítico |
| Contenido de la pantalla de Nico en alta | La UI de Braindy que se ve en su pantalla, rehecha en alta. Es el último frame del video y el primero del túnel | Nuevo (fácil) |
| Mapa de profundidad del estudio (parallax en P0 con el mouse) | Magnific `images_depth_map` | Nuevo (opcional) |
| Glifos 3D Red Hat Display 900 | Script de build | Nuevo |
| Avatares 3D de los Brains con loop | Ya están en las URLs de assets de Brains | **Existen** |
| Casos: posters + videos cortos comprimidos | De braindy.co actual | **Existen**, hay que recomprimir |
| Caobos 2014–2026 | `/img/caobos-years/*` | **Existen** |
| Fotos de Silicon Valley | De braindy.co actual | **Existen** |

Reglas de imagen: Nicolas siempre de espaldas o de perfil (como en `studio-sf`) y reconocible si aparece. **Sin productos Apple**. No se agrega ninguna laptop: entramos en la pantalla que ya está en la escena.

---

## 6. Fases

Cada fase termina con un preview desplegado y el visto bueno de Nicolas antes de seguir.

| Fase | Entrega | Cómo se verifica |
|---|---|---|
| **F0 · Guion y copy** | Este storyboard aprobado. Copy final ES/EN con la narrativa del 21-oct. Lista de casos para la hélice | Nicolas aprueba |
| **F1 · Motor en gris** | Journey + CameraRail + atmósfera + overlays + Lenis + scrubber/editor de debug. Escenas con cubos grises: prólogo como placeholder, túnel, 1 palabra atravesable y 1 capítulo de Brain | Scroll fluido de punta a punta, overlays sincronizados, 60 fps |
| **F2 · Prólogo** | Secuencia fotorreal producida, scrub por scroll, empalme con el túnel y salida en reversa al final | El empalme no se nota en desktop ni en mobile |
| **F3 · Capítulos** | NICKMARK + los 4 Brains con letras 3D, colores, avatares y close-ups | Revisión visual capítulo por capítulo |
| **F4 · Prueba** | Hélice de trabajos, corredor Caobos, voces | Videos con carga diferida, sin tirones |
| **F5 · Cierre** | Brand Brain, Ways in, final en el estudio, secciones DOM | Recorrido completo |
| **F6 · Calidad** | Stops y tamaños para mobile, respaldos, a11y (foco, `inert`, reduced motion), SEO (copy en HTML, OG image), i18n y presupuesto de peso | Lighthouse, prueba en un Android real, lectores de pantalla |
| **F7 · Lanzamiento** | Preview final y el cambio en braindy.co **solo con el OK de Nicolas** | Analytics de scroll (hasta qué capítulo llega la gente) y clics en el CTA |

---

## 7. Riesgos y cómo se cubren

1. **Consistencia de la secuencia IA del prólogo** (Nico, la mesa y la luz deben verse iguales en todos los clips) → keyframes generados primero como stills aprobados y video solo entre stills aprobados. Si un tramo falla, ese tramo se hace en 3D.
2. **Peso y rendimiento en mobile** → carga por capítulos, frames a 900 px, letras con menos segmentos y respaldo estático.
3. **Recorrido demasiado largo** (el de ellos mide ~33 pantallas) → apuntar a unas 22 pantallas y ofrecer "Skip the tour". Medirlo con analytics.
4. **SEO** → todo el copy queda en el HTML desde el primer render y la landing actual sigue siendo el respaldo.
5. **Narrativa** → la braindy.co de hoy todavía dice "Nicolas orchestrates. The Brains execute." La nueva usa "Made by NickMark. Powered by his Brains." Hay que confirmarlo antes de F0.

---

## 8. Pendiente de Nicolas
- [ ] Aprobar el storyboard (orden de capítulos, sobre todo NICKMARK primero y los 4 Brains como capítulos).
- [ ] Confirmar la frase principal de la landing nueva (EN/ES).
- [ ] Elegir los casos que van en la hélice y los 3 que se destacan.
- [ ] Decidir si el viaje reemplaza la home o vive primero en una ruta de preview (`/studio`).
- [ ] Dar acceso al repo de braindy.co en esta sesión de Claude Code.
