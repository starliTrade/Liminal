/**
 * The numbers we are starting from.
 *
 * Every one of these is UNVERIFIED in this repository. They are carried over
 * from the archive so the rig has something to render — and each one is an
 * item in LIMINAL-LEDGER.md that must be re-measured before it becomes law.
 *
 * Nothing here may be imported by the engine. This is the rig's starting
 * point, not the system's truth.
 */
export const FROM_ARCHIVE = {
  /** ۰.۹ — the canvas lightness. A choice in the archive, not a measurement. */
  canvasL: 0.128,
  /** ۰.۸ — chroma of the neutral ramp. */
  neutralC: 0.0112,
  /** ۰.۱ — one perceptual step, as measured in the archive. */
  q: 0.0083,
} as const;
