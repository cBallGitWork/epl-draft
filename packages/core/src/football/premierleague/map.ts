import type { MatchEvent, MatchEventKind } from "../types";
import type { RawPlEvent, RawPlFixture } from "./raw";

// Pure raw → domain. No clock, no network, no environment (CODE_RULES §5).
//
// The join to everything else in the app is done here and only here, and it is
// done on ids rather than on names: this provider's `altIds.opta` is FPL's
// `opta_code` for a player and FPL's `fixture.code` with a `g` in front for a
// match. Both were verified rather than assumed on 4 Sep 2026 — `opta_code` is
// non-null on all 652 elements, and a full match's lineup and bench joined 40 of
// 40. Nothing here matches a name, which CODE_RULES §3 forbids at runtime.

/** Opta's vocabulary, reduced to the seven that matter.
 *
 *  Written out rather than derived: the strings are theirs, the names are ours,
 *  and a mapping table is the only honest place for a translation. Types absent
 *  from this table are dropped — 981 of a round's 1,083 events. */
const KINDS: Record<string, MatchEventKind> = {
  goal: "goal",
  "penalty goal": "penalty-goal",
  "own goal": "own-goal",
  "VAR cancelled goal": "disallowed-goal",
  "yellow card": "yellow-card",
  "red card": "red-card",
  substitution: "substitution",
};

/** The fixture's FPL code, from the provider's own id for it.
 *
 *  `{opta: "g2645221"}` against FPL's `code: 2645221`. Null when the fixture
 *  carries no `altIds` — which the fixture LIST does not, and the detail read
 *  does — so a caller that has only the list joins by our fixture id instead. */
export function plFixtureCode(fixture: RawPlFixture): number | null {
  const opta = fixture.altIds?.opta;
  if (opta === undefined || !opta.startsWith("g")) return null;
  const code = Number(opta.slice(1));
  return Number.isInteger(code) ? code : null;
}

/** Premier League player id → FPL player `code`, for the two squads in a match.
 *
 *  The whole join, in one function. `optaToCode` is FPL's own `opta_code` →
 *  `code`, which a caller builds from a bootstrap it already holds.
 *
 *  **Harvested from the team sheets and not from the `/players` collection.**
 *  That collection is the obvious source and it is incomplete: counted against
 *  every player named in the 2,215 events of gameweeks 1-3, it misses 20 of the
 *  360 who appear, 14 of them in a goal, a card or a substitution — one a
 *  scorer. All twenty are on a team sheet, and not one of the twenty was an id
 *  mismatch; the collection simply lags squad registration. */
export function plPlayerCodes(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): Map<number, number> {
  const codes = new Map<number, number>();
  for (const list of fixture.teamLists ?? []) {
    for (const player of [...list.lineup, ...list.substitutes]) {
      const opta = player.altIds?.opta;
      const code = opta === undefined ? undefined : optaToCode.get(opta);
      if (code !== undefined) codes.set(player.id, code);
    }
  }
  return codes;
}

/** The commentary, reduced to what a fantasy league reads and joined to FPL.
 *
 *  **`fixtureCode` is a parameter and not read off the payload**, because the
 *  textstream's own fixture header carries no `altIds` at all — only the detail
 *  read does. A mapper that went looking for it there would answer with an empty
 *  round and no error.
 *
 *  `codes` comes from `plPlayerCodes` on the same fixture's detail. It is
 *  injected rather than fetched so this stays pure and testable (CODE_RULES §5),
 *  and because the football layer has no business knowing how the app caches.
 *
 *  Events arrive oldest-first and are returned that way. A wire wants the newest
 *  first and a scoresheet wants the oldest first, so neither ordering is imposed
 *  here. */
export function mapMatchEvents(
  events: readonly RawPlEvent[],
  fixtureCode: number,
  codes: Map<number, number>,
): MatchEvent[] {
  const mapped: MatchEvent[] = [];
  for (const event of events) {
    const kind = KINDS[event.type];
    // Every one of the seven carried a `time` across gameweeks 1-3, but the
    // field is optional on the wire — and an event we cannot place in the match
    // is not one we can put in a timeline.
    const minute = event.time?.label;
    if (kind === undefined || minute === undefined) continue;

    mapped.push({
      id: event.id,
      fixtureCode,
      kind,
      minute,
      text: event.text,
      players: (event.playerIds ?? []).map((id) => codes.get(id) ?? null),
    });
  }
  return mapped;
}

/** The match clock as the ground announces it — `"13"`, `"45+2"`, `"90+6"`.
 *
 *  Null before kick-off, when the provider sends no clock at all. Their label
 *  carries seconds (`"13'00"`) and nothing in football is quoted to the second,
 *  so the seconds are dropped here rather than in every caller.
 *
 *  This is the reason to read this provider at all for a scoreline: FPL's
 *  `minutes` is a player-minutes field that happens to track the match, and
 *  `docs/ui/desk.md` records that it cannot say half time — "a clock stopped on
 *  45 is not a claim they have made". This one can. */
export function plMatchClock(fixture: RawPlFixture): string | null {
  const label = fixture.clock?.label;
  if (label === undefined) return null;
  const [minutes] = label.split("'");
  return minutes.length === 0 ? null : minutes;
}
