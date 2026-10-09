import { connection } from "next/server";
import { headToHeads, isMatchdayLive, ProviderError } from "@epl/core";
import { footballNow, speaksForNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import { getLeagueSquads } from "../../squads";
import { matchupHref } from "@/app/league/routes";

// Whether there is a live scoreline of the reader's to put in the chrome, and what it says: one per tie, two in a
// double header. Every guard is a reason to draw nothing; the layout starts it once, un-awaited, for the desk's strip
// and the phone's Live plate. `YourMatchup` composes the same tie: two, so copied (CODE_RULES §1).

export type LiveTie = {
  /** Null when Fantrax gave no total; it prints as a dash, never a nought. */
  yours: number | null;
  theirs: number | null;
  opponent: string;
  href: string;
};

export async function liveTie(): Promise<LiveTie[]> {
  // Every route is per-request: the cookie below is read only in a live window, which flipped a prerendered page to dynamic at runtime.
  await connection();
  try {
    return await askedWhileLive();
  } catch (error: unknown) {
    // The layout draws this on every page, so a provider failing is no strip rather than no app.
    if (error instanceof ProviderError) return [];
    throw error;
  }
}

async function askedWhileLive(): Promise<LiveTie[]> {
  // `isMatchdayLive`, not `roundUnderway`: the strip claims right now. Football is asked first, so Fantrax is read only then.
  const snapshot = await footballNow();
  if (!isMatchdayLive(snapshot) || !speaksForNow(snapshot)) return [];

  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return [];

  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return [];

  const ties = headToHeads(squads.info.matchups, squads.info.teams, squads.roundPeriod, mine);
  if (ties.length === 0) return [];

  const { scores } = await liveScores(squads.roundPeriod);
  const yours = scores.get(mine)?.points ?? null;
  const told = ties.map((tie, at) => ({
    yours,
    theirs: scores.get(tie.opponent.teamId)?.points ?? null,
    opponent: tie.opponent.name,
    href: matchupHref(mine, undefined, undefined, at === 0 ? undefined : tie.opponent.teamId),
  }));
  return told.every((tie) => tie.yours === null && tie.theirs === null) ? [] : told;
}
