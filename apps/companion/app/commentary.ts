import { unstable_cache } from "next/cache";
import { PAGE_REVALIDATE, type FootballPlayer, type MatchEvent, mapRoundGoals } from "@epl/core";
import type { PlCommentaryLine } from "@epl/core";
import {
  fetchPlFixture,
  fetchPlRound,
  fetchPlTextstream,
  plCommentary,
  plFixtureCode,
  plTeamSheets,
} from "@epl/core";
import bridge from "../../../data/mappings/premierleague.json";

// The round's goals, from the Premier League's own feed.
//
// **One request for ten matches.** Their round-level fixtures read carries a
// `goals` array per match — scorer, assister, minute — so the question the Live
// tab exists to answer costs a single upstream call however many matches are on
// and however many phones are open. Counted across gameweeks 1-3, that array
// reconciles with the scoreline on 21 of 21 played fixtures.
//
// FPL cannot answer this at any price: it publishes no minute for a goal
// anywhere, and the sister repo's export runs about a day behind full time.
//
// Nothing about who is asking crosses in here — the real Premier League is the
// same for everybody — so it sits beside `footballNow` rather than inside
// `leagueCache`, and the ownership join happens a layer up in `matchday/wire`.

/** Premier League player id → Opta code, harvested from team sheets by
 *  `npm run pl-bridge`.
 *
 *  Asserted rather than parsed, once, at this edge — the same trade
 *  `squads.ts` records for the Fantrax bridge. `packages/core/tsconfig.json`
 *  includes only `src/**`, so core physically cannot read `data/`. */
const PL_TO_OPTA: Record<string, string> = bridge.players;

/** Opta code → FPL `code`, built in memory from the bootstrap the app already
 *  holds. `optaCode` is on all 652 elements, so this needs no new field and
 *  nothing per-season is written to disk. */
function optaToCode(players: readonly FootballPlayer[]): Map<string, number> {
  const codes = new Map<string, number>();
  for (const player of players) {
    if (player.optaCode !== null) codes.set(player.optaCode, player.code);
  }
  return codes;
}

/** The two hops as one map, which is what `mapRoundGoals` takes. */
function playerCodes(players: readonly FootballPlayer[]): Map<number, number> {
  const opta = optaToCode(players);
  const codes = new Map<number, number>();
  for (const [plId, optaCode] of Object.entries(PL_TO_OPTA)) {
    const code = opta.get(optaCode);
    if (code !== undefined) codes.set(Number(plId), code);
  }
  return codes;
}

/** One round's fixtures from the Premier League, cached per round.
 *
 *  Cached rather than read per request for the reason every other football read
 *  here is: sixteen managers refreshing all weekend cost them one request per
 *  window between them. Their own `cache-control` is `max-age=30`, which is
 *  already `PAGE_REVALIDATE`, so the two agree.
 *
 *  Kept raw rather than mapped because the mapping needs the bootstrap, which is
 *  a different cache with a different lifetime — folding them together would
 *  make the round's goals expire whenever a price changed. */
const plRound = unstable_cache(
  async (gameweek: number) => fetchPlRound(gameweek),
  ["pl-round"],
  { revalidate: PAGE_REVALIDATE },
);

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

/** One fixture's detail, cached per Premier League id.
 *
 *  Their own read, ~24 KB, and the only source of an unused substitute anywhere
 *  in this app — see `plTeamSheets`. Cached on the same thirty seconds as
 *  everything else here, so a match page refreshing all afternoon costs them one
 *  request per window between every reader.
 *
 *  Raw rather than mapped, for `plRound`'s reason: the mapping needs the
 *  bootstrap, which is a different cache with a different lifetime, and folding
 *  them together would expire a team sheet whenever a price changed. */
const plFixture = unstable_cache(
  async (id: number) => fetchPlFixture(id),
  ["pl-fixture"],
  { revalidate: PAGE_REVALIDATE },
);

/** Both sides' team sheets for one of OUR fixtures, or null.
 *
 *  **Two hops, because the two providers number matches differently.** We hold
 *  FPL's season-stable `code`; the Premier League wants its own id. The round
 *  read carries both — that is what `altIds=true` buys — so the round resolves
 *  the id and the detail read answers the sheet. Both are cached, and the round
 *  one is already warm from the wire.
 *
 *  Null, never a throw, at every step that can fail: a round they will not serve,
 *  a fixture our code does not appear in, a match nobody has named a side for.
 *  A team sheet is something a match page adds to a board it can already draw
 *  without one, so its absence costs a bench and never the screen.
 */
async function theirFixtureId(gameweek: number, fixtureCode: number): Promise<number | null> {
  const round = await plRound(gameweek);
  return round.content.find((fixture) => plFixtureCode(fixture) === fixtureCode)?.id ?? null;
}

export async function teamSheets(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return null;
    return plTeamSheets(await plFixture(id), optaToCode(players));
  } catch {
    return null;
  }
}

/** One fixture's commentary, cached per Premier League id.
 *
 *  4-19 KB for a played match and about 880 bytes for one nobody has started —
 *  an unstarted fixture answers its header and no events rather than a 404,
 *  which is what makes this safe to ask for on any match page. `pageSize` is
 *  `PL_TEXTSTREAM_PAGE` because the recorded match carries 107 events and the
 *  provider's own default truncates at 100. */
const plStream = unstable_cache(
  async (id: number) => fetchPlTextstream(id),
  ["pl-textstream"],
  { revalidate: PAGE_REVALIDATE },
);

/** Opta's minute-stamped commentary for one of OUR fixtures, newest first.
 *
 *  Craig, 5 Sep 2026: *"needs a match report section that we take from the
 *  premier league site."* This is that read, and it is the one DESIGN §2 has
 *  named as missing since the reference library was catalogued — "a
 *  text-commentary matchday". The mapper was written and tested on 4 Sep and
 *  drew nothing until now.
 *
 *  Empty, never a throw, at every step that can fail — the same tolerance
 *  `teamSheets` has and for the same reason: a report is something a match page
 *  adds to a screen it can already draw. */
export async function matchReport(
  gameweek: number,
  fixtureCode: number,
): Promise<PlCommentaryLine[]> {
  try {
    const id = await theirFixtureId(gameweek, fixtureCode);
    if (id === null) return [];
    return plCommentary((await plStream(id)).events.content);
  } catch {
    return [];
  }
}

/** Every goal's minute in ONE fixture, by FPL player code.
 *
 *  Craig, 5 Sep 2026: *"live match, we can add the minutes too this now."* He is
 *  right that it is new: the scoresheet's minutes came from the sister repo's
 *  match log, which has **20 of 380** matches in it, so the overwhelming
 *  majority of scorers had a name and no clock. The Premier League's round read
 *  carries a minute for every goal in all ten matches, for one request, and it
 *  is already cached for the wire.
 *
 *  Merged INTO the log rather than replacing it, and the log wins a tie: it is
 *  the sister repo's own reading of the same match, and where the two disagree
 *  the argument is not one this function should settle silently. In practice
 *  they never meet — 20 fixtures against 380.
 */
export async function matchGoalMinutes(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
  logged: Map<number, number[]>,
): Promise<Map<number, number[]>> {
  const minutes = new Map(logged);
  try {
    for (const goal of await roundGoals(gameweek, players)) {
      if (goal.fixtureCode !== fixtureCode) continue;
      // An own goal is credited to the man who put it in his own net, and the
      // scoresheet already prints him under the side he plays FOR with `og`
      // beside his name — so his minute belongs to him, not to the beneficiary.
      const code = goal.players[0];
      if (code === null || code === undefined || minutes.has(code)) continue;
      // `minute` reads "45+2" for stoppage time; the scoresheet takes numbers,
      // so the added-time half is dropped rather than guessed at. A goal in the
      // 47th minute of the first half is a 45th-minute goal on any teleprinter.
      const at = Number.parseInt(goal.minute, 10);
      if (Number.isNaN(at)) continue;
      minutes.set(code, [...(minutes.get(code) ?? []), at]);
    }
  } catch {
    // Their API refusing costs the minutes and never the scoresheet.
  }
  return minutes;
}
