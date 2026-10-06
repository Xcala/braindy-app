// Brand → Drive folder mapping. Explicit ids win over automatic matching (orbit links, name search).
// Fill in or correct after reviewing the drive-map report.

/** brandId (in braindy-app) → Drive folder id. */
export const DRIVE_FOLDERS: Record<string, string> = {
  // Drive "Berrio": the group's own folder; each subfolder is a brand (decision 2026-10-05).
  'grupo-berrio': '13clek-bV-joXS60Sd1OckSNGHO07yu69',
  'grupo-ibmt': '1Dv_BkKOPsdyJu7Ib8bGNTWcaJdaQu3hz',
  simbiotica: '1bBdK0nvsSdaCmXc4KniPRGQbgIM5XUMk',
  datanexus: '1NGfhuIPlfZETyqncgDN8cRowtttaE3ZX',
  hero: '1Q4bRFdapEThWoopelv3zWVnoK-7DRtt-',
  ipark: '12i8y4ujhPYvRk71OW3vn3joaE5h4IQkh',
  equipark: '1DXP7rBsfuXqn8krDIlwvEv8JM3xTyiYU',
  racering: '1P493kHttgqYNSrivrpzJdvw-HKdR-cZO',
  orphipass: '1sHhhYyxL__dEp-hjRuL73lCnuD5Kr_jb',
  'quindio-bio-tech': '1sNDFYzrqSSkXSF4bynHww3jGM0Vlvovf',
  'jero-berrio': '13eRbKo4lzcaHtWWhVVG86gl_H0ppH986',
  'park-media-y-plaza': '1gm2z2cP-OJ_wyPfHPKMfV6fhqqrc8Ir1',
  imedh: '1SRIzsRC9xl8PtmG7zeqC48mcuSdgMP0b',
  milohas: '1i3oQ_zFw1lRjh8M_v7L53_TND6oQbe8a',
  // Groups (decisions 2026-10-05). Group-level files = everything not inside a child brand folder.
  restaurantes: '1un02x23H69RRKE5oKqORGc3wCz5SNAX1',
  'puerta-del-sol': '1gbjBDk7T6Me3PBxBeGT1pZb-Tqr9mXgj',
  'hacienda-parrilla-bar': '1vUx9EjjutIOg6NJJf7izy7OMZo-Mz1p5',
  'casa-en-el-aire': '1ovfYoOjakRoXUE0Guw8Z7s8l7IoHFHuh',
  'grupo-alejandra': '1GiIVWmOrCufGXwQaqYaxZuvcz0XlGo51',
  'mayo-rd': '1dAk0KmdtNNHGR0c8vhKvtm8leo4e1--h',
  'mex-group': '1NoLO4ZsBxSTscYP8VUb8gCCWrrKRZFZj',
  'toro-mambo': '1J7E4U1sYgDgMzSPxarTgQlo0Bftt19pU',
  lnsr: '1mLE7NfvdMY2Eu6cndT88C4KGBo7YY1-i',
  // "Marcas Personales" (organizing folder; each subfolder is a client).
  jema: '18k5IT0H0EubTaowofq8jY4qixAetQ-5d',
  'namen-vargas': '1mn0jg66QCljy2c6PNhziVDUX2DbL50Eh',
  'ariza-abogados': '1nX7ZKfNLaemtWWL4EZhEEsBlKVgyFHNQ',
  'ms-dyer': '1G1sd38-N8ykZMqtcJR_T1lc-z8Ai2OXf',
  'mariana-duenas': '1i6KMYb1dcddtpcsdShC1bbRH7E624UgI',
  'andrea-carmona': '1AEkNKhl71uhFcg7MlGiWDZUm7SDexJzx',
  'fernanda-gil': '15sOmHl4QgHfIWNATubWzWPWEdaPwHfeO',
  'adriana-penuela-useche': '1PtxYYbCEFWZz0_58NNMhU46y1P37fGdg',
  'monica-bautista': '1syr0ucnox87TghTCMVMU9iULCrDUxijq',
  'nadia-olea': '0BzmCgTYSFjQ3dWNxRExSYVFyS2c',
  'rusmila-okuale': '12vL4-bMyHZSHQxWaws9nWpz4eSKIgV6P',
  'andrea-perez': '1UqhQsilHGPKrvzLGBXNLltM1qkJuLU76',
  'rocio-suarez': '1xgxZMpVaBwxKUwg47krDry_2yRNxNnHd',
  'claudia-rojas': '1IyiHvQd18Ojn-9AVLbp1i3WjWXNctUw8',
  cote: '1ksHaLvIP0Es5DOykn10lWXuI9fNpUd6u',
  ivana: '1rvuL90Lcuah4Nqh4W5_CkaesJxO66Aey',
  // Single-brand folders.
  'revista-level': '16YWakKN3Mu3qNZNoHhZkta2BvV6jXCdc',
  cemex: '1U4ImiKHCknR1JIUSjYbfC32qfC_ezE1R',
  'window-tinting': '1DxFmandsnhwCTXV_ELoQq-c7bpeWXVd_',
  'marco-polo-education': '1twHdhautXfVnGnt4nitecl4bnELPmpym',
  sanuteam: '120GYrmwPRvg3wGBlwfLaCzFOvc8fLcmq',
  'community-workforce-institut': '1L9OLjIyfIQ4jJg4S_kwRf5gfo_g2BJVa',
  pequeloop: '1ICSxD1dR32vMhIuvkb76d6R1nZtDMDTV',
  caobos: '0BzmCgTYSFjQ3SmFqRUFnSFBqQTg',
  legadus: '1xOjkWQ5ncDrhSMlMbkPuswFDBDiLDLdL',
  tinyroots: '1Sh8YRtoRk-nuCAIUhjcvMnKUD2-lPuxv',
  // From orbit project links.
  'banco-familiar': '1oQ1Sy8sSHzORMlDBPHxfm0ro514XlYkV',
  'grupo-alternativas': '15Kh0v5b7tsqyOCmcLkhcHGk9ub8lIcE0',
  quimiolab: '1fCxODCdqswHd-DUQOPRrUr891TBfi0vK',
};

/** Top-level folders shared (Viewer) with the braindy-api service account; they cover every folder above. */
export const SHARED_ROOTS = [
  '13clek-bV-joXS60Sd1OckSNGHO07yu69', // Berrio
  '1koU9jG9TC7vszICdxU369Y71WmNhPbIc', // Marcas Personales
  '1NoLO4ZsBxSTscYP8VUb8gCCWrrKRZFZj', // MEX Group
  '1GiIVWmOrCufGXwQaqYaxZuvcz0XlGo51', // Grupo Alejandra
  '1un02x23H69RRKE5oKqORGc3wCz5SNAX1', // Restaurantes
  '16YWakKN3Mu3qNZNoHhZkta2BvV6jXCdc', // LEVEL
  '1U4ImiKHCknR1JIUSjYbfC32qfC_ezE1R', // Cemex
  '1DxFmandsnhwCTXV_ELoQq-c7bpeWXVd_', // Windows Tinting
  '1twHdhautXfVnGnt4nitecl4bnELPmpym', // Marco Polo
  '120GYrmwPRvg3wGBlwfLaCzFOvc8fLcmq', // Sanuteam
  '1L9OLjIyfIQ4jJg4S_kwRf5gfo_g2BJVa', // CWI
  '1ICSxD1dR32vMhIuvkb76d6R1nZtDMDTV', // Pequeloop
  '0BzmCgTYSFjQ3SmFqRUFnSFBqQTg', // Caobos
  '1xOjkWQ5ncDrhSMlMbkPuswFDBDiLDLdL', // Legadus
  '1Sh8YRtoRk-nuCAIUhjcvMnKUD2-lPuxv', // tinyroots
  '1i3oQ_zFw1lRjh8M_v7L53_TND6oQbe8a', // Milohas
  '1oQ1Sy8sSHzORMlDBPHxfm0ro514XlYkV', // Banco Familiar
  '15Kh0v5b7tsqyOCmcLkhcHGk9ub8lIcE0', // Grupo Alternativas
  '1fCxODCdqswHd-DUQOPRrUr891TBfi0vK', // Quimiolab
  '1oa7a2OIrla1mldsQA5wWRSKP7z9GCkfh', // Braindy Proposals
];

/** Files never imported (by exact name), e.g. contracts sitting next to brand folders. */
export const EXCLUDED_FILE_NAMES = ['Contrato Nicolas.pdf'];

/** Folder that holds Braindy proposals; each direct child (file or folder) is one proposal. */
export const PROPOSALS_FOLDER = '1oa7a2OIrla1mldsQA5wWRSKP7z9GCkfh';
/** Children of the proposals folder that are not proposals. */
export const PROPOSALS_IGNORED = ['_to_delete', 'tools', 'Claude outputs'];
