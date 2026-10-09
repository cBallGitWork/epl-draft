import { unstable_cache } from "next/cache";
import {
  type FootballPlayer,
  type RawPlFixture,
} from "@epl/core";
import {
  fetchHighlightsFeed,
  fetchPlFixture,
  fetchPlMatchStats,
  fetchPlRound,
  fetchPlTextstream,
  plFixtureCode,
} from "@epl/core";
import bridge from "../../../data/mappings/premierleague.json";
import { COMMENTARY_REVALIDATE, LIVE_REVALIDATE, PAGE_REVALIDATE } from "./config";

// The Premier League feed's cached reads, the identity join, and the hop between their match ids
// and ours; `commentary.ts` asks the round's questions, `matchFeed.ts` one match's.
// Nothing about who is asking may cross into these caches.

/** Premier League player id → Opta code, from `npm run pl-bridge`. Asserted here, not parsed in
 *  core: core's tsconfig cannot read `data/`. */
const PL_TO_OPTA: Record<string, string> = bridge.players;

/** Opta code → FPL `code`, built from the bootstrap already held, so nothing per-season is stored. */
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

/** One round's fixtures, cached per round at `LIVE_REVALIDATE` as the wire's goals come from here.
 *  Raw, because mapping needs the bootstrap, which is cached on a different lifetime. */
export const plRound = unstable_cache(
  async (gameweek: number) => fetchPlRound(gameweek),
  ["pl-round"],
  { revalidate: LIVE_REVALIDATE },
);

/** One fixture's detail, raw and cached per Premier League id: the only source of unused substitutes. */
export const plFixture = unstable_cache(
  async (id: number) => fetchPlFixture(id),
  ["pl-fixture"],
  { revalidate: PAGE_REVALIDATE },
);

/** One fixture's commentary, cached per Premier League id. An unstarted fixture answers with no
 *  events rather than a 404, so any match page may ask. */
export const plStream = unstable_cache(
  async (id: number) => fetchPlTextstream(id),
  ["pl-textstream"],
  { revalidate: COMMENTARY_REVALIDATE },
);

/** Every Opta metric for both sides of one match, cached per Premier League id. */
export const plStats = unstable_cache(
  async (id: number) => fetchPlMatchStats(id),
  ["pl-match-stats"],
  { revalidate: PAGE_REVALIDATE },
);

/** Their round entry for one of our fixtures, carrying their id and both teams, or null.
 *  Throws what `plRound` throws, so callers can tell "no such fixture" from "their API is down". */
export async function theirFixture(
  gameweek: number,
  fixtureCode: number,
): Promise<RawPlFixture | null> {
  const round = await plRound(gameweek);
  return round.content.find((fixture) => plFixtureCode(fixture) === fixtureCode) ?? null;
}

/** Their fixture for one of ours, read through `read`, answering `absent` at every step that can fail: a null
 *  gameweek (a postponement loses its round), no such fixture, or their API down. */
export async function ofFixture<T>(
  gameweek: number | null,
  fixtureCode: number,
  absent: T,
  read: (fixture: RawPlFixture) => Promise<T>,
): Promise<T> {
  if (gameweek === null) return absent;
  try {
    const fixture = await theirFixture(gameweek, fixtureCode);
    return fixture === null ? absent : await read(fixture);
  } catch {
    return absent;
  }
}

/** The highlights playlist as raw XML, one cache key for every match page; throws on a bad response. */
export const highlightsFeed = unstable_cache(
  async () => fetchHighlightsFeed(),
  ["youtube-highlights"],
  { revalidate: PAGE_REVALIDATE },
);
