import type { SeatId } from './geometry';

type Pt = [number, number];
/** The display area of each seat's screen in the 2000 × 1116 frame: top-left, top-right, bottom-right, bottom-left.
 *  The camera is locked, so the same corners hold for the photo, the loop, the empty chair and night. */
export const SCREEN_QUADS: Record<SeatId, [Pt, Pt, Pt, Pt]> = {
  researcher: [[490, 445], [717, 421], [716, 551], [490, 562]],
  builder: [[862, 422], [1140, 422], [1137, 545], [862, 545]],
  marketer: [[1220, 417], [1463, 423], [1460, 575], [1220, 566]],
  creator: [[625, 642], [879, 637], [873, 806], [622, 812]],
  nico: [[1092, 655], [1375, 637], [1372, 806], [1100, 822]],
};
/** Size of the flat screen element before it is bent into its quad (16:9 like the work shown on it). */
export const SCREEN_W = 320, SCREEN_H = 180;

/** CSS matrix3d that maps a w × h box onto a quad (projective transform, so the image follows the screen's perspective). */
export function quadMatrix([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: [Pt, Pt, Pt, Pt], w = SCREEN_W, h = SCREEN_H) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].join(',')})`;
}
