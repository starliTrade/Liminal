/**
 * LIMINAL · L1 — CANVAS AND LADDER
 *
 * The ladder is the most primitive layer of the system: it depends on nothing.
 * Every surface, every border, every shadow, every rim lands on a level of it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LADDER IS A FORMULA, NOT A PALETTE.
 *
 *   L(n) = CANVAS_L + n * STEP
 *   C    = CHROMA      (constant)
 *   H    = HUE         (constant)
 *
 * Only lightness varies. That is what makes it one scale rather than nine colours
 * that happen to be near each other. The hand-picked palette this replaced drifted
 * 14 degrees in hue and varied 2.3x in chroma — nine colours pretending to be one.
 * With constants there is nothing left to drift.
 *
 * LAW 1 — NO NUMERIC RANGE, CONSTANT SPACING FOREVER.
 * The step is one number. It does not grow with height, it does not compress near
 * the ceiling, it does not have a minimum and a maximum. A range is a decision
 * hidden inside a number; a constant is a decision you can see.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Q } from './perception';

/** The canvas lightness. The anchor — S0 is the darkest surface allowed. */
export const CANVAS_L = 0.128;

/**
 * THE STEP — 0.009475 = 1.1416q, the same for every step, forever.
 *
 * Above q (or the pair is invisible) and below 1.5q (or the ladder reads jumpy).
 * It is not the midpoint of that range: it is the constant that reproduces the
 * approved ladder. The formula was recovered FROM the design, not imposed on it.
 */
export const STEP = 0.009475;

/** Constant chroma. A ladder whose chroma drifts is several colours, not one. */
export const CHROMA = 0.0069;

/** Constant hue. 258.4 degrees — the blue the identity is built on. */
export const HUE = 258.4;

/** Nine levels: S0 canvas through S8 ceiling. */
export const SIZE = 9;

/** The step in quanta. The number every treatment is spoken in. */
export const STEP_IN_Q = STEP / Q;

/**
 * THE CEILING IS A HARD BOUND. It bounds everything — surfaces, light, controls —
 * not only the surfaces.
 *
 * The alternative was to let values above S8 exist, which would have extended the
 * palette every time something needed to go up. The palette is the identity, so
 * the design degrades instead: a toast's rim goes DOWN (reads as cut in), and a
 * control on a floating surface anchors on its host. Both are named exemptions,
 * not the rule quietly not applying.
 */
export const CEILING_IS_HARD = true;

/** The nine levels, as hex. The canonical values for arithmetic and tests. */
export const LADDER = [
  '#060709', // S0 canvas
  '#07090b', // S1 chrome
  '#090b0d', // S2 work surface
  '#0b0d0f', // S3 nested panel
  '#0d0f12', // S4 raised control
  '#0f1114', // S5 floating
  '#111316', // S6 popover
  '#131518', // S7 modal
  '#15171a', // S8 ceiling
] as const;

/**
 * The half-steps — what a border, a state shift and a nesting floor land on.
 * A half-step is 0.5708q, deliberately below the edge threshold: a state change
 * should be felt, not seen.
 */
export const HALF = [
  '#07080a',
  '#080a0c',
  '#0a0c0e',
  '#0c0e10',
  '#0e1013',
  '#101215',
  '#121417',
  '#141619',
] as const;

/** The two sub-canvas wells. Below the canvas, for ambient and contact shadow. */
export const WELLS = {
  penumbra: '#030406',
  umbra: '#010203',
} as const;

/**
 * THE EXACT LADDER — the design, which hex cannot write.
 *
 * The target was always a constant: every step exactly 1.1416q. The realised hex
 * ladder is 1.07q to 1.21q — a spread of 0.14q — and that spread is not the
 * design. It is 8-bit sRGB failing to write it: the nearest hex is off by up to
 * 0.199q, a fifth of a quantum.
 *
 * CSS can write it. `oklch()` carries full precision, so the ladder the browser
 * paints can be the ladder that was designed. The stylesheet emits the hex first
 * and the exact value second — the standard progressive-enhancement pair, so a
 * browser that cannot parse `oklch()` keeps the hex.
 *
 * Seven decimals, because six is not enough: the half-step 0.1327375 rounds to
 * 0.132738 at six, and the difference from its neighbour becomes 0.009474 instead
 * of 0.009475 — a rounding error in the one number the whole system is built on.
 */

/** The lightness of any level, including one that is not on the half-step grid. */
export function levelL(level: number): number {
  return CANVAS_L + level * STEP;
}

/** Any level, exactly — as an `oklch()` string. */
export function ladderExact(level: number): string {
  return `oklch(${levelL(level).toFixed(7)} ${CHROMA} ${HUE})`;
}

/** The nine whole levels, exact. */
export const LADDER_EXACT: readonly string[] = Array.from({ length: SIZE }, (_, n) =>
  ladderExact(n),
);

/** The eight half-steps, exact. */
export const HALF_EXACT: readonly string[] = Array.from({ length: SIZE - 1 }, (_, n) =>
  ladderExact(n + 0.5),
);

/**
 * Resolve a level to a hex — for arithmetic, tests and the contract.
 *
 * Clamped to the ceiling. A request above S8 is not an error to be thrown; it is a
 * request the design answers by refusing, and `CEILING_IS_HARD` is where that is
 * written down.
 */
export function ladderColor(level: number): string {
  const max = SIZE - 1;
  const n = Math.max(0, Math.min(max, level));
  // `n` is clamped to [0, SIZE-1] above, so both indices exist.
  return Number.isInteger(n) ? LADDER[n]! : HALF[Math.floor(n)]!;
}

/**
 * Resolve a level to a CSS variable reference — for a style object.
 *
 * The two outputs are not interchangeable, and the distinction is what makes a
 * theme possible: a theme is a CSS override, and it can only override something
 * that reads CSS. A component that writes `var(--liminal-s2)` follows the theme
 * for free. One that writes `#090b0d` never will.
 */
export function ladderVar(level: number): string {
  const max = SIZE - 1;
  const n = Math.max(0, Math.min(max, level));
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac >= 0.25 && frac < 0.75) return `var(--liminal-s${whole}-5)`;
  return `var(--liminal-s${Math.round(n)})`;
}
