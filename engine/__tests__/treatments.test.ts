/**
 * THE TREATMENTS — border, separator, rim, shadow.
 *
 * Each one is a distance from the surface it sits on, measured in quanta against
 * the threshold of its OWN mechanism. The tests below check the distance, and then
 * check the margin that survives a display that halves the sensitivity.
 */

import { describe, expect, it } from 'vitest';
import {
  BORDER_STEPS,
  RIM_STEPS,
  SEPARATOR_STEPS,
  SHADOW_RGB,
  TREATMENTS_IN_Q,
  TREATMENTS_OVER_EDGE,
  floatShadow,
  rimStops,
  shadowModel,
  shadowPeakAlpha,
} from '../treatments';
import { EDGE_THRESHOLD, Q } from '../perception';
import { LADDER, SIZE, STEP } from '../ladder';

/** sRGB 0..255 -> OKLCH lightness. Independent of the engine, on purpose. */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a hex: ${hex}`);
  return [m[1], m[2], m[3]].map((h) => parseInt(h as string, 16)) as [number, number, number];
}

function oklchL(rgb: readonly number[]): number {
  const [R_, G_, B_] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * R_ + 0.5363325363 * G_ + 0.0514459929 * B_);
  const m = Math.cbrt(0.2119034982 * R_ + 0.6806995451 * G_ + 0.1073969566 * B_);
  const s = Math.cbrt(0.0883024619 * R_ + 0.2817188376 * G_ + 0.6299787005 * B_);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

/** Lay the shadow colour over a host at alpha, independently of the engine. */
function compositeShadow(alpha: number, host: readonly number[]): number[] {
  return host.map((b, i) => b + alpha * (SHADOW_RGB[i]! - b));
}

describe('border', () => {
  it('is one step — 1.1416q', () => {
    expect(TREATMENTS_IN_Q.border).toBeCloseTo(1.1416, 4);
  });

  it('is 2.4x the edge threshold — the margin that survives a bad display', () => {
    expect(TREATMENTS_OVER_EDGE.border).toBeCloseTo(2.4, 1);
  });

  it('would still be a border if the display halved the sensitivity', () => {
    // The whole reason for the margin, stated as a test.
    expect(TREATMENTS_IN_Q.border / 2).toBeGreaterThan(EDGE_THRESHOLD / Q);
  });

  it('is above the separator — two jobs, two distances', () => {
    expect(BORDER_STEPS).toBeGreaterThan(SEPARATOR_STEPS);
  });
});

describe('separator', () => {
  it('is half a step — 0.5708q', () => {
    expect(TREATMENTS_IN_Q.separator).toBeCloseTo(0.5708, 4);
  });

  it('sits at the threshold, not above it — findable without being noticed', () => {
    expect(TREATMENTS_OVER_EDGE.separator).toBeGreaterThan(1.0);
    expect(TREATMENTS_OVER_EDGE.separator).toBeLessThan(1.5);
  });

  it('is below the quantum — it is a separator, not a step of the ladder', () => {
    expect(SEPARATOR_STEPS * STEP).toBeLessThan(Q);
  });
});

describe('rim', () => {
  it('is one and a half steps — 1.7124q', () => {
    expect(TREATMENTS_IN_Q.rim).toBeCloseTo(1.7123, 4);
  });

  it('is the strongest surface-relative signal in the system', () => {
    expect(TREATMENTS_IN_Q.rim).toBeGreaterThan(TREATMENTS_IN_Q.border);
    expect(TREATMENTS_IN_Q.rim).toBeGreaterThan(TREATMENTS_IN_Q.separator);
  });

  it('is directional — three stops, not one number', () => {
    const s = rimStops(0);
    expect(s.top).toBeGreaterThan(s.side);
    expect(s.side).toBeGreaterThan(s.bottom);
    // The approved numbers, in steps: 1.5 / 1.0 / 0.5.
    expect(s.top).toBeCloseTo(1.5, 10);
    expect(s.side).toBeCloseTo(1.0, 10);
    expect(s.bottom).toBeCloseTo(0.5, 10);
  });

  it('COMPRESSES at S7 — one step of room, three stops still', () => {
    const s = rimStops(7);
    expect(s.top).toBeCloseTo(1, 6);
    expect(s.side).toBeCloseTo(0.667, 3);
    expect(s.bottom).toBeCloseTo(0.333, 3);
    // The defect this prevents: rounding to the half-step grid gave 1 / 0.5 / 0.5,
    // two stops instead of three, so the edge lost its direction.
    expect(s.side).not.toBeCloseTo(s.bottom, 2);
    expect(s.top).toBeLessThanOrEqual(SIZE - 1 - 7);
  });

  it('INVERTS at S8 — no room above, so the edge reads as cut in', () => {
    const s = rimStops(8);
    expect(s.top).toBeLessThan(0);
    expect(s.side).toBeLessThan(0);
    expect(s.bottom).toBeLessThan(0);
    expect(s.top).toBeCloseTo(-RIM_STEPS, 6);
  });

  it('never puts a stop above the ceiling', () => {
    for (let host = 0; host < SIZE; host++) {
      const s = rimStops(host);
      expect(host + s.top).toBeLessThanOrEqual(SIZE - 1 + 1e-9);
    }
  });
});

describe('shadow', () => {
  it('peaks at one quantum — 2.08x the edge threshold', () => {
    expect(TREATMENTS_IN_Q.shadow).toBe(1);
    expect(TREATMENTS_OVER_EDGE.shadow).toBeCloseTo(2.08, 1);
  });

  it('solves the alpha per host, because one number cannot be 1q on both', () => {
    const overCanvas = shadowPeakAlpha(hexToRgb(LADDER[0]!));
    const overCeiling = shadowPeakAlpha(hexToRgb(LADDER[8]!));
    expect(overCanvas).toBeCloseTo(0.2477, 3);
    expect(overCeiling).toBeCloseTo(0.0890, 3);
    // A single alpha would be 2.8x too dark on the ceiling.
    expect(overCanvas / overCeiling).toBeGreaterThan(2.5);
  });

  it('actually lands one quantum below the host — verified by compositing', () => {
    for (let level = 0; level < SIZE; level++) {
      const host = hexToRgb(LADDER[level]!);
      const alpha = shadowPeakAlpha(host);
      const dropped = (oklchL(host) - oklchL(compositeShadow(alpha, host))) / Q;
      expect(dropped).toBeCloseTo(1, 3);
    }
  });

  it('is darker than every surface it can fall on', () => {
    // If it were not, the shadow would be invisible rather than wrong.
    for (let level = 0; level < SIZE; level++) {
      const host = hexToRgb(LADDER[level]!);
      const alpha = shadowPeakAlpha(host);
      const composited = compositeShadow(alpha, host);
      expect(oklchL(composited)).toBeLessThan(oklchL(host));
    }
  });

  it('has a radius LINEAR in height, with no constant', () => {
    const host = hexToRgb(LADDER[2]!);
    const a = shadowModel(1, host);
    const b = shadowModel(8, host);
    // far = 4 + h*6. The old `40 + h*3.2` was 93% constant at h=1.
    expect(a.far).toBeCloseTo(10, 6);
    expect(b.far).toBeCloseTo(52, 6);
    // The darkness does NOT grow with height. That was the defect.
    expect(a.peak).toBeCloseTo(b.peak, 10);
  });

  it('carries half the peak in each of two layers, so they overlap TO it', () => {
    const host = hexToRgb(LADDER[2]!);
    const { nearAlpha, peak } = shadowModel(3, host);
    const combined = 1 - (1 - nearAlpha) * (1 - nearAlpha);
    expect(combined).toBeCloseTo(peak, 6);
  });

  it('emits a CSS value whose alpha matches the solved peak', () => {
    const host = hexToRgb(LADDER[0]!);
    const css = floatShadow(2, host);
    const alphas = [...css.matchAll(/rgba\(1, 2, 3, ([0-9.]+)\)/g)].map((m) => parseFloat(m[1]!));
    expect(alphas).toHaveLength(2);
    const combined = 1 - (1 - alphas[0]!) * (1 - alphas[1]!);

    // CSS rounds the alpha to four decimals, so the emitted value is not bit-exact
    // with the solved one. That is acceptable ONLY if the error is negligible in
    // quanta — and the test says how negligible, rather than tolerating it blindly.
    const alphaError = Math.abs(combined - shadowPeakAlpha(host));
    expect(alphaError).toBeLessThan(0.001);

    // The real claim: the shadow the browser paints still lands one quantum down.
    const dropped = (oklchL(host) - oklchL(compositeShadow(combined, host))) / Q;
    expect(dropped).toBeCloseTo(1, 2);
  });
});
