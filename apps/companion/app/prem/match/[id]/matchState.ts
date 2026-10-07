import { londonTime, type PlMatchFacts } from "@epl/core";
import type { Match } from "./match";

/** The overview's state line: the gameweek, then the live minute, FT or the kick-off, then the half-time score. */
export function stateLine(
  match: Pick<Match, "fixture" | "live" | "finished">,
  facts: Pick<PlMatchFacts, "halfTime"> | null,
): string {
  const { fixture, live, finished } = match;
  const round = fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
  // The Premier League sends a 0–0 half-time score before kick-off.
  const half =
    facts?.halfTime == null || fixture.status === "upcoming" ? null : `HT ${facts.halfTime.home}–${facts.halfTime.away}`;
  const parts = [round];
  if (live) parts.push(`Live ${fixture.minutes}′`);
  else if (finished) parts.push("FT");
  else if (fixture.kickoff !== null) parts.push(londonTime(fixture.kickoff));
  else parts.push("Kick-off TBC");
  if (half !== null) parts.push(half);
  return parts.join(" · ");
}
