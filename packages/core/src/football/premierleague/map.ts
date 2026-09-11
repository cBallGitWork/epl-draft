import type { MatchEvent, MatchEventKind } from "../types";
import type { RawPlEvent, RawPlFixture } from "./raw";
import type { RawPlMatchStats } from "./rawStats";

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

/** One line of Opta's commentary, as a report prints it. */
export interface PlCommentaryLine {
  id: number;
  /** Opta's own type, verbatim — `goal`, `attempt saved`, `corner`, `lineup`.
   *  Not mapped to our seven kinds: a REPORT wants the whole vocabulary, and
   *  `mapMatchEvents` exists precisely to reduce it. */
  type: string;
  /** `"26"`, `"45+2"` — for reading, never for sorting. */
  minute: string;
  /** Elapsed IN THIS FIXTURE. Orders one match and runs BACKWARDS across the
   *  interval (`end 1` 2910, second-half `start` 2700), which is survivable here
   *  only because a report is one match. It may never order a round. */
  seconds: number;
  text: string;
}

/** Opta's minute-stamped commentary for one match, newest first.
 *
 *  **The whole vocabulary, which is the difference from `mapMatchEvents`.** That
 *  one keeps seven kinds because the Live tab prints a wire and 1,083 events a
 *  round is a firehose; a match report is the opposite question — one match, and
 *  everything that happened in it. Measured across GW1-3: 2,215 events over 30
 *  fixtures, 99 in a complete one.
 *
 *  **Newest first**, which is a live decision rather than a literary one: the
 *  tab is open while the match is on, and the thing a reader wants is the last
 *  thing that happened. It reads as a report afterwards either way, the way a
 *  live blog does.
 *
 *  An event with no time or no text is dropped — one we cannot place in the
 *  match is not one we can put in a timeline, and `end 14` carries a junk label
 *  of `"01"` which is exactly the case that rule catches. */
/** Opta's two names for a foul.
 *
 *  They are the two halves of one event: `free kick lost` is literally *"Foul by
 *  Florian Wirtz (Liverpool)"* and `free kick won` is *"Julio Enciso (Ipswich
 *  Town) wins a free kick on the left wing"*. There is no `foul` type at all —
 *  which is why this is a table and not a guess.
 *
 *  **Counted, 11 Sep 2026, across all ten fixtures of gameweek 3**: 1,141 events,
 *  of which `free kick lost` 246 and `free kick won` 243 — **489, or 42.9% of the
 *  whole feed**. Nothing else comes near: the next biggest type is `miss` at 8.9%.
 *  So this is not a tidy-up at the margin; it is nearly half the rows. */
const SKIPPED_TYPES: ReadonlySet<string> = new Set([
  "free kick won",
  "free kick lost",
  // **And the offside** (Craig, 11 Sep 2026: *"and no offides either"*). 48 of
  // the same 1,141, or 4.2% — small beside the fouls and the same kind of row:
  // a whistle that stopped play and changed nothing about the match. With the
  // fouls it is 47.1% of the feed.
  "offside",
]);

/** The commentary with the rows a reader does not want taken out — the fouls
 *  and the offsides.
 *
 *  Craig, 11 Sep 2026: *"to remove clutter, we could hide all fouls/free kicks
 *  won"*, then *"and no offides either"*.
 *
 *  **Named for the judgement rather than the set**, because the set has already
 *  grown once. `withoutFouls` was the name until the offside joined it, and a
 *  caller reading `worthReading(whole)` does not have to be updated the next
 *  time a type earns its way out.
 *
 *  **This reverses a principle, and the principle was written before anyone
 *  counted.** `plCommentary`'s own docblock argues the whole vocabulary belongs
 *  in a report — *"one match, and everything in it"* — against `mapMatchEvents`'
 *  seven kinds. That holds for everything except this pair, and the reason is
 *  the denominator above: a feed where two types are 43% of the rows is not a
 *  record of a match, it is a record of its fouls with a match between them.
 *
 *  A function rather than a filter inside `plCommentary`, because the mapper's
 *  job is to mirror the payload (CLAUDE.md) and this is a judgement about what a
 *  reader wants. A caller that genuinely wants every line still has one. */
export function worthReading(lines: readonly PlCommentaryLine[]): PlCommentaryLine[] {
  return lines.filter((line) => !SKIPPED_TYPES.has(line.type));
}

export function plCommentary(events: readonly RawPlEvent[]): PlCommentaryLine[] {
  const lines: PlCommentaryLine[] = [];
  for (const event of events) {
    const minute = event.time?.label;
    const seconds = event.time?.secs;
    if (minute === undefined || seconds === undefined) continue;
    if (event.text.trim().length === 0) continue;
    lines.push({ id: event.id, type: event.type, minute, seconds, text: event.text });
  }
  return lines.sort((a, b) => b.seconds - a.seconds);
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
  /** This fixture's kick-off in epoch milliseconds, from the round read. Null
   *  when the match is dated but not timed, in which case its events carry no
   *  `absolute` and a round-wide sort leaves them out rather than placing them
   *  in 1970. */
  kickoffMillis: number | null = null,
): MatchEvent[] {
  const mapped: MatchEvent[] = [];
  for (const event of events) {
    const kind = KINDS[event.type];
    // Every one of the seven carried a `time` across gameweeks 1-3, but the
    // field is optional on the wire — and an event we cannot place in the match
    // is not one we can put in a timeline.
    const minute = event.time?.label;
    const seconds = event.time?.secs;
    if (kind === undefined || minute === undefined || seconds === undefined) continue;

    mapped.push({
      id: event.id,
      fixtureCode,
      kind,
      minute,
      seconds,
      absolute: kickoffMillis === null ? null : kickoffMillis + seconds * 1000,
      text: event.text,
      players: (event.playerIds ?? []).map((id) => codes.get(id) ?? null),
    });
  }
  return mapped;
}

/** Every goal in a round, from the one read that carries them all.
 *
 *  The round's fixtures answer with a `goals` array per match — scorer,
 *  assister, minute — so the round's goals cost one request rather than one per
 *  live fixture. Counted across gameweeks 1-3, the array reconciles with the
 *  scoreline on 21 of 21 played fixtures.
 *
 *  Returned as `MatchEvent` so a wire draws goals from this and cards from the
 *  commentary stream without knowing which read each came from. The `id` is
 *  synthesised — this payload publishes none — from the fixture and the goal's
 *  own clock, which is stable across polls because both halves are.
 *
 *  **Ordered by `kickoff + clock`, and that is the whole reason `absolute` is
 *  here.** A goal's clock is elapsed time from its own kick-off, so a 12:30
 *  match and a 17:30 one both start at nought; a round interleaved on the clock
 *  alone puts the afternoon in the wrong order. */
export function mapRoundGoals(
  fixtures: readonly RawPlFixture[],
  codes: Map<number, number>,
): MatchEvent[] {
  const goals: MatchEvent[] = [];
  for (const fixture of fixtures) {
    const fixtureCode = plFixtureCode(fixture);
    const kickoff = fixture.kickoff?.millis;
    if (fixtureCode === null) continue;

    for (const goal of fixture.goals ?? []) {
      const minute = goal.clock?.label;
      const secs = goal.clock?.secs;
      const kind = GOAL_KINDS[goal.type];
      if (kind === undefined || minute === undefined || secs === undefined) continue;

      goals.push({
        id: fixtureCode * SECONDS_PER_MATCH + secs,
        fixtureCode,
        kind,
        minute: minute.split("'")[0],
        seconds: secs,
        absolute: kickoff === undefined ? null : kickoff + secs * 1000,
        // The assist is a real absence on 10 of 32, so the key is present and
        // the value is null rather than the array being one long.
        players: [
          codes.get(goal.personId) ?? null,
          goal.assistId === undefined ? null : (codes.get(goal.assistId) ?? null),
        ],
        text: "",
      });
    }
  }
  return goals;
}

/** The stride that keeps a synthesised goal id inside its own fixture.
 *
 *  This payload publishes no id for a goal, so one is made from the fixture and
 *  the goal's own clock — stable across polls because both halves are. The
 *  stride only has to exceed the longest match anyone will ever play: ninety
 *  minutes is 5,400 seconds, extra time takes it to 7,200, and this is an order
 *  of magnitude clear of both. It was written inline as `100_000` and said none
 *  of that. */
const SECONDS_PER_MATCH = 100_000;

/** The round read's own one-letter vocabulary, which is not the commentary's. */
const GOAL_KINDS: Record<string, MatchEventKind> = {
  G: "goal",
  P: "penalty-goal",
  O: "own-goal",
};

/** One side's Opta metrics, by name, with nought for the ones they omitted.
 *
 *  **The defaulting is the whole function.** `/stats/match` leaves out a metric
 *  whose value is nought — red cards appear on 1 of 40 team-sides — so a caller
 *  reading the array directly gets `undefined` for "no red cards" and, following
 *  the app's usual grammar, prints a dash for a fact we hold. `DESIGN.md` §7's
 *  "Absence is `—`, never `0`" is about a figure the provider could not give;
 *  this is a provider saying nought by saying nothing, and it is the one place
 *  in the app where defaulting to zero is the honest answer.
 *
 *  Keyed by the provider's team id as it keys them. Returns null for a fixture
 *  they have no stats for at all — which IS an absence, and a caller may not
 *  turn that into a board of noughts. */
export function plMatchMetrics(
  stats: RawPlMatchStats,
  teamId: number,
): ((metric: string) => number) | null {
  const side = stats.data[String(teamId)];
  if (side === undefined) return null;

  const byName = new Map(side.M.map((m) => [m.name, m.value]));
  return (metric: string) => byName.get(metric) ?? 0;
}

