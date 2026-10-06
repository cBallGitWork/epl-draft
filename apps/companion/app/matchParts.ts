"use server";

import { unstable_cache } from "next/cache";
import { type MatchParts, fetchPlPlayerMatchStats, plMatchParts, plPlayerId, scoredStats, sumParts } from "@epl/core";
import { PAGE_REVALIDATE } from "./config";
import { plFixture, theirFixture } from "./plFeed";
import { leagueScoring } from "./scoring";

// What a player card's "Full match stats" asks the server for: his Opta parts and the rows this league scores.

/** One man and the matches the card shows, as the card holds them. */
export interface MatchAsk {
  /** FPL's `opta_code`, "p116535"; null for a man FPL gave none. */
  opta: string | null;
  fixtures: { gameweek: number; code: number }[];
  /** His roster slot, or his positions as "M/F". */
  position: string | null;
}

export interface MatchRead {
  /** Null when Opta would not say; a dash on every part, never a nought. */
  parts: MatchParts | null;
  /** Null when the league's scoring is unread, so every row shows. */
  scored: string[] | null;
}

const plPlayerMatch = unstable_cache(
  async (playerId: number, fixtureId: number) => fetchPlPlayerMatchStats(playerId, fixtureId),
  ["pl-player-match"],
  { revalidate: PAGE_REVALIDATE },
);

function isAsk(value: unknown): value is MatchAsk {
  const ask = value as MatchAsk | null;
  return (
    (ask?.opta === null || (typeof ask?.opta === "string" && /^p\d+$/.test(ask.opta))) &&
    Array.isArray(ask.fixtures) &&
    ask.fixtures.length <= 3 &&
    ask.fixtures.every((f) => Number.isInteger(f?.gameweek) && Number.isInteger(f.code)) &&
    (ask.position === null || (typeof ask.position === "string" && ask.position.length <= 8))
  );
}

/** His parts in one match: null when he was not on the pitch in it. Throws when the Premier League will not answer. */
async function partsIn(opta: string, gameweek: number, code: number): Promise<MatchParts | null> {
  const round = await theirFixture(gameweek, code);
  if (round === null) return null;
  const playerId = plPlayerId(await plFixture(round.id), opta);
  return playerId === null ? null : plMatchParts(await plPlayerMatch(playerId, round.id));
}

export async function readMatchParts(input: unknown): Promise<MatchRead> {
  if (!isAsk(input)) return { parts: null, scored: null };
  const scored = scoredStats(await leagueScoring(), input.position);
  const opta = input.opta;
  if (opta === null) return { parts: null, scored };
  try {
    const matches = await Promise.all(input.fixtures.map((f) => partsIn(opta, f.gameweek, f.code)));
    return { parts: sumParts(matches.filter((match) => match !== null)), scored };
  } catch {
    return { parts: null, scored };
  }
}
