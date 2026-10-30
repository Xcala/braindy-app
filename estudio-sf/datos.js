// Demo content of the studio. Edit freely: this is what each seat shows.
// state: 'working' | 'withClient' | 'toSign' | 'free'. NicoMarca shows 'Fuera de la oficina' by himself outside office hours (horario.js).
// now: a text, or a list that rotates every 3 minutes.
window.ESTUDIO_DATOS = {
  idioma: 'es',
  puestos: {
    researcher: { state: 'working', now: 'Investigación de mercado', queue: ['Análisis de competencia', 'Encuesta a clientes'] },
    marketer: { state: 'withClient', now: 'Plan de contenidos de noviembre', queue: ['Calendario de redes', 'Reporte de métricas'] },
    nico: {
      state: 'working',
      now: ['Ajustando el logo con Creator', 'Codificando el sitio con Builder', 'Conectando la API de pagos', 'Creando un conector MCP', 'Diseñando el empaque', 'Pidiendo ajustes al plan de contenidos', 'Dirigiendo a sus agentes de código'],
      queue: ['Firmar logo · versión 3', 'Revisar y ajustar plan de lanzamiento', 'Aprobar automatización de formularios'],
    },
    creator: { state: 'working', now: 'Sistema de logo', queue: ['Mockups de empaque', 'Motion del logo'] },
    builder: { state: 'working', now: 'Sitio web nuevo', queue: ['Automatización de formularios', 'Agente de atención'] },
  },
};
