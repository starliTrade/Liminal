/**
 * THE LADDER — the foundation of the system.
 *
 * These tests do NOT import the colour maths they check. A test that shares an
 * implementation with the thing it tests inherits its bugs and then reports
 * agreement, so the conversion below is written from the OKLCH definition.
 */

import { describe, expect, it } from 'vitest';
import {
  CANVAS_L,
  CEILING_IS_HARD,
  CHROMA,
  HALF,
  HALF_EXACT,
  HUE,
  LADDER,
  LADDER_EXACT,
  SIZE,
  STEP,
  STEP_IN_Q,
  WELLS,
  ladderColor,
  ladderExact,
  ladderVar,
  levelL,
} from '../ladder';
import { Q, R } from '../perception';

/** sRGB 0..255 -> OKLCH lightness. Written from the definition, not imported. */
function hexToOklchL(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a hex: ${hex}`);
  const [R_, G_, B_] = [m[1], m[2], m[3]].map((h) => {
    const v = parseInt(h as string, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * R_ + 0.5363325363 * G_ + 0.0514459929 * B_);
  const mm = Math.cbrt(0.2119034982 * R_ + 0.6806995451 * G_ + 0.1073969566 * B_);
  const s = Math.cbrt(0.0883024619 * R_ + 0.2817188376 * G_ + 0.6299787005 * B_);
  return 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
}

describe('the step', () => {
  it('lives in ~16 of the 256 8-bit levels — the medium is coarse, the design is small', () => {
    // Measured, not assumed. The whole nine-level ladder occupies a sliver of the
    // display's range, and this is the fact that explains both the hex spread
    // (1.07q-1.21q) and why exact oklch() is required.
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const levels = LADDER.map(rgb);

    for (const ch of [0, 1, 2]) {
      const vals = levels.map((l) => l[ch]!);
      const span = Math.max(...vals) - Math.min(...vals);
      expect(span).toBeGreaterThan(10);
      expect(span).toBeLessThan(24); // a small region of 0..255
    }

    // One step is worth about two 8-bit levels, which makes the half-step
    // separator exactly one level: the smallest difference the medium can write.
    const g = levels.map((l) => l[1]!);
    const perStep = (Math.max(...g) - Math.min(...g)) / (SIZE - 1);
    expect(perStep).toBeGreaterThan(1.5);
    expect(perStep).toBeLessThan(2.5);
  });

  it('is above the quantum — below it the pair is invisible', () => {
    expect(STEP).toBeGreaterThan(Q);
  });

  it('is below one and a half quanta — above it the ladder reads jumpy', () => {
    expect(STEP).toBeLessThan(1.5 * Q);
  });

  it('is 1.1416q, the constant the whole system is spoken in', () => {
    expect(STEP_IN_Q).toBeCloseTo(1.1416, 4);
  });

  it('is below the reliable boundary — a step is felt before it is certain', () => {
    expect(STEP).toBeLessThan(R);
  });
});

describe('the exact ladder — the design, which hex cannot write', () => {
  it('has a CONSTANT step. This is Law 1, and it is the whole claim.', () => {
    const deltas: number[] = [];
    for (let n = 1; n < SIZE; n++) deltas.push(levelL(n) - levelL(n - 1));
    for (const d of deltas) expect(d).toBeCloseTo(STEP, 10);
    // Not "close to each other" — identical. A range would show up here.
    expect(new Set(deltas.map((d) => d.toFixed(10))).size).toBe(1);
  });

  it('every exact step is exactly 1.1416q', () => {
    for (let n = 1; n < SIZE; n++) {
      expect((levelL(n) - levelL(n - 1)) / Q).toBeCloseTo(1.1416, 4);
    }
  });

  it('writes seven decimals, because six loses the half-step', () => {
    // 0.1327375 at six decimals -> 0.132738, and the neighbour gap becomes
    // 0.009474 instead of 0.009475. A rounding error in the one number.
    expect(ladderExact(3.5)).toBe('oklch(0.1611625 0.0069 258.4)');
    expect(ladderExact(3.5).split(' ')[0]!.replace('oklch(', '')).toHaveLength(9);
  });

  it('is monotonic — a ladder that goes back down is not a ladder', () => {
    const ls = LADDER_EXACT.map((s) => parseFloat(s.slice(6)));
    for (let i = 1; i < ls.length; i++) expect(ls[i]!).toBeGreaterThan(ls[i - 1]!);
  });

  it('puts the half-steps exactly midway, not near it', () => {
    for (let n = 0; n < SIZE - 1; n++) {
      const mid = parseFloat(HALF_EXACT[n]!.slice(6));
      expect(mid - levelL(n)).toBeCloseTo(STEP / 2, 10);
      expect(levelL(n + 1) - mid).toBeCloseTo(STEP / 2, 10);
    }
  });

  it('starts at the canvas and ends at the ceiling', () => {
    expect(parseFloat(LADDER_EXACT[0]!.slice(6))).toBeCloseTo(CANVAS_L, 7);
    expect(parseFloat(LADDER_EXACT[SIZE - 1]!.slice(6))).toBeCloseTo(
      CANVAS_L + (SIZE - 1) * STEP,
      7,
    );
  });
});

describe('the hex ladder — the quantised rendering', () => {
  it('has nine levels', () => {
    expect(LADDER).toHaveLength(SIZE);
    expect(HALF).toHaveLength(SIZE - 1);
  });

  it('every realised step is at least the quantum — rule 1', () => {
    for (let n = 1; n < SIZE; n++) {
      const d = hexToOklchL(LADDER[n]!) - hexToOklchL(LADDER[n - 1]!);
      expect(d).toBeGreaterThanOrEqual(Q * 0.999);
    }
  });

  it('every realised step is at most 1.5q — rule 2', () => {
    for (let n = 1; n < SIZE; n++) {
      const d = hexToOklchL(LADDER[n]!) - hexToOklchL(LADDER[n - 1]!);
      expect(d).toBeLessThanOrEqual(1.5 * Q * 1.001);
    }
  });

  it('the realised spread is the display, not the design — and it is small', () => {
    const ds: number[] = [];
    for (let n = 1; n < SIZE; n++) {
      ds.push((hexToOklchL(LADDER[n]!) - hexToOklchL(LADDER[n - 1]!)) / Q);
    }
    const spread = Math.max(...ds) - Math.min(...ds);
    // The exact ladder has a spread of ZERO. The hex ladder's spread is the
    // 8-bit grid failing to write the design — it must stay under a fifth of a
    // quantum, or the rendering has stopped representing the design.
    expect(spread).toBeLessThan(0.2);
  });

  it('is monotonic in lightness', () => {
    for (let n = 1; n < SIZE; n++) {
      expect(hexToOklchL(LADDER[n]!)).toBeGreaterThan(hexToOklchL(LADDER[n - 1]!));
    }
  });

  it('holds the work surface at S2', () => {
    expect(LADDER[2]).toBe('#090b0d');
    expect(LADDER[0]).toBe('#060709');
    expect(LADDER[8]).toBe('#15171a');
  });

  it('puts the wells BELOW the canvas — light does not fall upward', () => {
    expect(hexToOklchL(WELLS.penumbra)).toBeLessThan(hexToOklchL(LADDER[0]!));
    expect(hexToOklchL(WELLS.umbra)).toBeLessThan(hexToOklchL(WELLS.penumbra));
  });

  it('keeps hue and chroma constant — otherwise it is not one scale', () => {
    // The formula has no term for either, so this is a check on the formula.
    for (let n = 0; n < SIZE; n++) {
      const s = ladderExact(n);
      expect(s).toContain(` ${CHROMA} ${HUE})`);
    }
  });
});

describe('the ceiling is hard', () => {
  it('is declared', () => {
    expect(CEILING_IS_HARD).toBe(true);
  });

  it('refuses a level above S8 by clamping, not by throwing', () => {
    expect(ladderColor(9)).toBe(LADDER[SIZE - 1]);
    expect(ladderColor(99)).toBe(LADDER[SIZE - 1]);
  });

  it('refuses a level below S0', () => {
    expect(ladderColor(-1)).toBe(LADDER[0]);
  });
});

describe('resolution', () => {
  it('maps integers to the ladder and fractions to the half-steps', () => {
    expect(ladderColor(2)).toBe('#090b0d');
    expect(ladderColor(2.5)).toBe(HALF[2]);
    expect(ladderColor(0)).toBe('#060709');
  });

  it('gives a CSS variable for a style object, not a hex', () => {
    expect(ladderVar(2)).toBe('var(--liminal-s2)');
    expect(ladderVar(2.5)).toBe('var(--liminal-s2-5)');
    expect(ladderVar(0)).toBe('var(--liminal-s0)');
  });

  it('never emits a variable above the ceiling', () => {
    expect(ladderVar(9)).toBe('var(--liminal-s8)');
  });
});
