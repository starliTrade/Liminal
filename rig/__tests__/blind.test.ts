import { describe, expect, it } from 'vitest';
import { evidenceCard, flipVerdict, sideFor, type Flip } from '../lib/blind';

describe('the blind side is decided by the seed, not by us', () => {
  it('gives the same answer for the same seed', () => {
    for (const s of [0, 1, 7, 999, 123456789]) {
      expect(sideFor(s)).toBe(sideFor(s));
    }
  });

  it('is balanced — a biased blind side is not blind', () => {
    let left = 0;
    const N = 20000;
    for (let s = 0; s < N; s++) if (sideFor(s) === 'left') left++;
    const share = left / N;
    expect(share).toBeGreaterThan(0.47);
    expect(share).toBeLessThan(0.53);
  });

  it('does not degenerate into alternating sides', () => {
    // A generator that just flips every time is predictable, and a
    // predictable side is a side the eye can learn.
    let runs = 1;
    let prev = sideFor(0);
    const N = 20000;
    for (let s = 1; s < N; s++) {
      const cur = sideFor(s);
      if (cur !== prev) runs++;
      prev = cur;
    }
    // Alternating forever would give ~N runs. Independent coin flips give ~N/2.
    expect(runs).toBeLessThan(N * 0.6);
    expect(runs).toBeGreaterThan(N * 0.4);
  });
});

describe('the reversal decides whether a difference is real', () => {
  it('is incomplete until both choices exist', () => {
    expect(flipVerdict(null, null)).toBe<Flip>('incomplete');
    expect(flipVerdict('a', null)).toBe<Flip>('incomplete');
    expect(flipVerdict(null, 'b')).toBe<Flip>('incomplete');
  });

  it('calls a held answer stable', () => {
    expect(flipVerdict('b10', 'b10')).toBe<Flip>('stable');
  });

  it('calls a moved answer flipped', () => {
    expect(flipVerdict('b05', 'b10')).toBe<Flip>('flipped');
  });

  it('catches a side bias — always picking the left panel is never stable', () => {
    // The failure the protocol exists to catch: the user has no preference
    // for a variant, only for a side. Phase 1 shows `order`, phase 2 shows
    // the swap. A left-picker therefore names two different variants.
    const variants = ['b05', 'b10'] as const;
    let checked = 0;
    for (let seed = 0; seed < 2000; seed++) {
      const order: [string, string] =
        sideFor(seed) === 'left' ? [variants[0], variants[1]] : [variants[1], variants[0]];
      const swapped: [string, string] = [order[1], order[0]];
      const first = order[0]; // always the left panel
      const second = swapped[0]; // still the left panel, now the other variant
      expect(flipVerdict(first, second)).toBe<Flip>('flipped');
      checked++;
    }
    expect(checked).toBe(2000);
  });

  it('records a real preference as stable no matter which side it was on', () => {
    const variants = ['b05', 'b10'] as const;
    for (let seed = 0; seed < 2000; seed++) {
      const order: [string, string] =
        sideFor(seed) === 'left' ? [variants[0], variants[1]] : [variants[1], variants[0]];
      const swapped: [string, string] = [order[1], order[0]];
      // The user wants b05, wherever it is.
      const first = order[0] === 'b05' ? order[0] : order[1];
      const second = swapped[0] === 'b05' ? swapped[0] : swapped[1];
      expect(flipVerdict(first, second)).toBe<Flip>('stable');
    }
  });
});

describe('the verdict becomes a record, or it is only a memory', () => {
  const card = evidenceCard({
    claim: 'a border is one step',
    prediction: 'I expect not to see 0.5 and to see 1.',
    first: '0.5 step',
    second: '1 step',
    flip: 'flipped',
    degraded: ['blur'],
    seed: 311251479,
  });

  it('carries the prediction, both choices, the reversal and the seed', () => {
    expect(card).toContain('a border is one step');
    expect(card).toContain('I expect not to see 0.5 and to see 1.');
    expect(card).toContain('0.5 step');
    expect(card).toContain('1 step');
    expect(card).toContain('flipped');
    expect(card).toContain('blur');
    expect(card).toContain('311251479');
  });

  it('says so when nothing was degraded', () => {
    const plain = evidenceCard({
      claim: 'c',
      prediction: 'p',
      first: 'a',
      second: 'a',
      flip: 'stable',
      degraded: [],
      seed: 1,
    });
    expect(plain).toContain('none');
    expect(plain).toContain('stable');
  });
});
