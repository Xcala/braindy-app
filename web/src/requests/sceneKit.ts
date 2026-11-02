import type { CSSProperties } from 'react';
import type { Word } from './teamLog';

/** Each scene runs on one clock: an element appears at its delay (seconds), so the work is seen happening in order. */
export const at = (d: number, extra?: CSSProperties) => ({ ['--d' as string]: `${d}s`, ...extra }) as CSSProperties;
export type Say = (w: Word) => string;
