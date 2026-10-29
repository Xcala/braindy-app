// Demo content of the studio. Edit freely: this is what each seat shows.
// state: 'working' | 'withClient' | 'toSign' | 'free'
window.ESTUDIO_DATOS = {
  idioma: 'es',
  puestos: {
    researcher: { state: 'working', now: 'Investigación de mercado', queue: ['Análisis de competencia', 'Encuesta a clientes'] },
    marketer: { state: 'withClient', now: 'Plan de contenidos de noviembre', queue: ['Calendario de redes', 'Reporte de métricas'] },
    nico: { state: 'toSign', now: '', queue: ['Logo · versión 3', 'Plan de lanzamiento'] },
    creator: { state: 'working', now: 'Sistema de logo', queue: ['Mockups de empaque', 'Motion del logo'] },
    builder: { state: 'working', now: 'Sitio web nuevo', queue: ['Automatización de formularios', 'Agente de atención'] },
  },
};
