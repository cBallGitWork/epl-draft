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

/** How a man's afternoon ended in Championship Manager's words, `on 7` and `sub 71`, both when both happened.
 *  Null for a man who played the whole match. */
export function subNote(player: IntelMatchPlayer): string | null {
  const notes: string[] = [];
  if (player.onAt !== null) notes.push(`on ${player.onAt}`);
  if (player.offAt !== null) notes.push(`sub ${player.offAt}`);
  return notes.length === 0 ? null : notes.join(" · ");
}

/** The minute each goal went in, by scorer. Own goals arrive as plain goals: the caller reconciles them against
 *  FPL's `own_goals`. */
export function goalMinutes(match: IntelMatch | undefined): Map<number, number[]> {
  const byCode = new Map<number, number[]>();
  for (const event of match?.events ?? []) {
    if (event.kind !== "goal") continue;
    byCode.set(event.code, [...(byCode.get(event.code) ?? []), event.minute]);
  }
  for (const minutes of byCode.values()) minutes.sort((a, b) => a - b);
  return byCode;
}

/** What each man did in the match, by FPL code. Not `matchPlayers`, which `identity/match.ts` owns. */
export function loggedPlayers(match: IntelMatch | undefined): Map<number, IntelMatchPlayer> {
  return new Map((match?.players ?? []).map((player) => [player.code, player]));
}

/** Where a SofaScore match position (`DC`, `DMC`, `FWL`; not the squad export's `CB`) sits, keeper to attack.
 *  Read off the prefix, so an unseen code still finds its line; no position, or an unknown one, sorts last. */
export function matchLine(position: string | null): number {
  if (position === null) return BENCH;
  return LINES.find(([prefix]) => position.startsWith(prefix))?.[1] ?? BENCH;
}

/** Prefixes in test order, longest first so `DMC` is not read as `D`, each with its own rank down the pitch. */
const LINES: readonly (readonly [string, number])[] = [
  ["GK", 0],
  ["DM", 2],
  ["D", 1],
  ["AM", 4],
  ["M", 3],
  ["FW", 5],
];

/** A man with no position did not start, so he sorts under the eleven. */
const BENCH = 6;
