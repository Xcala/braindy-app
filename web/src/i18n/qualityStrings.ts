/** Brand check before a delivery (admin). */
export const qualityEn = {
  'qc.title': 'Brand check', 'qc.passed': 'Passed', 'qc.failed': 'Did not pass', 'qc.critical': 'critical',
  'qc.sub': 'The team checked its own files against the brand before delivering (round {n}). It passes with 85+ and no critical item failed.',
};
export const qualityEs: Record<keyof typeof qualityEn, string> = {
  'qc.title': 'Revisión de marca', 'qc.passed': 'Pasó', 'qc.failed': 'No pasó', 'qc.critical': 'crítico',
  'qc.sub': 'El equipo revisó sus propios archivos contra la marca antes de entregar (ronda {n}). Pasa con 85 o más y sin fallar ningún punto crítico.',
};
