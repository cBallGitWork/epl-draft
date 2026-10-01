import { connection } from "next/server";
import { headToHead, isMatchdayLive, ProviderError } from "@epl/core";
import { footballNow, speaksForNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import { getLeagueSquads } from "../../squads";
import { matchupHref } from "@/app/league/routes";

// Whether there is a live scoreline of the reader's to put in the chrome, and
// what it says.
//
// Every one of the guards below is a reason to render nothing at all, and
// nothing is the right answer to all of them — a strip that appears empty, or
// appears on a Wednesday, is furniture. Between them they mean: football is
// actually being played, we know that recently enough to say so in the present
// tense, this reader is signed in, his league has drafted, and Fantrax has
// given a number for at least one side of his tie.
//
// **The question left `LiveNow` when it grew a second asker.** The strip on the
// desk and the count on the phone's Live plate are one fact drawn twice, and a
// component that answers a question cannot also be the answer — the layout
// starts this ONCE, un-awaited, and hands the same promise to both, so the
// second wearer costs Fantrax nothing.
//
// The composition below is `YourMatchup`'s, copied rather than shared. Two is a
// coincidence (CODE_RULES §1) and the two genuinely differ: that one is the
// answer and this is the question. A third caller would say what varies.

export type LiveTie = {
  /** Null is a total Fantrax did not give, and it prints as a dash. A live
   *  scoreline is the last place to invent a nought. */
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
  // `isMatchdayLive` and not `roundUnderway`: the strip claims right now. Asked of the football
  // first, so Fantrax is not read at all for the six days a week it has nothing to say here.
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
