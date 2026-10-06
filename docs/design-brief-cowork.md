Necesito el diseño visual de la nueva plataforma de Braindy (app.braindy.co). Usa el sistema de marca de Braindy que tienes en este proyecto (brand book, `marca/agentes-braindy-v2.md` y `marca/brain-agents-assets.md`). Todo debe quedar en marca. No necesito código de producción: necesito pantallas de referencia y un sistema de diseño cerrado que luego se construye en código.

## Qué es la plataforma
Un solo lugar donde vive la marca de cada cliente: ahí ven y descargan todos sus archivos, piden trabajo, aprueban entregas y encuentran todo lo que Braindy hizo para ellos. Reemplaza tres apps viejas (brief, brands y orbit). La idea central: "Nicolas orchestrates. The Brains execute."

Usuarios:
- **Nicolas (admin)**: ve todas las marcas, propuestas y aprobaciones.
- **Client owner**: ve su marca, pide, aprueba e invita a su equipo.
- **Client member**: ve, pide y comenta.

## Reglas de marca (obligatorias)
- Tipografía **Red Hat Display**, con contraste 300 / 900 y **sin itálicas**.
- El "ai" de Br**ai**ndy y Br**ai**n va en 900, en minúscula, **solo** en titulares, lockups y firmas.
- Colores de los 4 Brain Agents (identidad y estado, no decoración):
  - Researcher #F5B301 (Research)
  - Marketer #8B5CF6 (Communicate)
  - Creator #06B6D4 (Create)
  - Builder #2A7FFF (Build)
- Los avatares de los Brains son **indicadores de estado y firmas**, no chats ni mascotas. Estados: idle (quieto), working (loop), needs approval (resaltado).
- Prohibido usar los nombres Orbit, Artemis, Fleet, Galaxy o Mission, y cualquier metáfora espacial. Nada de métricas gamificadas (puntos, niveles, rachas).
- El copy de la UI va en **inglés**, con un selector **ES/EN** visible. Diseña al menos una pantalla en las dos versiones para comprobar que el español (más largo) cabe.
- Accesible: contraste AA, foco visible, áreas táctiles de 44 px como mínimo.

## Pantallas (desktop 1440 y mobile 390 para cada una)
1. **Login**: "Continue with Google" más email y contraseña. Incluye el estado "Your account is not connected to a brand yet".
2. **App shell**: wordmark, pestañas **My brand · My assets · Ask for something · My requests · Accesses**, y **Team** solo para el admin. Selector de marca para quien tiene varias o pertenece a un **grupo**: por ejemplo Grupo Berrío contiene a Grupo IBMT, que a su vez contiene iPark, EquiPark y Park Media y Plaza. Selector ES/EN y menú de usuario.
3. **My brand**: logos con descarga, colores (hex y Pantone, con botón de copiar), tipografías con sus roles, voz de marca, notas de estrategia y ejemplos aprobados. Si la marca es un grupo, sus marcas hijas.
4. **My assets** (la más importante): un explorador de archivos que reproduce las carpetas del Drive del cliente, pero dentro de la plataforma.
   - Vista en cuadrícula y en lista, migas de pan, búsqueda y filtro por tipo (imagen, video, PDF, diseño).
   - Vista previa grande de imagen, PDF y video, y **descarga** de un archivo o de una carpeta completa.
   - Botón **Upload** hacia la carpeta "Uploads" del cliente, con progreso de subida.
   - Tarjetas especiales para **LogoDecks** y **MarketMaps** (documentos HTML con link público).
   - Estados vacío, cargando y error.
5. **Brands (admin)**: lista de todas las marcas (55 hoy) con jerarquía de grupos, búsqueda y filtros, y un **toggle Active / Archived** claro en cada marca, con confirmación.
6. **Proposals (admin)**: módulo aparte de los clientes.
   - Lista con estados **Draft · Sent · Won · Lost**.
   - Detalle de cada propuesta con sus archivos.
   - Panel **Send** con tres canales: link de la plataforma, correo (sale del Gmail de Nicolas) y WhatsApp (abre el chat con el mensaje listo).
   - **Línea de tiempo de tracking** por envío, por ejemplo: "Sent to juan@x.com by email · Oct 6 10:02 → Opened 14:30 (4 h later) · 6 min viewing → Opened again Oct 7".
   - Botón **"Won → Create client"**.
7. **Proposal (vista pública)**: lo que ve el prospecto al abrir el link, sin cuenta. Debe ser muy premium y en marca, con los datos de contacto y la firma de Braindy.

## Componentes que necesito en una hoja de sistema
Botones (primario, secundario, fantasma, destructivo), inputs, pestañas, selector de marca, tarjeta de marca, tile de archivo, visor de archivos, chips de estado (de solicitudes: In production · To approve · Approved · Published; de propuestas; Active/Archived), línea de tiempo, barra de subida, toasts, modal de confirmación, empty states y avatar de Brain en sus 3 estados.

## Entregables
1. Las 7 pantallas en desktop y mobile, con sus estados.
2. La hoja de componentes.
3. **Tokens** listos para pasar a código: colores (hex, con nombre y uso), escala tipográfica (tamaño, peso, interlineado), espaciado, radios, sombras y breakpoints.
4. Una nota corta con las decisiones de diseño y su porqué.

Usa datos realistas de los clientes de Braindy: Quimiolab, Grupo Berrío, Restaurantes (Puerta del Sol, Hacienda Parrilla Bar, Casa en el Aire), Marco Polo Education. No inventes métricas ni testimonios.
