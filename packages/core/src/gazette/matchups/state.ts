import { DASH, listed } from "../../format";
import { autoSubs, type AutoSub } from "./autoSubs";
import type { Cutoff } from "./brief";
import { byClock, isLate } from "./stories";
import type { DraftMan, DraftMatchupInput, DraftSide, GoalTime, PositionLimits, SlotWorth } from "./types";
import { priceOf } from "./worth";

// A match-up at the cut-off: each side with the substitutions Fantrax will make, its total with the certain ones, the men
// still to play, and the score as the page prints it. What the story is, the threads decide (`threads.ts`). Pure.

export interface SideState {
  side: DraftSide;
  subs: AutoSub[];
  /** Fantrax's total plus the points of reserves certain to come on. */
  total: number;
  /** Men in the eleven, or certain to come into it, with a match still to play. */
  toPlay: DraftMan[];
}

export interface MatchupState {
  home: SideState;
  away: SideState;
  /** Home minus away, with the substitutions. */
  margin: number;
  /** "123 beat test2 38-37", the side ahead first. */
  score: string;
}

/** Every man in a match-up: both elevens and both benches. */
export const everyMan = (state: MatchupState): DraftMan[] => [state.home, state.away].flatMap((s) => [...s.side.eleven, ...s.side.bench]);

/** The men whose points count: the eleven, each man a reserve is certain to replace swapped for that reserve. */
export function counted(s: SideState): DraftMan[] {
  return s.side.eleven.map((m) => s.subs.find((x) => x.out === m && !x.provisional)?.in ?? m);
}

function sideState(side: DraftSide, limits: PositionLimits): SideState {
  const numbered = side.subOrder.flatMap((id) => side.bench.filter((m) => m.fantraxId === id));
  const subs = autoSubs(side.eleven, numbered, limits);
  const coming = subs.filter((s) => !s.provisional).reduce((sum, s) => sum + (s.in.points ?? 0), 0);
  const eleven = side.eleven.filter((m) => !subs.some((s) => s.out === m));
  // The men most likely to matter first: a projection orders them and is never printed.
  const toPlay = [...eleven, ...subs.map((s) => s.in)].filter((m) => m.left > 0).sort((a, b) => (b.projected ?? 0) - (a.projected ?? 0));
  return { side, subs, total: (side.total ?? 0) + coming, toPlay };
}

/** The winner's last goal, from the late minute on, worth more than the margin: without it the other side would have won. */
export function lateDecider(winner: SideState, margin: number, worth: SlotWorth): { m: DraftMan; t: GoalTime } | null {
  const goals = winner.side.eleven.flatMap((m) => m.scoredAt.map((t) => ({ m, t }))).filter(({ m }) => priceOf(worth, m.slot, "goal") > margin);
  const last = goals.sort((x, y) => byClock(x.t, y.t)).at(-1);
  return last === undefined || !isLate(last.t) ? null : last;
}

/** The score as the page prints it, the side ahead first, the substitutions counted: Saturday's as it stands, the
 *  gameweek's as a result. What turned it and what decided it are the story's (`threads.ts`), never the score's. */
function scoreLine(home: SideState, away: SideState, cutoff: Cutoff): string {
  // A side Fantrax gave no total has no score to win or lose by.
  if (home.side.total === null || away.side.total === null) {
    const shown = (s: SideState) => `${s.side.name} ${s.side.total === null ? DASH : s.total}`;
    return `${shown(home)}, ${shown(away)}`;
  }
  const [lead, trail] = home.total >= away.total ? [home, away] : [away, home];
  if (lead.total === trail.total) return `${home.side.name} and ${away.side.name} ${cutoff === "saturday" ? "are level at" : "drew"} ${home.total}-${away.total}`;
  return `${lead.side.name} ${cutoff === "saturday" ? "lead" : "beat"} ${trail.side.name} ${lead.total}-${trail.total}`;
}

/** A Premier League match still to play with the two sides' men on opposing clubs: "Man City v Sunderland: Haaland
 *  for 123, Meunier for test2". */
export function opposedMatches(home: DraftSide, away: DraftSide): string[] {
  const inMatch = (side: DraftSide, code: number) => side.eleven.filter((m) => m.matches.some((x) => x.code === code) && m.left > 0);
  const labels = new Map([...home.eleven, ...away.eleven].flatMap((m) => m.matches.map((x) => [x.code, x.label] as const)));
  return [...labels].flatMap(([code, label]) => {
    const [h, a] = [inMatch(home, code), inMatch(away, code)];
    if (!h.some((x) => a.some((y) => x.club !== y.club))) return [];
    return [`${label}: ${listed(h.map((m) => m.name), "and")} for ${home.name}, ${listed(a.map((m) => m.name), "and")} for ${away.name}`];
  });
}

export function matchupState(input: DraftMatchupInput, limits: PositionLimits, cutoff: Cutoff): MatchupState {
  const home = sideState(input.home, limits);
  const away = sideState(input.away, limits);
  return { home, away, margin: home.total - away.total, score: scoreLine(home, away, cutoff) };
}
