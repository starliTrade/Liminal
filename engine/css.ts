/**
 * LIMINAL · THE STYLESHEET
 *
 * The engine publishes its numbers as CSS custom properties, so a component can
 * read the system instead of restating it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO DECLARATIONS PER LEVEL, AND THE ORDER IS THE POINT.
 *
 *   --liminal-s3: #0b0d0f;                        the quantised rendering
 *   --liminal-s3: oklch(0.1564250 0.0069 258.4);  the design
 *
 * A browser that cannot parse `oklch()` keeps the hex. A browser that can paints
 * the ladder that was designed, with every step exactly 1.1416q instead of the
 * 1.07q–1.21q spread 8-bit sRGB forces.
 *
 * The variables are what make a theme possible at all: a theme is a CSS override,
 * and it can only override something that reads CSS. In the archive 305 variables
 * were published and ONE was consumed — the layer existed and nothing used it.
 * That is why `ladderVar()` exists next to `ladderColor()`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { LADDER, LADDER_EXACT, SIZE, WELLS, ladderExact } from './ladder';
import { Q, R } from './perception';
import {
  BORDER_STEPS,
  RIM_STOPS,
  SEPARATOR_STEPS,
  SHADOW_FLOOR,
  SHADOW_PEAK_QUANTA,
  floatShadow,
} from './treatments';

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a hex: ${hex}`);
  return [m[1], m[2], m[3]].map((h) => parseInt(h as string, 16)) as [number, number, number];
}

/** The ladder, as CSS — hex first, exact second. */
export function ladderCss(): string {
  const lines: string[] = ['  /* the nine levels — hex fallback, then the design */'];
  for (let n = 0; n < SIZE; n++) {
    lines.push(`  --liminal-s${n}: ${LADDER[n]};`);
    lines.push(`  --liminal-s${n}: ${LADDER_EXACT[n]};`);
  }
  lines.push('');
  lines.push('  /* the eight half-steps — what a border and a state shift land on */');
  for (let n = 0; n < SIZE - 1; n++) {
    lines.push(`  --liminal-s${n}-5: ${ladderExact(n + 0.5)};`);
  }
  lines.push('');
  lines.push('  /* below the canvas — for ambient and contact shadow. Not surfaces. */');
  lines.push(`  --liminal-well-penumbra: ${WELLS.penumbra};`);
  lines.push(`  --liminal-well-umbra: ${WELLS.umbra};`);
  return lines.join('\n');
}

/**
 * The treatments, as CSS.
 *
 * Each one is expressed as a DISTANCE IN STEPS from a host level, so the value can
 * be computed from any surface rather than pinned to one. A border on S2 and a
 * border on S5 are the same rule and different colours, and that is the whole
 * reason the ladder is a scale.
 */
export function treatmentCss(): string {
  const lines: string[] = [];
  lines.push('  /* L0 — the physics. Every other number is a distance in these. */');
  lines.push(`  --liminal-q: ${Q};`);
  lines.push(`  --liminal-r: ${R};`);
  lines.push('');
  lines.push('  /* L3 — the treatments, in steps from the surface they sit on */');
  lines.push(`  --liminal-border-steps: ${BORDER_STEPS};`);
  lines.push(`  --liminal-separator-steps: ${SEPARATOR_STEPS};`);
  lines.push(`  --liminal-rim-top: ${RIM_STOPS.top};`);
  lines.push(`  --liminal-rim-side: ${RIM_STOPS.side};`);
  lines.push(`  --liminal-rim-bottom: ${RIM_STOPS.bottom};`);
  lines.push(`  --liminal-shadow-quanta: ${SHADOW_PEAK_QUANTA};`);
  lines.push('');
  lines.push(`  /* a shadow is only visible on ${SHADOW_FLOOR} */`);
  return lines.join('\n');
}

/** A border on a given host level, as a CSS colour — the host plus one step. */
export function borderColor(hostLevel: number): string {
  return ladderExact(hostLevel + BORDER_STEPS);
}

/** A separator inside a surface — the host plus half a step. */
export function separatorColor(hostLevel: number): string {
  return ladderExact(hostLevel + SEPARATOR_STEPS);
}

/** A floating surface's shadow, solved against the surface it falls on. */
export function shadowFor(height: number, hostLevel: number): string {
  return floatShadow(height, hexToRgb(LADDER[Math.max(0, Math.min(SIZE - 1, hostLevel))]!));
}

/** The whole engine, as one stylesheet. */
export function liminalCss(): string {
  return [':root {', ladderCss(), '', treatmentCss(), '}'].join('\n');
}
