import { type BreakdownLine, type FplPick, fplScoreName } from "@epl/core";

/** FPL's identifier for time on the pitch, the one line it sends for a man who never got on. */
const MINUTES = "minutes";

/** His round as `Breakdown`'s rows: each line that happened or scored, then the armband's share,
 *  so the rows add up to what the pick contributed. */
export function scoreRows(pick: FplPick): BreakdownLine[] {
  const rows: BreakdownLine[] = pick.lines
    .filter((line) => line.value !== 0 || line.points !== 0)
    .map((line) => ({
      code: line.identifier,
      name: fplScoreName(line.identifier),
      points: line.points,
      value: String(line.value),
    }));
  if (pick.multiplier > 1 && pick.points !== pick.scored) {
    rows.push({
      code: "captain",
      name: "Captain",
      points: pick.points - pick.scored,
      value: `×${pick.multiplier}`,
    });
  }
  return rows;
}

/** The minutes FPL has him on, nought for a man it has none for. */
export function minutesOf(pick: FplPick): number {
  return pick.lines.find((line) => line.identifier === MINUTES)?.value ?? 0;
}
