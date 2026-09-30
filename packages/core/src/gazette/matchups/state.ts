import { DRAFT_DESK } from "../../config";
import { londonWeekdayLong } from "../../time";
import { autoSubs, type AutoSub } from "./autoSubs";
import type { Cutoff } from "./brief";
import { byClock, returnCount, sideStories } from "./stories";
import { chaseLines } from "./swing";
import type { DraftMan, DraftMatchupInput, DraftSide, GoalTime, PositionLimits, SlotWorth } from "./types";
import { listed } from "../../format";
import { priceOf } from "./worth";

// A match-up at the cut-off: the score as a verdict, who is still to play and, near the end, what the side behind needs,
// and each side's stories. Facts only; the writer judges.

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
  score: string;
  stillToPlay: string[];
  stories: string[];
}

const tag = (man: DraftMan) => `${man.name} (${man.club}${man.next === null ? "" : `, ${man.next.home ? "at home to" : "away to"} ${man.next.opponent} on ${londonWeekdayLong(man.next.kickoff)}`})`;

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
  return last === undefined || last.t.minute < DRAFT_DESK.lateGoal ? null : last;
}

/** The score as the page prints it, the side ahead first, the substitutions counted: Saturday's as it stands, the
 *  gameweek's as a result. What turned it and what decided it are the story's (`threads.ts`), never the verdict's. */
function scoreLine(home: SideState, away: SideState, cutoff: Cutoff): string {
  const [lead, trail] = home.total >= away.total ? [home, away] : [away, home];
  if (lead.total === trail.total) return `${home.side.name} and ${away.side.name} ${cutoff === "saturday" ? "are level at" : "drew"} ${home.total}-${away.total}`;
  return `${lead.side.name} ${cutoff === "saturday" ? "lead" : "beat"} ${trail.side.name} ${lead.total}-${trail.total}`;
}

/** A Premier League match with the two sides' men on opposing clubs: "Man City v Sunderland: Haaland for 123, Meunier
 *  for test2". Unplayed ones (`played` false) for who is still to play; played ones only when one of them returned. */
export function opposedMatches(home: DraftSide, away: DraftSide, played: boolean): string[] {
  const inMatch = (side: DraftSide, code: number) => side.eleven.filter((m) => m.matches.some((x) => x.code === code) && (played ? m.minutes > 0 : m.left > 0));
  const labels = new Map([...home.eleven, ...away.eleven].flatMap((m) => m.matches.map((x) => [x.code, x.label] as const)));
  return [...labels].flatMap(([code, label]) => {
    const [h, a] = [inMatch(home, code), inMatch(away, code)];
    const opposed = h.some((x) => a.some((y) => x.club !== y.club));
    if (!opposed || (played && ![...h, ...a].some((m) => returnCount(m) > 0))) return [];
    return [`${label}: ${listed(h.map((m) => m.name), "and")} for ${home.name}, ${listed(a.map((m) => m.name), "and")} for ${away.name}`];
  });
}

export function matchupState(input: DraftMatchupInput, worth: SlotWorth, limits: PositionLimits, cutoff: Cutoff): MatchupState {
  const home = sideState(input.home, limits);
  const away = sideState(input.away, limits);
  const margin = home.total - away.total;
  const [ahead, behind] = margin >= 0 ? [home, away] : [away, home];
  const leftCount = home.toPlay.length + away.toPlay.length;
  const stillToPlay = [
    ...[home, away].filter((s) => s.toPlay.length > 0).map((s) => `${s.side.name} have ${s.toPlay.length} still to play: ${s.toPlay.map(tag).join(", ")}`),
    // With most of the gameweek to play the sums mean nothing: the report tells what happened.
    ...(leftCount > 0 && leftCount <= DRAFT_DESK.chaseWhenLeft && margin !== 0 ? chaseLines(behind, ahead, Math.abs(margin), worth) : []),
    ...opposedMatches(input.home, input.away, false),
  ];
  return {
    home,
    away,
    margin,
    score: scoreLine(home, away, cutoff),
    stillToPlay,
    stories: [...sideStories(home.side, home.subs, worth, cutoff, margin), ...sideStories(away.side, away.subs, worth, cutoff, -margin), ...opposedMatches(input.home, input.away, true)],
  };
}
