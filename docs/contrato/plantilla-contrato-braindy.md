# Plantilla: Contrato de prestación de servicios y Acuerdo de trabajo · Braindy

> v1 (2026-10-30). Revisado por abogado. Después de la revisión Nicolas pidió dos cambios, que conviene que el abogado vea: cierre por falta de contacto (décima tercera, literal e) y verificación del correo con enlace de un solo uso (décima octava).
> **La versión que usa la app está en `server/src/contracts/template.ts`** y los valores por defecto en `server/src/contracts/terms.ts`. Si se cambia una cláusula, se cambia allí y se sube la versión.
> Base: contrato Nicolas–Quimiolab 2026 (Drive, Quimiolab/Contratos), más las reglas del juego del onboarding.
> Todo lo que va entre {{llaves}} lo llena la app con los datos de la marca, la propuesta aceptada y el perfil del contratista.
> Los datos de identidad (cédulas, NIT, direcciones) nunca se guardan en este archivo ni en el código: viven en la app, por marca.

---

Entre los suscritos **{{contratista.nombre}}**, mayor de edad, identificado con {{contratista.tipoDoc}} No. {{contratista.doc}}, quien actúa en nombre propio como persona natural y en adelante se denomina **EL CONTRATISTA**; y **{{cliente.representante}}**, mayor de edad, identificado con {{cliente.tipoDoc}} No. {{cliente.doc}}, actuando como {{cliente.cargo}} de **{{cliente.razonSocial}}**, identificada con NIT {{cliente.nit}}, en adelante **EL CONTRATANTE**, acuerdan celebrar el presente contrato de prestación de servicios profesionales, que se rige por las siguientes cláusulas.

## PRIMERA. Objeto
EL CONTRATISTA presta a EL CONTRATANTE los servicios profesionales de {{objeto}}, con autonomía técnica y sin subordinación. Las obligaciones de EL CONTRATISTA son de resultado respecto de los entregables pactados.

## SEGUNDA. Alcance y entregables
Los entregables, cantidades y frecuencias son los del **Anexo 1 (Alcance)**, tomado de la propuesta aceptada {{propuesta.id}} del {{propuesta.fecha}}. Lo que no figure en el Anexo 1 está fuera del alcance.

**Parágrafo. Cambios de alcance.** Toda solicitud por fuera del Anexo 1 se cotiza como orden de cambio escrita (por la plataforma), con valor y plazo, y solo se ejecuta cuando EL CONTRATANTE la aprueba.

## TERCERA. Cronograma
El **Anexo 2 (Cronograma)** fija los entregables semana a semana según las etapas contratadas. Los plazos de EL CONTRATISTA corren solo mientras EL CONTRATANTE cumpla sus tiempos de respuesta (cláusula séptima). Cada día de retraso de EL CONTRATANTE corre el cronograma en igual número de días hábiles.

## CUARTA. Plazo
{{plazo.meses}} meses contados desde el {{plazo.inicio}}, prorrogables por periodos iguales mediante otrosí firmado en la plataforma.

## QUINTA. Valor y forma de pago
Valor total: {{valor.total}} ({{valor.letras}}). Se paga {{pago.frecuencia}} por {{pago.cuota}}, dentro de los primeros {{pago.diasHabiles}} días hábiles de cada periodo, contra cuenta de cobro o factura electrónica a nombre de {{cliente.razonSocial}}.

**Parágrafo primero. Mora.** Si un pago se retrasa: (a) desde el día 1 se causan intereses de mora a la tasa máxima legal certificada por la Superintendencia Financiera; (b) a los {{mora.diasPausa}} días calendario de mora, EL CONTRATISTA puede pausar la producción y el cronograma se corre lo mismo que dure la pausa; (c) a los {{mora.diasTerminacion}} días, EL CONTRATISTA puede terminar el contrato y cobrar lo causado. Reanudar después de una pausa toma hasta {{mora.diasReanudar}} días hábiles.

**Parágrafo segundo. Costos de terceros.** No están incluidos y los asume EL CONTRATANTE, previa aprobación: pauta en medios, licencias de software y tipografías, bancos de imágenes, dominios y hosting, impresión, envíos, locaciones y talento. {{terceros.incluidos}}

## SEXTA. Reglas de trabajo (Acuerdo de trabajo)
1. **Canal oficial.** Las solicitudes, entregas, comentarios y aprobaciones se hacen en la plataforma Braindy (app.braindy.co). WhatsApp y correo son para avisos; lo que no quede en la plataforma no cuenta como solicitud ni como aprobación.
2. **Horario de atención.** {{horario}} (hora de {{zonaHoraria}}). Lo recibido fuera de horario se atiende el siguiente día hábil. Festivos de {{festivos}} no son hábiles.
3. **Contacto y aprobadores.** EL CONTRATANTE designa un contacto principal: {{cliente.contacto}}. Solo las personas con permiso de aprobar en la plataforma pueden aprobar entregas: {{cliente.aprobadores}}.
4. **Revisiones.** Cada pieza incluye {{revisiones}} rondas de ajustes. El feedback de cada ronda se entrega consolidado, en un solo mensaje. Rondas adicionales, o cambios de concepto ya aprobado, se cotizan como orden de cambio.
5. **Flujo.** EL CONTRATISTA trabaja una solicitud a la vez por cada línea de servicio, en el orden de prioridad que defina EL CONTRATANTE en la plataforma.
6. **Urgencias.** Es urgente lo que se pide para entregar en menos del tiempo mínimo de la cláusula séptima. Se atiende según disponibilidad y con un recargo del {{urgencia.recargo}}.
7. **Reuniones.** Se prevén {{reuniones.frecuencia}} de hasta {{reuniones.duracion}}, más la reunión de arranque. Una reunión cancelada con menos de 24 horas de aviso cuenta como realizada.
8. **Capacitación.** EL CONTRATISTA capacita a {{capacitacion.personas}} personas del equipo de EL CONTRATANTE en el uso de la plataforma y entrega la estrategia de marca (Brand Brain) firmada en la etapa de arranque.

## SÉPTIMA. Tiempos de respuesta
| Quién | Qué | Tiempo |
|---|---|---|
| EL CONTRATISTA | Primera respuesta a una solicitud | {{sla.respuesta}} horas hábiles |
| EL CONTRATISTA | Entrega de una pieza estándar | mínimo {{sla.entregaMin}} horas hábiles desde la solicitud completa |
| EL CONTRATISTA | Ajustes de una ronda | {{sla.ajustes}} horas hábiles |
| EL CONTRATANTE | Entregar información y accesos pedidos | {{cliente.slaInfo}} días hábiles |
| EL CONTRATANTE | Aprobar o pedir ajustes a una entrega | {{cliente.slaAprobacion}} días hábiles |

**Consecuencias.** Si EL CONTRATANTE no responde en su plazo: (a) el cronograma se corre lo mismo que el retraso; (b) a los {{silencio.dias}} días hábiles sin respuesta, la entrega se entiende **aprobada** y se publica o archiva como tal; (c) si la falta de información impide avanzar más de {{silencio.diasPausa}} días hábiles, la solicitud se pausa sin que se descuente del alcance del periodo.

## OCTAVA. Obligaciones de EL CONTRATANTE
a) Pagar en los términos pactados. b) Entregar a tiempo la información, materiales y accesos de la **Lista de arranque** (Anexo 3). c) Usar la plataforma como canal oficial. d) Asistir a las reuniones agendadas. e) Revisar y aprobar en los plazos de la cláusula séptima. f) No modificar los diseños entregados sin informar a EL CONTRATISTA, para conservar la coherencia de marca. g) Autorizar a EL CONTRATISTA a mostrar los trabajos en su portafolio, salvo las piezas que EL CONTRATANTE marque como confidenciales. h) Asumir la veracidad y los permisos legales de los datos, imágenes y afirmaciones que entregue (registros sanitarios, claims, datos de terceros).

## NOVENA. Obligaciones de EL CONTRATISTA
a) Ejecutar los servicios con calidad y en los tiempos pactados. b) Guardar reserva sobre la información de EL CONTRATANTE. c) Cuidar las credenciales que reciba: se guardan cifradas, solo se revelan con registro y nunca se comparten. d) Responder por problemas de propiedad intelectual de lo que entregue como propio. e) Entregar un informe {{informe.frecuencia}} de resultados con las métricas de éxito acordadas (Anexo 1). f) Avisar con anticipación cualquier riesgo para el cronograma.

## DÉCIMA. Uso de inteligencia artificial
EL CONTRATISTA usa herramientas de inteligencia artificial (los Brains de Braindy) como apoyo en investigación, diseño, contenido, automatización y análisis, siempre bajo su dirección, revisión y firma. EL CONTRATISTA no ingresa datos personales sensibles ni secretos comerciales de EL CONTRATANTE en herramientas que los usen para entrenar modelos.

## DÉCIMA PRIMERA. Propiedad intelectual
Los derechos patrimoniales de los entregables **aprobados y pagados** se transfieren a EL CONTRATANTE para uso en {{territorio}}. EL CONTRATISTA conserva los derechos morales, sus herramientas, métodos, plantillas y conocimientos previos. Los diseños no aprobados no otorgan derechos a EL CONTRATANTE. Los recursos de terceros (tipografías, fotos de stock, software) se rigen por sus propias licencias.

## DÉCIMA SEGUNDA. Confidencialidad y datos personales
Las partes mantienen reservada la información del contrato y la que reciban de la otra, durante el contrato y {{confidencialidad.anios}} años después. EL CONTRATISTA trata los datos personales que reciba solo para ejecutar el contrato, conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos de Braindy.

## DÉCIMA TERCERA. Pausa, terminación y entrega final
a) Cualquiera de las partes puede terminar el contrato con {{terminacion.preaviso}} días de aviso escrito por la plataforma, pagando lo causado hasta esa fecha. b) Es causal de terminación inmediata el incumplimiento grave no subsanado en 10 días hábiles desde el aviso. c) Al terminar, EL CONTRATISTA entrega los archivos finales de lo aprobado y pagado, y EL CONTRATANTE conserva su acceso de lectura a la plataforma por 30 días para descargarlos. d) Dentro de los 60 días siguientes se firma el acta de liquidación con los paz y salvos. e) **Cierre por falta de contacto.** Si pasan {{cierre.meses}} meses sin contacto de EL CONTRATANTE, ni por la plataforma ni como respuesta a los avisos de EL CONTRATISTA, el proyecto se da por cerrado. Lo pagado no se devuelve, y EL CONTRATISTA entrega lo aprobado y pagado según el literal c).

## DÉCIMA CUARTA. Revisión del acuerdo
A los 30 días del inicio, las partes hacen una sesión corta para revisar el acuerdo y ajustar lo necesario mediante otrosí.

## DÉCIMA QUINTA. Independencia, no relación laboral y cesión
EL CONTRATISTA actúa con autonomía, sin subordinación ni relación laboral con EL CONTRATANTE, ni la tiene su equipo. EL CONTRATISTA puede apoyarse en colaboradores bajo su responsabilidad; la cesión total del contrato requiere autorización escrita de EL CONTRATANTE.

## DÉCIMA SEXTA. Solución de controversias
Las partes intentan un arreglo directo en 10 días hábiles. Si no lo logran, acuden a conciliación en el Centro de Arbitraje y Conciliación de la Cámara de Comercio de {{domicilio}} y, en su defecto, a un tribunal de arbitramento de un árbitro, que decide en derecho conforme a la Ley 1563 de 2012. Lo anterior no aplica al cobro de sumas de dinero por vía ejecutiva.

## DÉCIMA SÉPTIMA. Mérito ejecutivo y domicilio
Este contrato presta mérito ejecutivo. Domicilio contractual: {{domicilio}}. Notificaciones: EL CONTRATANTE en {{cliente.direccion}}, {{cliente.correo}}; EL CONTRATISTA en {{contratista.direccion}}, {{contratista.correo}}.

## DÉCIMA OCTAVA. Firma electrónica y perfeccionamiento
Las partes firman electrónicamente en la plataforma Braindy, conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012. La firma queda respaldada por: verificación del correo del firmante con un enlace de un solo uso, nombre completo, documento y cargo, firma manuscrita trazada en pantalla, fecha y hora, dirección IP, y la huella digital (hash SHA-256) del documento firmado. Cada parte recibe el PDF firmado por ambas, con su certificado de firma. Este contrato y sus anexos recogen la totalidad de lo acordado y reemplazan acuerdos previos.

**Anexos:** 1. Alcance y métricas de éxito. 2. Cronograma (Gantt por semana). 3. Lista de arranque (información y accesos). 4. Certificado de firma electrónica.

---

### Firmas
EL CONTRATANTE: {{firma.cliente}} · {{cliente.representante}} · {{cliente.cargo}} · {{firma.cliente.fecha}}
EL CONTRATISTA: {{firma.contratista}} · {{contratista.nombre}} · {{firma.contratista.fecha}}

---

## Qué se agregó frente al contrato de Quimiolab 2026
- Canal oficial (la plataforma), horario y zona horaria, contacto y aprobadores.
- Tiempos de respuesta de ambas partes en tabla, con consecuencias y **regla de silencio** (aprobación tácita).
- Número de rondas de revisión, feedback consolidado y cambios de concepto.
- Órdenes de cambio para lo que sale del alcance.
- Mora: intereses, pausa y terminación, y tiempo de reanudación.
- Costos de terceros explícitos.
- Urgencias con recargo.
- Reuniones (frecuencia, duración, cancelación) y capacitación.
- Cronograma Gantt como anexo, que se corre con los retrasos del cliente.
- Uso de IA con supervisión y sin entrenar modelos con sus datos.
- Propiedad intelectual condicionada al pago, y portafolio salvo piezas confidenciales.
- Datos personales (Ley 1581) y manejo cifrado de credenciales.
- Terminación con preaviso, entrega final de archivos y acceso de 30 días.
- Revisión del acuerdo a los 30 días.
- Cierre del proyecto a los 6 meses sin contacto del cliente, sin devolución de dinero (pedido por Nicolas el 2026-10-30).
- Firma electrónica (Ley 527) con certificado y PDF para ambas partes.
- Correcciones al contrato anterior: la obligación (k) decía "cuarenta y ocho (24) horas"; la numeración saltaba de la décima octava a la vigésima; "sin subordinación del CONTRANTE".

## Valores por defecto (decididos el 2026-10-30)
Contratista: Nicolas como persona natural. Firma por el cliente: solo el representante legal.
Revisiones 2 · respuesta 8 h hábiles · entrega mínima 48 h hábiles · ajustes 24 h hábiles · cliente: información 5 días hábiles, aprobación 3 · silencio (aprobación tácita) 5 días hábiles · pausa por falta de información 10 · mora: pausa 15 días, terminación 45, reanudación 3 días hábiles · urgencias +30 % · lunes a viernes 9:00–18:00, Bogotá (GMT-5), festivos de Colombia · confidencialidad 2 años · preaviso 30 días · cierre por falta de contacto 6 meses · una reunión semanal de 1 hora · capacitación a 2 personas · informe mensual · domicilio Bogotá D.C.
