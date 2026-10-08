import { mapTeamRosters, resolveRosters, type FootballSnapshot, type RawTeamRosters, type RosteredPeriod } from "@epl/core";
import { readBridge } from "../intel";

// The bridge as the paper's desks hold it, read once a firing off the committed file, and a period's rosters joined
// through it to the footballers they name.

export const BRIDGE = readBridge();

/** A period's rosters, each slot joined through the bridge to the footballer it names. */
export function rosteredPeriod(snapshot: FootballSnapshot, raw: RawTeamRosters): RosteredPeriod {
  return resolveRosters(snapshot, mapTeamRosters(raw), BRIDGE);
}
