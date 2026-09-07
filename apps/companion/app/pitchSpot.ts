// Where a role stands on a pitch.
//
// Beside `realPositions.ts` and not in core, on that file's own precedent: this
// reads the sister repo's twenty role codes, which are a DISPLAY vocabulary the
// app owns, and it has a test here the way that one does.
//
// **It plots a role, not a touch.** The comparison screen wants the shape of
// Fantasy Football Scout's Player Maps — two men on one pitch, attacking in
// opposite directions — and that reference plots real event coordinates. **We
// hold none.** FPL publishes no location at all, the Premier League's own feed
// is per-team, and the sister repo's SofaScore shots and average positions are
// staged but not exported (`docs/providers/intel-export.md` is the contract that
// will fill them). Drawing a scatter of invented points would be the confident
// wrong answer PRODUCT.md's fourth principle forbids, so this draws the one
// locational fact we actually have — the weighted role — as one marker per man.
//
// It is a DERIVED reading and takes the cyan slot for that reason (DESIGN §3),
// the same as the position line on the player screen it comes from.
//
// When the shot and touch exports land, the markers become the scatter and this
// file keeps its job: the pitch it draws on does not change.

/** A spot on a pitch, in percent, attacking LEFT to RIGHT.
 *
 *  `x` runs from his own goal line at 0 to the one he is attacking at 100; `y`
 *  from the left touchline at 0 to the right at 100. Mirroring for the second
 *  man is the drawing's job, not this table's — a role does not know which way
 *  it has been asked to face. */
export interface Spot {
  x: number;
  y: number;
}

/** How far up the pitch each role stands.
 *
 *  Read off the role rather than off the letters, for `realPositions.ts`' own
 *  reason: `CM` is centre midfield and `CF` is centre forward, so a rule keying
 *  on the first letter would be wrong twice in this table. */
const DEPTH: Record<string, number> = {
  GK: 6,
  CB: 20,
  LCB: 20,
  RCB: 20,
  LB: 24,
  RB: 24,
  LWB: 38,
  RWB: 38,
  DM: 38,
  CM: 50,
  LM: 52,
  RM: 52,
  AM: 66,
  CAM: 66,
  LAM: 66,
  RAM: 66,
  LW: 72,
  RW: 72,
  CF: 82,
  ST: 88,
};

/** Which side of the pitch. A role with no side stands in the middle — CM's own
 *  vocabulary gives `ST` no flank, and a striker in the centre circle's lane is
 *  what the game means by that. */
const LANE: Record<string, number> = {
  LCB: 34,
  LB: 16,
  LWB: 14,
  LM: 16,
  LAM: 22,
  LW: 14,
  RCB: 66,
  RB: 84,
  RWB: 86,
  RM: 84,
  RAM: 78,
  RW: 86,
};

/** Where he plays, or null for a code this table has never seen.
 *
 *  Null rather than a guess at the centre spot: an unknown role drawn in the
 *  middle of the pitch is a claim, and `realPositions.ts` already sets the rule
 *  that an unknown code is printed verbatim rather than interpreted. The screen
 *  says it cannot place him instead of placing him wrongly. */
export function pitchSpot(position: string | null): Spot | null {
  if (position === null) return null;
  const x = DEPTH[position];
  if (x === undefined) return null;
  return { x, y: LANE[position] ?? 50 };
}
