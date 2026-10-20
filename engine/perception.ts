/**
 * LIMINAL · L0 — PERCEPTION
 *
 * The physics. Nothing else in the system has a number until this file has one,
 * because every other number is a distance measured against these.
 *
 * All three thresholds were measured on the reader's own display with a
 * constant-stimuli psychophysical test, not chosen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE QUANTUM IS THE UNIT. Everything downstream is spoken in q, never in raw ΔL.
 *
 *   "a border is 1 step"      means 1.1416q
 *   "a separator is half"     means 0.5708q
 *   "a shadow peaks at one"   means 1.0000q
 *
 * Why: a raw ΔL of 0.0095 says nothing about whether an eye can see it. In q it
 * says "1.14 times the point where a boundary appears" — which is a claim that
 * can be checked, argued with, and kept when the display changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** ΔL at 50% detection. The perceptual quantum — the smallest step that exists. */
export const Q = 0.0083;

/** ΔL at 95% detection. The reliable boundary — a step you never miss. */
export const R = 0.0112;

/** R over Q. Measured 1.3494 — the margin between "sometimes" and "always". */
export const RELIABLE_OVER_QUANTUM = R / Q;

/**
 * THE EDGE THRESHOLD — 0.48q.
 *
 * The point where a boundary first appears. Measured separately from the quantum
 * and it is NOT half of it: an edge is a line, and a line is easier to see than a
 * field. This is the number a border, a rim and a shadow are all measured against.
 */
export const EDGE_THRESHOLD = 0.48 * Q;

/**
 * The two sub-thresholds. Both are BELOW the edge threshold, and both are
 * deliberate: a signal here is felt, not seen.
 *
 *   DISCRIMINATION  0.5q   you can tell two things apart if you look for it
 *   CONFIDENCE      1.0q   you are sure without looking for it
 *
 * The gap between them is the whole reason a half-step state change works: it is
 * detectable when compared and invisible when not.
 */
export const DISCRIMINATION = 0.5 * Q;
export const CONFIDENCE = 1.0 * Q;

/**
 * THE UNIVERSAL RATIO — every layered signal sits ~1.15x above its mechanism's
 * threshold. It was found in the archive across four independent treatments
 * (border 2.4x, rim 1.5x, shadow 2.08x, separator 1.0x of their own mechanisms)
 * and it is recorded here as an observation, not as a rule.
 *
 * It is NOT used to derive anything. Deriving from a ratio would be deriving from
 * a coincidence; the treatments are derived from their own thresholds and this
 * number is checked against them afterwards.
 */
export const SIGNAL_OVER_THRESHOLD = 1.15;
