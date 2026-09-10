import { unstable_cache } from "next/cache";
import { PAGE_REVALIDATE, type FootballPlayer } from "@epl/core";
import { fetchPlFixture, fetchPlRound, fetchPlTextstream, plFixtureCode } from "@epl/core";
import bridge from "../../../data/mappings/premierleague.json";

// The Premier League feed's spine: the identity join, the three cached reads, and
// the id hop between their match numbers and ours. Nothing here answers a
// question — `commentary.ts` asks the round's, `matchFeed.ts` asks one match's.
//
// **Its own file because both of those need all of it.** `commentary.ts` reached
// 344 lines carrying the spine plus both sets of questions, past CODE_RULES §4's
// hard ceiling, and the split that presented itself was already the one the
// consumers make: `matchday/*` imports only round functions and
// `prem/match/[id]/*` imports only match ones. The spine is what they share, so
// it is the third file rather than a copy in each.
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
export function optaToCode(players: readonly FootballPlayer[]): Map<string, number> {
  const codes = new Map<string, number>();
  for (const player of players) {
    if (player.optaCode !== null) codes.set(player.optaCode, player.code);
  }
  return codes;
}

/** The two hops as one map, which is what `mapRoundGoals` takes. */
export function playerCodes(players: readonly FootballPlayer[]): Map<number, number> {
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
export const plRound = unstable_cache(
  async (gameweek: number) => fetchPlRound(gameweek),
  ["pl-round"],
  { revalidate: PAGE_REVALIDATE },
);

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
export const plFixture = unstable_cache(
  async (id: number) => fetchPlFixture(id),
  ["pl-fixture"],
  { revalidate: PAGE_REVALIDATE },
);

/** One fixture's commentary, cached per Premier League id.
 *
 *  4-19 KB for a played match and about 880 bytes for one nobody has started —
 *  an unstarted fixture answers its header and no events rather than a 404,
 *  which is what makes this safe to ask for on any match page. `pageSize` is
 *  `PL_TEXTSTREAM_PAGE` because the recorded match carries 107 events and the
 *  provider's own default truncates at 100. */
export const plStream = unstable_cache(
  async (id: number) => fetchPlTextstream(id),
  ["pl-textstream"],
  { revalidate: PAGE_REVALIDATE },
);

/** Their id for one of OUR fixtures, or null.
 *
 *  **Two hops, because the two providers number matches differently.** We hold
 *  FPL's season-stable `code`; the Premier League wants its own id. The round
 *  read carries both — that is what `altIds=true` buys — so the round resolves
 *  the id and a detail read can then answer. Both are cached, and the round one
 *  is already warm from the wire.
 *
 *  Throws what `plRound` throws: every caller here is already inside a `try` that
 *  turns a refusal into an absent block, and swallowing it twice would leave them
 *  unable to tell "no such fixture" from "their API is down". */
export async function theirFixtureId(
  gameweek: number,
  fixtureCode: number,
): Promise<number | null> {
  const round = await plRound(gameweek);
  return round.content.find((fixture) => plFixtureCode(fixture) === fixtureCode)?.id ?? null;
}
