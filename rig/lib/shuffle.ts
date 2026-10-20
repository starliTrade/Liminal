/**
 * Deterministic randomness.
 *
 * A trial must be reproducible: if a session says "left was lighter in 18 of
 * 24 trials", that exact sequence has to be replayable. So every shuffle is
 * seeded, and the seed is recorded with the result.
 */

/** mulberry32 — small, fast, and good enough to hide a side from a human. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, seeded. Returns a new array; never mutates the input. */
export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** A seed a human can write down and type back in. */
export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
