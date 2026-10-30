import type { BrainId } from '../requests/taxonomy';

export type SeatId = BrainId | 'nico';

/** Where each seat sits in the studio photo, in a 2000 × 1116 frame. */
export interface Seat { c: string; screen: [number, number]; hot: [number, number, number, number]; bub: [number, number] }

export const SEATS: Record<SeatId, Seat> = {
  nico: { c: '#FFFFFF', screen: [1240, 745], hot: [1540, 800, 440, 600], bub: [1790, 970] },
  researcher: { c: '#F5B301', screen: [600, 500], hot: [330, 460, 280, 300], bub: [330, 320] },
  marketer: { c: '#8B5CF6', screen: [1340, 500], hot: [1720, 470, 260, 300], bub: [1815, 335] },
  creator: { c: '#06B6D4', screen: [715, 740], hot: [430, 800, 360, 420], bub: [205, 930] },
  builder: { c: '#2A7FFF', screen: [995, 490], hot: [995, 400, 280, 300], bub: [995, 262] },
};
export const SEAT_ORDER: SeatId[] = ['researcher', 'marketer', 'nico', 'creator', 'builder'];
export const CLOSEUP: Record<SeatId, string> = {
  nico: 'cu-nico', researcher: 'cu-res', marketer: 'cu-mkt', creator: 'cu-cre', builder: 'cu-bui',
};

/** Percent position inside the scene for a point of the 2000 × 1116 frame. */
export const pct = ([x, y]: [number, number]) => ({ left: `${x / 20}%`, top: `${y / 11.16}%` });

/** Camera transform that centers a seat in the area left of the card panel. */
export function zoomTo(id: SeatId, w: number, h: number, s = 2.1) {
  const [hx, hy] = SEATS[id].hot;
  const px = (hx / 2000) * w, py = ((hy - 40) / 1116) * h;
  const cx = w * 0.36;
  const tx = Math.min(0, Math.max(w - w * s, cx - px * s));
  const ty = Math.min(0, Math.max(h - h * s, h * 0.5 - py * s));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}
