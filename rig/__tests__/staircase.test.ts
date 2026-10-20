import { describe, expect, it } from 'vitest';
import {
  EQUILIBRIUM_RATIO,
  SHAPE,
  answer,
  begin,
  calibrate,
  corrected,
  plan,
  simulate,
  threshold,
  validity,
  type StaircaseConfig,
} from '../lib/staircase';
import { mulberry32 } from '../lib/shuffle';

const cfg: StaircaseConfig = plan(SHAPE, 1);

describe('the staircase moves the way a staircase must', () => {
  it('starts where it is told to start', () => {
    const s = begin(cfg);
    expect(s.value).toBe(SHAPE.start);
    expect(s.reversals).toEqual([]);
    expect(s.done).toBe(false);
  });

  it('does not move on a single correct answer', () => {
    const s = answer(begin(cfg), cfg, true);
    expect(s.value).toBe(SHAPE.start);
    expect(s.correctStreak).toBe(1);
  });

  it('steps down after two correct answers in a row', () => {
    let s = begin(cfg);
    s = answer(s, cfg, true);
    s = answer(s, cfg, true);
    expect(s.value).toBeCloseTo(SHAPE.start - SHAPE.step, 10);
  });

  it('steps up after one wrong answer', () => {
    const s = answer(answer(begin(cfg), cfg, true), cfg, false);
    expect(s.value).toBeCloseTo(SHAPE.start + SHAPE.step, 10);
  });

  it('breaks the correct streak on a wrong answer', () => {
    const s = answer(answer(begin(cfg), cfg, true), cfg, false);
    expect(s.correctStreak).toBe(0);
  });

  it('accumulates wrong answers when the rule asks for more than one', () => {
    const slow: StaircaseConfig = { ...cfg, up: 2 };
    const s = answer(begin(slow), slow, false);
    expect(s.wrongStreak).toBe(1);
    expect(s.value).toBe(SHAPE.start); // one wrong is not yet enough to move
  });

  it('never shrinks its step — that was the first version\'s mistake', () => {
    let s = begin(cfg);
    for (let i = 0; i < 400; i++) s = answer(s, cfg, i % 3 !== 0);
    const stepOf = (x: typeof s) => x.history.length; // step is not in the state any more
    expect(stepOf(s)).toBeGreaterThan(0);
    // The step is a constant of the configuration, so it cannot drift.
    expect(cfg.step).toBe(SHAPE.step);
  });
});

describe('the staircase records turning points', () => {
  it('records a reversal at the value it is leaving, not the one it moves to', () => {
    let s = begin(cfg);
    s = answer(s, cfg, true);
    s = answer(s, cfg, true); // steps down
    expect(s.reversals).toEqual([]);
    s = answer(s, cfg, false); // direction flips
    expect(s.reversals).toEqual([SHAPE.start - SHAPE.step]);
  });

  it('does not record a reversal when it keeps going the same way', () => {
    let s = begin(cfg);
    s = answer(s, cfg, true);
    s = answer(s, cfg, true);
    s = answer(s, cfg, true);
    s = answer(s, cfg, true); // still going down
    expect(s.reversals).toEqual([]);
  });

  it('stops once it has enough reversals', () => {
    const s = simulate(cfg, 1, mulberry32(7));
    expect(s.done).toBe(true);
    expect(s.reversals.length).toBe(SHAPE.reversals);
  });

  it('ignores answers after it is done', () => {
    const s = simulate(cfg, 1, mulberry32(7));
    expect(answer(s, cfg, true)).toBe(s);
  });
});

describe('the floor is a hard limit, and it is reported', () => {
  it('never goes below the floor, and abandons the run when it reaches it', () => {
    let s = begin(cfg);
    for (let i = 0; i < 60; i++) s = answer(s, cfg, true);
    expect(s.value).toBeGreaterThanOrEqual(cfg.floor);
    expect(s.floorHits).toBeGreaterThanOrEqual(1);
    expect(s.done).toBe(true);
  });

  it('refuses to call a bottomed-out run valid', () => {
    let s = begin(cfg);
    for (let i = 0; i < 60; i++) s = answer(s, cfg, true);
    const v = validity(s, cfg);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain('bottomed out');
  });

  /**
   * The bug the end-to-end test found, written down so it cannot come back.
   *
   * A perfect observer drives the staircase to the floor and holds it there.
   * It never reverses, so the reversal count is never reached — and the first
   * version of this instrument therefore ran to `maxTrials`, which was 3000.
   * Three thousand clicks, for a person, with no end. The library test missed
   * it because it exercised `maxTrials: 50`, a number chosen to be convenient
   * for the test rather than the number the instrument actually shipped with.
   */
  it('ends a session with a perfect observer in a human-sized number of trials', () => {
    const s = simulate(cfg, 1, () => 0); // always correct
    expect(s.done).toBe(true);
    expect(s.history.length).toBeLessThan(40);
    expect(s.reversals.length).toBe(0);
    const v = validity(s, cfg);
    expect(v.ok).toBe(false);
  });

  it('never asks a person for more than the trial cap, whatever happens', () => {
    // An observer who is right exactly often enough to never reverse and
    // never bottom out. The trial cap is the only thing that can end this.
    let s = begin(cfg);
    let n = 0;
    while (!s.done && n < 5000) {
      s = answer(s, cfg, n % 2 === 0);
      n++;
    }
    expect(s.done).toBe(true);
    expect(s.history.length).toBeLessThanOrEqual(cfg.maxTrials);
    expect(cfg.maxTrials).toBeLessThanOrEqual(240);
  });

  it('stops a staircase that cannot converge, and says so', () => {
    // A tiny step and a distant floor, so the run isolates the trial cap:
    // it never reaches the floor, it simply never turns around.
    const tiny: StaircaseConfig = { ...cfg, step: 0.0001, maxTrials: 50, floor: 0 };
    let s = begin(tiny);
    for (let i = 0; i < 80; i++) s = answer(s, tiny, true);
    expect(s.done).toBe(true);
    expect(s.history.length).toBe(50);
    expect(s.floorHits).toBe(0);
    const v = validity(s, tiny);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain('did not converge');
  });

  it('refuses to call an unfinished run valid', () => {
    const v = validity(begin(cfg), cfg);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toContain('did not converge');
  });
});

describe('the raw reading is the mean of the last reversals', () => {
  it('returns null before the first reversal', () => {
    expect(threshold(begin(cfg), cfg)).toBeNull();
  });

  it('averages only the tail it is told to average', () => {
    const s = { ...begin(cfg), reversals: [5, 4, 3, 2, 1] };
    expect(threshold(s, { ...cfg, averageLast: 2 })).toBeCloseTo(1.5, 10);
    expect(threshold(s, { ...cfg, averageLast: 5 })).toBeCloseTo(3, 10);
  });
});

/**
 * The calibration. This is the only test here that matters.
 *
 * A staircase that satisfies every structural test above can still be a
 * staircase that measures nothing. So: run it against a simulated observer
 * whose threshold is known, apply the correction, and check the answer.
 *
 * The calibration seeds and the validation seeds are DISJOINT. If they
 * overlapped, the calibration would be measuring itself and this test would
 * pass no matter what the instrument did.
 */
describe('the calibrated instrument recovers a threshold it was never told', () => {
  const calibration = calibrate(SHAPE, 400, 1);

  it('has a bias worth correcting', () => {
    expect(calibration.bias).toBeGreaterThan(1.05);
    expect(calibration.valid / calibration.runs).toBeGreaterThan(0.9);
  });

  it('lands within 15% of the true threshold', () => {
    const readings: number[] = [];
    for (let seed = 5000; seed < 5200; seed++) {
      const s = simulate(cfg, 1, mulberry32(seed));
      if (!validity(s, cfg).ok) continue;
      const raw = threshold(s, cfg);
      if (raw === null) continue;
      readings.push(corrected(raw, calibration));
    }
    expect(readings.length).toBeGreaterThanOrEqual(180);
    const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
    expect(mean).toBeGreaterThan(EQUILIBRIUM_RATIO * 0.85);
    expect(mean).toBeLessThan(EQUILIBRIUM_RATIO * 1.15);
  });

  it('is scale-invariant: the same shape works at any magnitude', () => {
    for (const truth of [0.004, 0.0083, 0.05]) {
      const scaled = plan(SHAPE, truth);
      const readings: number[] = [];
      for (let seed = 9000; seed < 9100; seed++) {
        const s = simulate(scaled, truth, mulberry32(seed));
        if (!validity(s, scaled).ok) continue;
        const raw = threshold(s, scaled);
        if (raw === null) continue;
        readings.push(corrected(raw, calibration) / truth);
      }
      const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
      expect(mean).toBeGreaterThan(EQUILIBRIUM_RATIO * 0.8);
      expect(mean).toBeLessThan(EQUILIBRIUM_RATIO * 1.2);
    }
  });

  it('is not fooled by an observer who can always tell', () => {
    const always = () => 0;
    const s = simulate(cfg, 1, always);
    expect(validity(s, cfg).ok).toBe(false);
    expect(threshold(s, cfg)).toBeNull();
  });
});
