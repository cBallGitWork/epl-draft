// A fixture's two ends, as the match report and the draft report both name them.

export type Side = "home" | "away";

export const SIDES: readonly Side[] = ["home", "away"];

/** The other end of the fixture. */
export const otherSide = (side: Side): Side => (side === "home" ? "away" : "home");
