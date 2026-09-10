import {
  type FootballPlayer,
  type MatchEvent,
  type RoundBreak,
  mapRoundBreaks,
  mapRoundGoals,
} from "@epl/core";
import type { ProseLine } from "@epl/core";
import { plCommentary, plWireLines } from "@epl/core";
import { plRound, plStream, playerCodes } from "./plFeed";

// The ROUND's questions, from the Premier League's own feed. One match's are next
// door in `matchFeed.ts`; the reads and the identity join both use are in
// `plFeed.ts`.
//
// **One request for ten matches.** Their round-level fixtures read carries a
// `goals` array per match — scorer, assister, minute — so the question the Live
// tab exists to answer costs a single upstream call however many matches are on
// and however many phones are open. Counted across gameweeks 1-3, that array
// reconciles with the scoreline on 21 of 21 played fixtures.
//
// FPL cannot answer this at any price: it publishes no minute for a goal
// anywhere, and the sister repo's export runs about a day behind full time.

/** Every goal in the round, joined to FPL players and ordered as they happened.
 *
 *  Ordered on `absolute` — kick-off plus elapsed — and NOT on the match clock: a
 *  12:30 match and a 17:30 one both start their own clock at nought, so a round
 *  sorted on `seconds` puts the afternoon in the wrong sequence. A goal whose
 *  match carries no kick-off time has no place in that order and sorts last
 *  rather than into 1970.
 *
 *  Newest first, because the question this answers is "what just happened".
 *
 *  Returns `[]` rather than throwing when their API refuses. That is not the
 *  swallow §2 forbids: the caller renders the round's football either way, and
 *  an empty wire under a live scoreline is a panel with nothing in it, not a
 *  claim that nothing happened — `Wire` says which it is from `speaksForNow`. */
export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
): Promise<MatchEvent[]> {
  const round = await plRound(gameweek);
  const goals = mapRoundGoals(round.content, playerCodes(players));
  return goals.sort((a, b) => (b.absolute ?? 0) - (a.absolute ?? 0));
}

/** Every interval reached in the round — half time and full time, oldest first.
 *
 *  Craig, 5 Sep 2026: *"Wire should also include half and full time."* Off the
 *  SAME cached round read the goals come from, so the wire's whole cost is still
 *  one upstream request for ten matches. The per-fixture textstream carries
 *  Opta's own `end 1` and `end 14` lines and would cost ten.
 *
 *  Empty rather than a throw, for `roundGoals`' reason: the caller draws the
 *  round either way, and a wire missing its full-time lines is a wire with fewer
 *  lines rather than a claim that nothing has finished. */
export async function roundBreaks(gameweek: number): Promise<RoundBreak[]> {
  return mapRoundBreaks((await plRound(gameweek)).content);
}

/** Every line of Opta's commentary across the round, newest first, with the
 *  club names cut down.
 *
 *  **The second wire** (Craig, 5 Sep 2026: *"WE use the match report text? … but
 *  we can shortern it"*, and *"maybe we have different versions of the wire on
 *  the home page for now and decide which is best"*). It answers three of his
 *  asks at once, because Opta's own sentences already carry what our row wire
 *  cannot: `GOAL OVERTURNED BY VAR: Florian Wirtz scores but the goal is ruled
 *  out` and `Penalty Brentford. Kevin Schade draws a foul in the penalty area` —
 *  the VAR line and the man who won a penalty, which our league pays a fantasy
 *  assist for.
 *
 *  **And it is the expensive wire, which is the point of offering both.** The row
 *  wire is ONE request for ten matches, off the round read. This is one per
 *  fixture that has kicked off — up to ten more, ~200 KB, per thirty-second
 *  window — because the textstream is the only place the prose exists and there
 *  is no round-level equivalent. Both are cached on the same window, so the cost
 *  is per window and not per reader; a reader who never opens this variant pays
 *  none of it.
 *
 *  Ordered on `kickoff + seconds`, not on `seconds`: a 12:30 match and a 17:30
 *  one both start their own clock at nought, and `plCommentary` sorts within one
 *  match by construction. An unstarted fixture is skipped rather than asked —
 *  its stream is a header and no events.
 *
 *  Empty, never a throw, at every step: a wire is something this page adds to a
 *  round it can already draw. */
export async function roundCommentary(gameweek: number): Promise<WireProseLine[]> {
  const round = await plRound(gameweek).catch(() => null);
  if (round === null) return [];

  // Opta's long name to the short one, off the SAME object — each fixture's
  // `teams[].team` carries both, so the shortener needs no table of our own and
  // no second read.
  const names = new Map<string, string>();
  for (const fixture of round.content) {
    for (const side of fixture.teams ?? []) {
      const long = side.team?.name;
      const short = side.team?.club?.abbr ?? side.team?.shortName;
      if (long && short) names.set(long, short);
    }
  }

  const lines: WireProseLine[] = [];
  for (const fixture of round.content) {
    if (fixture.status === "U") continue;
    const kickoff = fixture.kickoff?.millis;
    const stream = await plStream(fixture.id).catch(() => null);
    if (stream === null) continue;
    for (const line of plWireLines(
      fixture.id,
      plCommentary(stream.events.content),
      names,
      fixture.clock?.secs ?? null,
    )) {
      lines.push({ ...line, at: kickoff === undefined ? null : kickoff + line.seconds * 1000 });
    }
  }

  return lines.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

/** A prose line placed on the ROUND's clock.
 *
 *  `ProseLine.seconds` orders one match; `at` is kick-off plus that, which is the
 *  only field that orders ten. A 12:30 match and a 17:30 one both start their own
 *  clock at nought. Null for a fixture the feed dated and did not time. */
export interface WireProseLine extends ProseLine {
  at: number | null;
}
