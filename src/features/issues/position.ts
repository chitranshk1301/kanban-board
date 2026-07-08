/** Gap used when appending to the start/end of a column. */
export const POSITION_GAP = 1024

/**
 * Fractional-midpoint positioning: dropping an issue between two
 * neighbours needs a single-row update (important under RLS — a member
 * moving their own issue cannot rewrite anyone else's rows).
 */
export function positionBetween(
  before: number | undefined,
  after: number | undefined,
): number {
  if (before === undefined && after === undefined) return POSITION_GAP
  if (before === undefined) return after! - POSITION_GAP
  if (after === undefined) return before + POSITION_GAP
  return (before + after) / 2
}

/**
 * After ~50 midpoint insertions in the same gap, float precision runs
 * out; callers should then invoke the normalize_column_positions RPC.
 */
export function gapExhausted(
  before: number | undefined,
  after: number | undefined,
): boolean {
  return (
    before !== undefined &&
    after !== undefined &&
    Math.abs(after - before) < 1e-9
  )
}
