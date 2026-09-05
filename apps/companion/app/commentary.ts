import { unstable_cache } from "next/cache";
import { PAGE_REVALIDATE, type FootballPlayer, type MatchEvent, mapRoundGoals } from "@epl/core";
import { fetchPlFixture, fetchPlRound, plFixtureCode, plTeamSheets } from "@epl/core";
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
export async function teamSheets(
  gameweek: number,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  try {
    const round = await plRound(gameweek);
    const theirs = round.content.find((fixture) => plFixtureCode(fixture) === fixtureCode);
    if (theirs === undefined) return null;
    return plTeamSheets(await plFixture(theirs.id), optaToCode(players));
  } catch {
    return null;
  }
}
