/**
 * Raw colour, and nothing else.
 *
 * The rig must NOT import the engine. An instrument that shares code with the
 * thing it measures cannot detect a bug in it — it inherits the bug and then
 * reports agreement. So the rig speaks OKLCH directly, in plain CSS, and the
 * engine is a stranger to it.
 */

/** A colour in OKLCH. L is 0..1, C is 0..~0.4, H is degrees. */
export type Oklch = { readonly L: number; readonly C: number; readonly H: number };

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/** A CSS colour string. Six decimals on L, so a step of 0.000001 survives. */
export function oklch({ L, C, H }: Oklch, alpha = 1): string {
  const a = alpha >= 1 ? '' : ` / ${round(alpha, 4)}`;
  return `oklch(${round(L, 6)} ${round(C, 6)} ${round(H, 4)}${a})`;
}

/** Move a colour along the lightness axis, clamped to what a display can show. */
export function shiftL(c: Oklch, dL: number): Oklch {
  return { L: clamp(c.L + dL, 0, 1), C: c.C, H: c.H };
}

/**
 * sRGB hex — for the rare case a raw value has to leave the rig (a report, a
 * screenshot). Not used for rendering: `oklch()` is exact, hex is not.
 */
export function toHex({ L, C, H }: Oklch): string {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = lin.map((v) => {
    const c = clamp(v, 0, 1);
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  });
  return (
    '#' +
    enc
      .map((v) =>
        Math.round(clamp(v, 0, 1) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
