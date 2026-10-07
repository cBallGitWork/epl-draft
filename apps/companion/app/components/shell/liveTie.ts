import { connection } from "next/server";
import { headToHead, isMatchdayLive, ProviderError } from "@epl/core";
import { footballNow, speaksForNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import { getLeagueSquads } from "../../squads";
import { matchupHref } from "@/app/league/routes";

// Whether there is a live scoreline of the reader's to put in the chrome, and what it says. Every
// guard is a reason to draw nothing; the layout starts it once, un-awaited, for the desk's strip and
// the phone's Live plate. `YourMatchup` composes the same tie: two, so copied (CODE_RULES §1).

export type LiveTie = {
  /** Null when Fantrax gave no total; it prints as a dash, never a nought. */
  yours: number | null;
  theirs: number | null;
  opponent: string;
  href: string;
};

export async function liveTie(): Promise<LiveTie | null> {
  // Every route is per-request: the cookie below is read only in a live window, which flipped a prerendered page to dynamic at runtime.
  await connection();
  try {
    return await askedWhileLive();
  } catch (error: unknown) {
    // The layout draws this on every page, so a provider failing is no strip rather than no app.
    if (error instanceof ProviderError) return null;
    throw error;
  }
}

async function askedWhileLive(): Promise<LiveTie | null> {
  // `isMatchdayLive`, not `roundUnderway`: the strip claims right now. Football is asked first, so Fantrax is read only then.
  const snapshot = await footballNow();
  if (!isMatchdayLive(snapshot) || !speaksForNow(snapshot)) return null;

  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return null;

  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return null;

  const pairing = headToHead(squads.info.matchups, squads.info.teams, squads.roundPeriod, mine);
  if (pairing === undefined) return null;

  const { scores } = await liveScores(squads.roundPeriod);
  const yours = scores.get(pairing.team.teamId)?.points ?? null;
  const theirs = scores.get(pairing.opponent.teamId)?.points ?? null;
  if (yours === null && theirs === null) return null;

  return {
    yours,
    theirs,
    opponent: pairing.opponent.name,
    href: matchupHref(pairing.team.teamId),
  };
}
