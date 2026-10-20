// Brand → folder inside the locally mounted Drive (Google Drive for Desktop, account nicolas@xent.co).
// Paths are relative to DRIVE_ROOT (default "G:/Mi unidad"). Same folders as DRIVE_FOLDERS in config.ts.
import { readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const DRIVE_ROOT = process.env.DRIVE_ROOT ?? 'G:/Mi unidad';

export const LOCAL_FOLDERS: Record<string, string> = {
  'grupo-berrio': 'Berrio',
  'grupo-ibmt': 'Berrio/IBMT',
  simbiotica: 'Berrio/Simbiotica',
  datanexus: 'Berrio/Datanexus',
  hero: 'Berrio/Hero',
  ipark: 'Berrio/Ipark',
  equipark: 'Berrio/equipark',
  racering: 'Berrio/RaceRing',
  orphipass: 'Berrio/Orphipass',
  'quindio-bio-tech': 'Berrio/Quindio Bio Tech',
  'jero-berrio': 'Berrio/Jero66',
  'park-media-y-plaza': 'Berrio/Park Media y Plaza',
  imedh: 'Berrio/Imedh',
  restaurantes: 'Restaurantes',
  'puerta-del-sol': 'Restaurantes/Puerta del Sol',
  'hacienda-parrilla-bar': 'Restaurantes/Hacienda',
  'casa-en-el-aire': 'Restaurantes/Casa en el Aire',
  'grupo-alejandra': 'Grupo Alejandra',
  'mayo-rd': 'Grupo Alejandra/Mayo RD',
  'mex-group': 'MEX Group',
  'toro-mambo': 'MEX Group/Toro Mambo',
  lnsr: 'MEX Group/LNSR',
  jema: 'Marcas Personales/Jema',
  'namen-vargas': 'Marcas Personales/Namen Vargas',
  'ariza-abogados': 'Marcas Personales/Julio Ariza',
  'ms-dyer': 'Marcas Personales/Christine Dyer',
  'mariana-duenas': 'Marcas Personales/Mariana Dueñas',
  'andrea-carmona': 'Marcas Personales/Andrea Carmona',
  'fernanda-gil': 'Marcas Personales/Fernanda Gil',
  'adriana-penuela-useche': 'Marcas Personales/Adriana Penuela-Useche',
  'monica-bautista': 'Marcas Personales/Mónica Bautista',
  'nadia-olea': 'Marcas Personales/Nadia Olea',
  'rusmila-okuale': 'Marcas Personales/Rusmila Okuale',
  'andrea-perez': 'Marcas Personales/Andrea Pérez',
  'rocio-suarez': 'Marcas Personales/Rocío Suárez',
  'claudia-rojas': 'Marcas Personales/Claudia Rojas',
  cote: 'Marcas Personales/Coté',
  ivana: 'Marcas Personales/Ivana',
  'revista-level': 'LEVEL',
  cemex: 'Cemex',
  'window-tinting': 'Windows Tinting',
  'marco-polo-education': 'Marco Polo',
  sanuteam: 'Sanuteam',
  'community-workforce-institut': 'CWI',
  pequeloop: 'Pequeloop',
  caobos: 'Caobos',
  legadus: 'Legadus',
  tinyroots: 'tinyroots',
  milohas: 'Milohas',
  'banco-familiar': 'Banco Familiar',
  'grupo-alternativas': 'Grupo alternativas',
  quimiolab: 'Quimiolab',
};

/** Google-native files appear on disk as small JSON shortcuts; they cannot be copied as files. */
export const GOOGLE_SHORTCUT = /\.(gdoc|gsheet|gslides|gdraw|gform|gmap|gsite|gjam|gscript)$/i;
const IGNORED = /^(desktop\.ini|\.ds_store|thumbs\.db|icon\r?)$/i;
const IGNORED_DIRS = /^(_?to[_ ]delete|\$recycle\.bin)$/i;

/** Not brand material: source code, build output, GIS data, camera RAW, partial downloads, archives. */
export const NOISE_DIRS = /^(node_modules|\.git|\.next|\.astro|dist|build|out|vendor|__pycache__|\.cache|\.vercel|\.firebase|.*\.gdb)$/i;
export const NOISE_FILES = /\.(js|mjs|cjs|ts|tsx|jsx|map|php|py|rb|go|lock|json|yml|yaml|toml|env|sh|bat|css|scss|less|gdb\w*|spx|cr2|cr3|dng|nef|arw|raf|orf|descarga|crdownload|part|tmp|zip|rar|7z|dmg|exe|msi|iso)$/i;
export const MAX_IMPORT_BYTES = 500 * 1024 ** 2;

/** Whether a file is worth copying into the platform (brand assets, deliverables, documents). */
export const importable = (f: LocalFile) =>
  !f.googleShortcut && !NOISE_FILES.test(f.name) && f.size <= MAX_IMPORT_BYTES
  && !f.relPath.split('/').slice(0, -1).some((d) => NOISE_DIRS.test(d));

export interface LocalFile {
  absPath: string;
  relPath: string; // relative to the brand folder, with "/" separators
  name: string;
  size: number;
  mtimeMs: number;
  googleShortcut: boolean;
}

/** Recursively lists files under `root`, skipping any directory in `skipAbs` (child brand folders). */
export async function walkLocal(root: string, skipAbs: Set<string>, base = root): Promise<LocalFile[]> {
  const out: LocalFile[] = [];
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = join(root, e.name);
    if (e.isDirectory()) {
      if (skipAbs.has(abs) || IGNORED_DIRS.test(e.name)) continue;
      out.push(...(await walkLocal(abs, skipAbs, base)));
    } else if (e.isFile() && !IGNORED.test(e.name)) {
      const s = await stat(abs);
      out.push({
        absPath: abs, relPath: relative(base, abs).split(sep).join('/'), name: e.name,
        size: s.size, mtimeMs: s.mtimeMs, googleShortcut: GOOGLE_SHORTCUT.test(e.name),
      });
    }
  }
  return out;
}

export const absFolder = (brandId: string) => join(DRIVE_ROOT, LOCAL_FOLDERS[brandId]);
