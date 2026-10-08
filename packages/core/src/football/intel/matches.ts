import { groupedBy } from "../../grouped";
import type { IntelMatch, IntelMatchPlayer, IntelMatches } from "./types";

// The sister repo's match log: minutes, line-ups, positions and team figures FPL's scoresheet lacks. Where both
// answer, FPL wins. It covers only the matches logged so far, so ask per fixture, never per file.

/** Every logged match by FPL's per-season fixture id; a row without one is dropped, never kept under `NaN`. */
export function matchIntel(matches: IntelMatches | null): Map<number, IntelMatch> {
  const byFixture = new Map<number, IntelMatch>();
  if (matches === null) return byFixture;
  for (const match of matches.fixtures ?? []) {
    if (!Number.isInteger(match?.fplFixtureId)) continue;
    byFixture.set(match.fplFixtureId, match);
  }
  return byFixture;
}

/** The minute each goal went in, by scorer. Own goals arrive as plain goals: the caller reconciles them against
 *  FPL's `own_goals`. */
export function goalMinutes(match: IntelMatch | undefined): Map<number, number[]> {
  const goals = groupedBy((match?.events ?? []).filter((event) => event.kind === "goal"), (event) => event.code);
  return new Map([...goals].map(([code, scored]) => [code, scored.map((event) => event.minute).sort((a, b) => a - b)]));
}

/** What each man did in the match, by FPL code. Not `matchPlayers`, which `identity/match.ts` owns. */
export function loggedPlayers(match: IntelMatch | undefined): Map<number, IntelMatchPlayer> {
  return new Map((match?.players ?? []).map((player) => [player.code, player]));
}
