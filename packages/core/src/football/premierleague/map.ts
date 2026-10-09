import type { MatchEvent, MatchEventKind } from "../types";
import type { RawPlEvent, RawPlFixture } from "./raw";
import type { RawPlMatchStats, RawPlMetric } from "./rawStats";
import { codeOf } from "./teamSheet";

// Pure raw → domain, joined to FPL on ids only: `altIds.opta` is FPL's `opta_code`, or `g` + its `fixture.code`.

/** Opta's vocabulary reduced to our seven kinds; a type missing here is dropped. */
const KINDS: Record<string, MatchEventKind> = {
  goal: "goal",
  "penalty goal": "penalty-goal",
  "own goal": "own-goal",
  "VAR cancelled goal": "disallowed-goal",
  "yellow card": "yellow-card",
  "red card": "red-card",
  // Opta's spelling, no space, and a sending-off: without this line a third of the reds vanish.
  "secondyellow card": "red-card",
  substitution: "substitution",
};

/** The fixture's FPL code from `{opta: "g2645221"}`; null without `altIds`, which needs `altIds=true` on the read. */
export function plFixtureCode(fixture: RawPlFixture): number | null {
  const opta = fixture.altIds?.opta;
  if (opta === undefined || !opta.startsWith("g")) return null;
  const code = Number(opta.slice(1));
  return Number.isInteger(code) ? code : null;
}

/** One line of Opta's commentary, as a report prints it. */
export interface PlCommentaryLine {
  id: number;
  /** Opta's own type verbatim (`goal`, `attempt saved`, `corner`): a report wants the whole vocabulary. */
  type: string;
  /** `"26"`, `"45+2"` — for reading, never for sorting. */
  minute: string;
  /** Elapsed in THIS fixture, and runs backwards across the interval: it orders one match, never a gameweek. */
  seconds: number;
  text: string;
}

/** Opta's two halves of a foul, `free kick lost` and `free kick won`: nearly half the feed's rows. */
const SKIPPED_TYPES: ReadonlySet<string> = new Set([
  "free kick won",
  "free kick lost",
  // The offside too: a whistle that stopped play and changed nothing.
  "offside",
]);

/** The commentary without the fouls and offsides; a caller wanting every line skips this. */
export function worthReading(lines: readonly PlCommentaryLine[]): PlCommentaryLine[] {
  return lines.filter((line) => !SKIPPED_TYPES.has(line.type));
}

/** Opta's whole commentary for one match, newest first; an event with no time or no text is dropped. */
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

/** The commentary reduced to our seven kinds and joined to FPL, oldest first as it arrived.
 *  `fixtureCode` is passed in because the textstream's header carries no `altIds`; `codes` is `plPlayerCodes`. */
export function mapMatchEvents(
  events: readonly RawPlEvent[],
  fixtureCode: number,
  codes: Map<number, number>,
  /** Kick-off in epoch ms, from the gameweek read; null leaves `absolute` null so a gameweek sort skips them. */
  kickoffMillis: number | null = null,
): MatchEvent[] {
  const mapped: MatchEvent[] = [];
  for (const event of events) {
    const kind = KINDS[event.type];
    // An event we cannot place in the match cannot go in a timeline.
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

/** Every goal in a gameweek from the one read that carries them all, as `MatchEvent` with a synthesised id.
 *  `absolute` is `kickoff + clock`: the clock alone restarts at nought in every match and misorders the day. */
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
        // The assist slot is always present, null when nobody assisted.
        players: [
          codes.get(goal.personId) ?? null,
          codeOf(codes, goal.assistId),
        ],
        text: "",
      });
    }
  }
  return goals;
}

/** Stride that keeps a synthesised goal id inside its fixture: must exceed any match's seconds (7,200 with extra time). */
const SECONDS_PER_MATCH = 100_000;

/** The gameweek read's own one-letter vocabulary, which is not the commentary's. */
const GOAL_KINDS: Record<string, MatchEventKind> = {
  G: "goal",
  P: "penalty-goal",
  O: "own-goal",
};

/** Opta's metrics by name, nought for any omitted: every `/stats/*` read says nought by leaving the metric out. */
export function optaMetrics(metrics: readonly RawPlMetric[]): (metric: string) => number {
  const byName = new Map(metrics.map((m) => [m.name, m.value]));
  return (metric: string) => byName.get(metric) ?? 0;
}

/** One side's Opta metrics by name. Null when the fixture has no stats for that side at all, which IS an absence
 *  and never a board of noughts. */
export function plMatchMetrics(
  stats: RawPlMatchStats,
  teamId: number,
): ((metric: string) => number) | null {
  const side = stats.data[String(teamId)];
  return side === undefined ? null : optaMetrics(side.M);
}

