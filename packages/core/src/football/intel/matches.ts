import type { IntelMatch, IntelMatchPlayer, IntelMatches } from "./types";

// The sister repo's match log, read the way `map.ts` reads its neighbours: pure,
// parsing rather than asserting, and refusing what it cannot vouch for.
//
// **It is the OTHER half and never a second copy of the first.** FPL's fixture
// `stats` block gives the scoresheet for all 380 matches — scorers, assisters,
// own goals, penalties, cards, saves, bonus, a per-fixture bps — and carries no
// minute, no line-up, no position and no team figure. This carries exactly those
// and repeats none of the first. Where both could answer, the football layer's
// own read wins, because it covers the whole season and this covers what the
// sister repo has got round to.
//
// **20 of 380 on 4 Sep 2026**, rounds 1 and 2, running about a day behind full
// time. So the question a screen asks is never "does the file exist" but "is
// THIS match in it", and `matchIntel` answers per fixture.

/** Every logged match, by FPL's per-season fixture id.
 *
 *  A row with no usable fixture id is dropped rather than kept under `NaN`,
 *  which is `squadIntel`'s rule for the same reason: several matches collapsing
 *  into one key is worse than their being absent. */
export function matchIntel(matches: IntelMatches | null): Map<number, IntelMatch> {
  const byFixture = new Map<number, IntelMatch>();
  if (matches === null) return byFixture;
  for (const match of matches.fixtures ?? []) {
    if (!Number.isInteger(match?.fplFixtureId)) continue;
    byFixture.set(match.fplFixtureId, match);
  }
  return byFixture;
}

/** How a man's afternoon ended, in Championship Manager's own words.
 *
 *  `cm9900/16.jpg` writes `sub 71` against a man taken off and `on 7` against
 *  the one who replaced him, and `docs/ui/reference/README.md` records the ink:
 *  ORANGE means an event or a change, never a figure. Null for a man who played
 *  the whole match, because "he was not substituted" is not a note.
 *
 *  **Both, when both happened.** A substitute taken off again is rare and real,
 *  and a screen printing only one of the two would be describing half his match. */
export function subNote(player: IntelMatchPlayer): string | null {
  const notes: string[] = [];
  if (player.onAt !== null) notes.push(`on ${player.onAt}`);
  if (player.offAt !== null) notes.push(`sub ${player.offAt}`);
  return notes.length === 0 ? null : notes.join(" · ");
}

/** The minute each goal went in, against the man who scored it.
 *
 *  **Own goals are not filtered out here and must be reconciled by the caller.**
 *  SofaScore files an own goal as a plain `goal` with no flag — verified across
 *  all 20 logged matches, where the only three scorers FPL does not also call
 *  scorers are exactly the three in its `own_goals` lists. The caller holds
 *  FPL's block and is the only place that can tell them apart. */
export function goalMinutes(match: IntelMatch | undefined): Map<number, number[]> {
  const byCode = new Map<number, number[]>();
  for (const event of match?.events ?? []) {
    if (event.kind !== "goal") continue;
    byCode.set(event.code, [...(byCode.get(event.code) ?? []), event.minute]);
  }
  for (const minutes of byCode.values()) minutes.sort((a, b) => a - b);
  return byCode;
}

/** What each man did in the match, by FPL code.
 *
 *  `loggedPlayers` rather than `matchPlayers`, which `identity/match.ts` already
 *  owns for matching a person against a candidate list — a different sense of
 *  "match" entirely, and one name for both would have read as a bridge. */
export function loggedPlayers(match: IntelMatch | undefined): Map<number, IntelMatchPlayer> {
  return new Map((match?.players ?? []).map((player) => [player.code, player]));
}

/** Where a match-log position sits on the pitch, keeper to attack.
 *
 *  **SofaScore's vocabulary, which is not the squad export's.** The two files
 *  come from the same sister repo and use different taxonomies: `squads` carries
 *  `CB` `LB` `DM` `ST` from `team_squad.parquet` (translated by the app's
 *  `realPositions.ts`), and a match log carries `DC` `DL` `DMC` `AMC` `FW` from
 *  SofaScore's own line codes. Seventeen of them, counted across the 20 logged
 *  matches on 4 Sep 2026: `GK · DC DL DR · DMC DML DMR · MC ML MR · AMC AML AMR
 *  · FW FWL FWR`, plus null for every man who did not start.
 *
 *  So this reads the LINE off the prefix rather than translating the code, which
 *  is what makes it survive an eighteenth: a code beginning `AM` is an attacking
 *  midfielder whether or not this list has seen it.
 *
 *  A man with no position sorts last (Craig, 4 Sep 2026: *"ordered by
 *  position/match line up though (strikers at bottom etc)"*) — he did not start,
 *  so there is no line to put him on, and the bench belongs under the eleven. */
export function matchLine(position: string | null): number {
  if (position === null) return BENCH;
  return LINES.find(([prefix]) => position.startsWith(prefix))?.[1] ?? BENCH;
}

/** **The order they are TESTED in is not the order they are RANKED in**, and the
 *  first draft conflated the two: a single array put `DM` before `D` so that
 *  `DMC` would not match `D` first, and thereby sorted every defensive
 *  midfielder ahead of the back four.
 *
 *  So the prefix list is longest-first for matching and each entry carries its
 *  own rank down the pitch. */
const LINES: readonly (readonly [string, number])[] = [
  ["GK", 0],
  ["DM", 2],
  ["D", 1],
  ["AM", 4],
  ["M", 3],
  ["FW", 5],
];

/** A man with no position did not start, and the bench belongs under the
 *  eleven — the one place this ordering is about the SQUAD rather than the
 *  pitch. */
const BENCH = 6;
