/**
 * LIMINAL · L3 — TREATMENTS
 *
 * Border, separator, rim, shadow. Four ways of putting a signal on a surface, and
 * each one is a distance from the surface it sits on — measured in quanta, against
 * the threshold of its own mechanism.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO RULERS, AND THEY ARE NOT INTERCHANGEABLE.
 *
 *   SURFACE-RELATIVE   border, separator, rim   measured from the surface they
 *                                              sit ON. The question is "how far
 *                                              from this surface is the line".
 *   HOST-RELATIVE      shadow                   measured from the surface it
 *                                              falls ON. The question is "how
 *                                              much darker is this patch".
 *
 * A border and a shadow that share a number are not the same signal. They are two
 * different questions that happened to get the same answer, and the next surface
 * will separate them.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EDGE_THRESHOLD, Q } from './perception';
import { STEP, SIZE } from './ladder';

/**
 * BORDER — one step. 1.1416q, which is 2.4x the edge threshold.
 *
 * A border must be a border, not a hint. At half a step it is exactly at the edge
 * threshold — visible if you look, absent if you do not — and a control that
 * disappears when you stop looking is not a control.
 *
 * The margin is the point. 2.4x survives a display, a viewing angle or a room that
 * halves the sensitivity: the border lands at 1.2x and is still there.
 */
export const BORDER_STEPS = 1;

/**
 * SEPARATOR — half a step. 0.5708q, which is 1.19x the edge threshold.
 *
 * A different job, so a different distance. A border says "this control ends here";
 * a separator says "these two things are not one thing". It sits INSIDE a surface,
 * between two pieces of content, and it must be findable without being a line you
 * notice. It is deliberately at the threshold rather than above it.
 */
export const SEPARATOR_STEPS = 0.5;

/**
 * RIM — one and a half steps, DIRECTIONAL.
 *
 * A rim is light catching an edge, so it is not one number: it is three, and they
 * fall off around the shape.
 *
 *   top     1.5 steps   the light source
 *   side    1.0 steps   the turn
 *   bottom  0.5 steps   the shadow side
 *
 * The strength was resolved by eye across every boundary in the archive. Four
 * candidate tiers collapsed to one: 1.5 everywhere.
 */
export const RIM_STEPS = 1.5; // = RIM_STOPS.top; the strength, named for the policy

/**
 * The three directional stops, IN STEPS — not as fractions of the rim's strength.
 *
 * Written this way because these are the numbers the design was approved with:
 * top 1.5, side 1.0, bottom 0.5. Expressing them as fractions of 1.5 introduces a
 * rounding (`0.333` instead of `1/3`) that silently moves the bottom stop to
 * 0.4995 — a number nobody chose, in a system where every number is chosen.
 */
export const RIM_STOPS = {
  top: 1.5,
  side: 1.0,
  bottom: 0.5,
} as const;

/**
 * CEILING COMPRESSION — the rim does not go above S8, it compresses.
 *
 * A rim has to be brighter than the surface it sits on. At S7 there is exactly one
 * step of room left, so the three stops compress into it: 1 / 0.667 / 0.333 steps.
 * Rounding those to the half-step grid gave 1 / 0.5 / 0.5 — two stops instead of
 * three, so the edge lost its direction exactly where it had least room.
 *
 * At S8 there is no room at all, so it INVERTS: every stop goes below the surface
 * and the edge reads as cut in. Measured: #141619 against a surface of #15171a.
 */
export function rimStops(hostLevel: number): { top: number; side: number; bottom: number } {
  const room = SIZE - 1 - hostLevel;
  if (room <= 0) {
    // The ceiling. No room above, so the rim goes below and reads as cut in.
    return {
      top: -RIM_STOPS.top,
      side: -RIM_STOPS.side,
      bottom: -RIM_STOPS.bottom,
    };
  }
  const scale = Math.min(1, room / RIM_STOPS.top);
  return {
    top: RIM_STOPS.top * scale,
    side: RIM_STOPS.side * scale,
    bottom: RIM_STOPS.bottom * scale,
  };
}

/**
 * SHADOW — the peak is ONE QUANTUM. 1.0q, which is 2.08x the edge threshold.
 *
 * A shadow is two layers, and where they overlap the darkness is not either alpha:
 * it is `1 - (1-a)(1-b)`. The old model's peak composited to 4.07q — four times the
 * threshold. The reader's words: "blatant, jarring, obvious and separate", while
 * the border and the rim sat at the boundary. The shadow was not at the boundary of
 * anything.
 *
 * One quantum, not half of one:
 *
 *   0.5q peak   1.04x   a HINT — barely at the threshold
 *   1.0q peak   2.08x   a SHADOW — the same margin the border has
 *
 * And the margin is what survives different conditions: a display that halves the
 * sensitivity leaves a 1q shadow at 0.5q — still above the threshold — and takes a
 * 0.5q shadow to 0.25q, which is gone.
 */
export const SHADOW_PEAK_QUANTA = 1;

/** The shadow's own colour. Darker than the canvas and than every surface. */
export const SHADOW_RGB = [1, 2, 3] as const;

/** sRGB 0..255 -> OKLCH lightness, continuous — the browser does not round. */
function oklchLightness(rgb: readonly number[]): number {
  // Destructuring a mapped array yields `number | undefined` under
  // noUncheckedIndexedAccess. The array is always length 3, so index it.
  const lin = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const R = lin[0]!;
  const G = lin[1]!;
  const B = lin[2]!;
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

/** `fg` laid OVER `bg` at alpha `a`, in continuous space. */
function composite(a: number, bg: readonly number[]): number[] {
  return bg.map((b, i) => b + a * (SHADOW_RGB[i]! - b));
}

/**
 * THE ALPHA IS SOLVED, NOT WRITTEN DOWN.
 *
 * The shadow colour is fixed, so the same alpha is a different distance in quanta
 * on a different surface. Measured: one quantum needs 0.2477 over the canvas and
 * 0.0890 over the ceiling. A single number cannot be one quantum on both, and a
 * shadow 2.8x too dark on the ceiling is the defect this function exists to
 * prevent.
 *
 * Bisection on a monotonic function, exact to 80 iterations, memoised per host.
 */
const alphaCache = new Map<string, number>();

export function shadowPeakAlpha(hostRgb: readonly number[], quanta = SHADOW_PEAK_QUANTA): number {
  const key = `${hostRgb.join(',')}|${quanta}`;
  const hit = alphaCache.get(key);
  if (hit !== undefined) return hit;

  const hostL = oklchLightness(hostRgb);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const d = (oklchLightness(composite(mid, hostRgb)) - hostL) / Q;
    if (Math.abs(d) > quanta) hi = mid;
    else lo = mid;
  }
  const found = (lo + hi) / 2;
  alphaCache.set(key, found);
  return found;
}

/**
 * Height in, radius out — and the darkness that puts the peak one quantum down.
 *
 * A floating surface blocks light over a wide area because it is FAR from what it
 * falls on, and the further it floats the wider and softer the shadow. The radius
 * is linear in the height with NO constant: the old `40 + h*3.2` was 93% constant
 * at height one and 61% at height eight, so every surface cast the same wide shadow
 * and the height moved it by 18%.
 */
export function shadowModel(height: number, hostRgb: readonly number[]) {
  const peak = shadowPeakAlpha(hostRgb);
  // Two layers, each carrying half the peak, so they overlap TO it.
  const each = 1 - Math.sqrt(1 - peak);
  return {
    near: 2 + height * 1.5,
    far: 4 + height * 6,
    nearAlpha: each,
    farAlpha: each,
    peak,
  };
}

/** A floating surface's shadow, as a CSS value. */
export function floatShadow(height: number, hostRgb: readonly number[]): string {
  const { near, far, nearAlpha, farAlpha } = shadowModel(height, hostRgb);
  return `0 ${near.toFixed(1)}px ${far.toFixed(0)}px rgba(1, 2, 3, ${farAlpha.toFixed(4)}), 0 2px ${near.toFixed(1)}px rgba(1, 2, 3, ${nearAlpha.toFixed(4)})`;
}

/**
 * THE SHADOW OF AN OBJECT RESTING ON A SURFACE — a knob, a thumb, an active tab.
 *
 * NOT a smaller floating shadow, and that is why it has its own name. A floating
 * surface blocks light over a wide area because it is far from what it falls on; an
 * object touches its surface, so its shadow is a CONTACT shadow: tight, dark,
 * directly below.
 */
export const REST_SHADOW = '0 1px 2px rgba(1, 2, 3, 0.35), 0 0 0 1px rgba(1, 2, 3, 0.12)';

/**
 * A SHADOW IS ONLY VISIBLE ON A SURFACE LIGHTER THAN IT.
 *
 * The shadow colour is darker than the canvas and the work plane — and NOT darker
 * than a well. A shadow cast onto a well is a shadow nobody can see, which is a
 * constraint rather than a rule to remember: the well is below the canvas, and
 * light does not fall upward.
 */
export const SHADOW_FLOOR = 'canvas or above — never onto a well';

/** Every treatment as a distance in quanta, for the policy table and the tests. */
export const TREATMENTS_IN_Q = {
  border: BORDER_STEPS * STEP / Q,
  separator: SEPARATOR_STEPS * STEP / Q,
  rim: RIM_STEPS * STEP / Q,
  shadow: SHADOW_PEAK_QUANTA,
} as const;

/** The same numbers as multiples of the edge threshold — the margin that survives. */
export const TREATMENTS_OVER_EDGE = {
  border: (BORDER_STEPS * STEP) / EDGE_THRESHOLD,
  separator: (SEPARATOR_STEPS * STEP) / EDGE_THRESHOLD,
  rim: (RIM_STEPS * STEP) / EDGE_THRESHOLD,
  shadow: (SHADOW_PEAK_QUANTA * Q) / EDGE_THRESHOLD,
} as const;
