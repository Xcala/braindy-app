/** Strings for UX step 3 (components): brand cards on phones, Today, My apps card, search with no results, board, proposal. */
export const uxCompEn = {
  'bcard.groupOf': 'Group · {n} brands',
  'bcard.groupOne': 'Group · 1 brand',
  'lcard.openAndAsk': 'Open and request changes',
} as const;

export const uxCompEs: Record<keyof typeof uxCompEn, string> = {
  'bcard.groupOf': 'Grupo · {n} marcas',
  'bcard.groupOne': 'Grupo · 1 marca',
  'lcard.openAndAsk': 'Abrir y pedir ajustes',
};
