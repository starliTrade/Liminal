/**
 * The blind rules, separated from the instrument that draws them.
 *
 * These two functions decide whether an eye test means anything:
 *
 *   sideFor      - which variant sits on the left. If this is biased, the
 *                  test is not blind and every verdict it produces is noise
 *                  wearing the costume of a result.
 *   flipVerdict  - whether the answer survived the reversal. If this is
 *                  wrong, noise is recorded as a real difference.
 *
 * They live here, not inside the component, because a rule that cannot be
 * tested is a claim. A claim is not a rule.
 */

/** Which side the first variant sits on. Decided by the seed, not by us. */
export function sideFor(seed: number): 'left' | 'right' {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x) > 0.5 ? 'left' : 'right';
}

/**
 * What the reversal proved.
 *
 * The user names a variant, not a side. So:
 *   same variant twice  -> the preference is real   (stable)
 *   different variants  -> the answer moved with the layout, so it was the
 *                          layout talking, not the eye (flipped)
 *
 * A side bias lands in `flipped` automatically: the user picks the same
 * side both times, which is two different variants.
 */
export type Flip = 'flipped' | 'stable' | 'incomplete';

export function flipVerdict(first: string | null, second: string | null): Flip {
  if (first === null || second === null) return 'incomplete';
  return first === second ? 'stable' : 'flipped';
}

export type Evidence = {
  readonly claim: string;
  readonly prediction: string;
  readonly first: string;
  readonly second: string;
  readonly flip: Flip;
  readonly degraded: readonly string[];
  readonly seed: number;
};

/**
 * The verdict as a record.
 *
 * The protocol's eternity condition: a verdict is eternal only if it stays
 * true after you have forgotten why you ran it. That needs the prediction,
 * the two choices, and the failure condition written down together. An
 * on-screen verdict is a memory; this is the record.
 */
export function evidenceCard(e: Evidence): string {
  const flipLine =
    e.flip === 'flipped'
      ? '**flipped** - the answer moved with the layout. Not a real difference.'
      : e.flip === 'stable'
        ? '**stable** - the answer held. A real difference.'
        : '**incomplete**';

  return [
    '### Evidence card',
    '',
    '- **claim** - ' + e.claim,
    '- **prediction (written before looking)** - ' + e.prediction,
    '- **first choice** - ' + e.first,
    '- **second choice (after the swap)** - ' + e.second,
    '- **reversal** - ' + flipLine,
    '- **degradations** - ' + (e.degraded.length ? e.degraded.join(', ') : 'none'),
    '- **seed** - `' + e.seed + '`',
    '',
    'Valid only with the prediction, both choices, and the failure condition above.',
  ].join('\n');
}
