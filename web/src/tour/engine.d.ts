// Types for the dependency-free tour engine (engine.js, from the "recorrido-guiado" skill).
export interface Paso { el?: string; titulo: string; texto: string; logo?: boolean; antes?: () => void }
export interface Opciones {
  fin?: { texto: string; href: string };
  logoHtml?: string;
  alCerrar?: (id: string) => void;
  alCompletar?: (id: string) => void;
  confeti?: boolean;
  colores?: string[];
  textos?: Partial<Record<'saltar' | 'atras' | 'siguiente' | 'empezar' | 'listo' | 'empezarFin' | 'de' | 'felicitacion' | 'felicitacionSub', string>>;
}
export function iniciarTour(id: string, pasos: Paso[], op?: Opciones): void;
export function tourVisto(id: string): boolean;
export function conectarTour(id: string, pasos: Paso[] | (() => Paso[]), op?: Opciones & { auto?: boolean; retraso?: number }): () => void;
export function celebrar(o?: { colores?: string[]; titulo?: string; sub?: string }): void;
