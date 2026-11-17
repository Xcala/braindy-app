// Brand › Logos: the download menu of each logo and the «on dark, in color» column.
export const logoDlEn = {
  'logoDl.png': 'With the background',
  'logoDl.pngClear': 'No background',
  'logoDl.jpg': 'With the background',
  'logoDl.pdf': 'To print',
  'logoDl.svg': 'Vector, any size',
  'logoDl.failed': 'Could not download it. Try again.',
  'brand.ground.darkColor': 'On dark, in color',
  'brand.ground.darkWhite': 'On dark, white',
} as const;

export const logoDlEs: Record<keyof typeof logoDlEn, string> = {
  'logoDl.png': 'Con el fondo',
  'logoDl.pngClear': 'Sin fondo',
  'logoDl.jpg': 'Con el fondo',
  'logoDl.pdf': 'Para imprimir',
  'logoDl.svg': 'Vector, a cualquier tamaño',
  'logoDl.failed': 'No se pudo descargar. Intenta de nuevo.',
  'brand.ground.darkColor': 'Sobre oscuro, a color',
  'brand.ground.darkWhite': 'Sobre oscuro, en blanco',
};
