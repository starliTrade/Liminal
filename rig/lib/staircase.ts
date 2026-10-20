/**
 * A two-alternative forced-choice staircase, and nothing else.
 *
 * Two patches, one question, no escape. Chance is 50%. The rule is
 * 2-down-1-up, which converges on p = 1/√2 = 0.7071 correct in a 2AFC task —
 * the conventional definition of a threshold.
 *
 * Why not "which one do you prefer": preference is not a measurement. It has
 * no null hypothesis. A detection answer does: if the judge cannot tell, they
 * guess, and guessing is 50%.
 *
 * This file has no React and no DOM. It is pure, so it can be tested — and it
 * is tested against a simulated observer whose threshold is known, because an
 * instrument that has never been calibrated against a known truth is a
 * decoration.
 *
 * ---------------------------------------------------------------------------
 * TWO THINGS THE FIRST VERSION GOT WRONG, AND WHAT REPLACED THEM
 *
 * 1. The step halved on every reversal. That looks like refinement and is
 *    actually a trap: the staircase gets stuck near its first turning point
 *    and finishes before it has drifted to the equilibrium it is supposed to
 *    measure. Measured bias: 1.74×. The step is now FIXED, and the run is
 *    longer instead. Measured bias: ~1.14×.
 *
 * 2. Even with a fixed step the estimator is biased, because a reversal is
 *    recorded where the observer failed (below the centre) or succeeded twice
 *    (above it), and those two are not symmetric. Chasing an unbiased
 *    estimator analytically is a research project. So the instrument is
 *    calibrated instead: `calibrate()` measures the bias by simulation, and
 *    the reading is divided by it. An instrument with a known bias is an
 *    instrument; an instrument with an unknown bias is a decoration.
 *
 * Filtering out invalid runs adds a selection bias of its own — the runs that
 * walked off the floor are the ones with low readings, so dropping them
 * pushes the mean up. The calibration is measured WITH the same filter
 * applied, so the two cancel.
 */

import { mulberry32 } from './shuffle';

export type StaircaseConfig = {
  /** Where the staircase starts, in the unit being measured. */
  readonly start: number;
  /** The step. Fixed: it does not shrink, and that is deliberate. */
  readonly step: number;
  /** The value may never go below this. */
  readonly floor: number;
  /** How many reversals to collect before stopping. */
  readonly reversals: number;
  /** Correct answers in a row needed to step down. */
  readonly down: number;
  /** Wrong answers in a row needed to step up. */
  readonly up: number;
  /** How many of the last reversals to average. */
  readonly averageLast: number;
  /** A hard stop, so a staircase that cannot converge says so instead of running forever. */
  readonly maxTrials: number;
  /**
   * How many times the staircase may want to go below the floor before the
   * run is abandoned.
   *
   * This is not a nicety. An observer who is essentially perfect drives the
   * staircase down and holds it there: it clamps, never reverses, and never
   * reaches the reversal count — so without this the session runs to
   * `maxTrials`. The end-to-end test found exactly that: 120 trials, zero
   * reversals, no end in sight, with a human clicking every one of them.
   *
   * One hit is enough. The equilibrium sits at 0.854 of the truth and the
   * floor at 0.005, so wanting to go below it means the threshold is far
   * outside what this shape can measure. The instrument should say so and
   * stop, not keep asking.
   */
  readonly maxFloorHits: number;
};

export type Trial = { readonly value: number; readonly correct: boolean };

export type StaircaseState = {
  readonly value: number;
  readonly correctStreak: number;
  readonly wrongStreak: number;
  readonly direction: 'down' | 'up' | null;
  readonly reversals: readonly number[];
  readonly history: readonly Trial[];
  /** How many times the staircase was clamped at the floor. */
  readonly floorHits: number;
  readonly done: boolean;
};

export function begin(config: StaircaseConfig): StaircaseState {
  return {
    value: config.start,
    correctStreak: 0,
    wrongStreak: 0,
    direction: null,
    reversals: [],
    history: [],
    floorHits: 0,
    done: false,
  };
}

export function answer(
  state: StaircaseState,
  config: StaircaseConfig,
  correct: boolean,
): StaircaseState {
  if (state.done) return state;

  const history = [...state.history, { value: state.value, correct }];
  const correctStreak = correct ? state.correctStreak + 1 : 0;
  const wrongStreak = correct ? 0 : state.wrongStreak + 1;

  const move = correct ? correctStreak >= config.down : wrongStreak >= config.up;
  if (!move) {
    return { ...state, correctStreak, wrongStreak, history };
  }

  const direction: 'down' | 'up' = correct ? 'down' : 'up';
  const isReversal = state.direction !== null && state.direction !== direction;

  // The turning point is the value we are leaving, not the one we move to.
  const reversals = isReversal ? [...state.reversals, state.value] : state.reversals;

  const moved = direction === 'down' ? state.value - config.step : state.value + config.step;
  const clamped = moved < config.floor;
  const value = clamped ? config.floor : moved;

  return {
    value,
    correctStreak: 0,
    wrongStreak: 0,
    direction,
    reversals,
    history,
    floorHits: state.floorHits + (clamped ? 1 : 0),
    done:
      reversals.length >= config.reversals ||
      history.length >= config.maxTrials ||
      state.floorHits + (clamped ? 1 : 0) >= config.maxFloorHits,
  };
}

/** The raw reading: the mean of the last `averageLast` reversals. */
export function threshold(state: StaircaseState, config: StaircaseConfig): number | null {
  const n = Math.min(config.averageLast, state.reversals.length);
  if (n === 0) return null;
  const tail = state.reversals.slice(-n);
  return tail.reduce((a, b) => a + b, 0) / tail.length;
}

export type Validity = { readonly ok: true } | { readonly ok: false; readonly reason: string };

/**
 * Whether this run produced a number worth writing down.
 *
 * A staircase that bottomed out did not measure anything — it hit the edge of
 * the instrument. Reporting its mean as a threshold would be a false green,
 * so it is refused here rather than noticed later.
 */
export function validity(state: StaircaseState, config: StaircaseConfig): Validity {
  // The floor is checked first, because it is the root cause. A run that
  // walked off the bottom of the instrument also fails to converge, and
  // reporting the symptom would hide the reason.
  if (state.floorHits > 0) {
    return { ok: false, reason: `bottomed out: clamped at the floor ${state.floorHits}×` };
  }
  if (state.reversals.length < config.reversals) {
    return {
      ok: false,
      reason: `did not converge: ${state.reversals.length}/${config.reversals} reversals in ${state.history.length} trials`,
    };
  }
  return { ok: true };
}

/** A psychometric function — the simulated observer used to calibrate. */
export function pCorrect(value: number, trueThreshold: number): number {
  const x = Math.log(Math.max(value, 1e-9) / trueThreshold);
  return 0.5 + 0.5 / (1 + Math.exp(-2.2 * x));
}

/**
 * Where a 2-down-1-up staircase should land, as a fraction of the true
 * threshold. Solve p²/(1+p) = 1−p  →  p = 1/√2 = 0.7071, then invert the
 * psychometric function.
 */
export const EQUILIBRIUM_RATIO = Math.exp(-0.15755); // ≈ 0.8542

// ---------------------------------------------------------------------------
// The shape, and its calibration
// ---------------------------------------------------------------------------

/**
 * The shape of a run, expressed as multiples of the expected threshold.
 *
 * The staircase is scale-invariant: the same shape recovers the same fraction
 * of the truth at any magnitude. That is why the shape can be calibrated once,
 * at 1, and the answer reused everywhere.
 */
export type Shape = {
  readonly start: number;
  readonly step: number;
  readonly floor: number;
  readonly reversals: number;
  readonly down: number;
  readonly up: number;
  readonly averageLast: number;
  readonly maxTrials: number;
  readonly maxFloorHits: number;
};

/**
 * Chosen by measurement, not by taste. Fourteen shapes were simulated against
 * a known truth and ranked on session length × error bar × reliability:
 *
 *   start 2 · step 0.15 · floor 0.005 · 16 reversals · average the last 8
 *   → 60 trials a session, 97.5% of runs valid, bias 1.125, one session ±23%.
 *
 * `maxTrials: 240` is four times the expected session. It is a human-facing
 * bound, not a statistical one: whatever goes wrong, a person must never be
 * asked to click more than ~240 times before the instrument admits it cannot
 * measure.
 *
 * The starting point matters more than it looks: starting at 6× the expected
 * threshold spends 68 of ~109 trials walking down to the answer before it
 * begins measuring anything.
 */
export const SHAPE: Shape = {
  start: 2,
  step: 0.15,
  floor: 0.005,
  reversals: 16,
  down: 2,
  up: 1,
  averageLast: 8,
  maxTrials: 240,
  maxFloorHits: 1,
};

/** Turn a shape into an absolute configuration, given a rough guess at the answer. */
export function plan(shape: Shape, expected: number): StaircaseConfig {
  return {
    start: expected * shape.start,
    step: expected * shape.step,
    floor: expected * shape.floor,
    reversals: shape.reversals,
    down: shape.down,
    up: shape.up,
    averageLast: shape.averageLast,
    maxTrials: shape.maxTrials,
    maxFloorHits: shape.maxFloorHits,
  };
}

export type Calibration = {
  /** Divide a raw reading by this. Measured against a known truth. */
  readonly bias: number;
  /** Relative spread of a single run. The honest error bar on one session. */
  readonly sd: number;
  readonly runs: number;
  readonly valid: number;
  readonly trialsPerRun: number;
};

function avg(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Measure the instrument's bias by running it against an observer whose
 * threshold is known to be exactly 1.
 *
 * `seed0` matters: calibration and validation must use disjoint seeds, or the
 * calibration is measuring itself and the test proves nothing.
 */
export function calibrate(shape: Shape, runs = 400, seed0 = 1): Calibration {
  const config = plan(shape, 1);
  const ratios: number[] = [];
  let trials = 0;
  for (let seed = seed0; seed < seed0 + runs; seed++) {
    const rand = mulberry32(seed);
    let s = begin(config);
    while (!s.done) s = answer(s, config, rand() < pCorrect(s.value, 1));
    trials += s.history.length;
    if (!validity(s, config).ok) continue;
    const t = threshold(s, config);
    if (t === null) continue;
    ratios.push(t / EQUILIBRIUM_RATIO);
  }
  const mean = avg(ratios);
  const sd = Math.sqrt(avg(ratios.map((r) => (r - mean) ** 2)));
  return {
    bias: mean,
    sd: sd / mean,
    runs,
    valid: ratios.length,
    trialsPerRun: Math.round(trials / runs),
  };
}

/** The reading, with the instrument's own bias divided out. */
export function corrected(raw: number, calibration: Calibration): number {
  return raw / calibration.bias;
}

/** Run a whole staircase against a simulated observer. Used by the tests. */
export function simulate(
  config: StaircaseConfig,
  trueThreshold: number,
  rand: () => number,
): StaircaseState {
  let state = begin(config);
  while (!state.done) {
    state = answer(state, config, rand() < pCorrect(state.value, trueThreshold));
  }
  return state;
}

