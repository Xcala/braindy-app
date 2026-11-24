/** Strings for menus after lessons 01 and 02: brand picker groups, admin sidebar groups, short tab labels for phones. */
export const menuEn = {
  'bmenu.groupN': '{name} · {n} brands',
  'bmenu.groupOne': '{name} · 1 brand',
  'bmenu.all': 'All · A–Z',
  'anav.g.work': 'Work',
  'anav.g.sales': 'Sales',
  'anav.g.team': 'Team',
  'anav.lateN': '{n} overdue',
  'anav.lateOne': '1 overdue',
  'sub.researchShort': 'Study',
} as const;

export const menuEs: Record<keyof typeof menuEn, string> = {
  'bmenu.groupN': '{name} · {n} marcas',
  'bmenu.groupOne': '{name} · 1 marca',
  'bmenu.all': 'Todas · A–Z',
  'anav.g.work': 'Trabajo',
  'anav.g.sales': 'Ventas',
  'anav.g.team': 'Equipo',
  'anav.lateN': '{n} atrasados',
  'anav.lateOne': '1 atrasado',
  'sub.researchShort': 'Estudio',
};
