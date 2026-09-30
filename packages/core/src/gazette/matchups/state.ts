import { DRAFT_DESK } from "../../config";
import { londonWeekdayLong } from "../../time";
import { autoSubs, type AutoSub } from "./autoSubs";
import type { Cutoff } from "./brief";
import { returnCount, sideStories, whenScored } from "./stories";
import { chaseLines } from "./swing";
import type { DraftMan, DraftMatchupInput, DraftSide, PositionLimits, SlotWorth } from "./types";
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

function sideState(side: DraftSide, limits: PositionLimits): SideState {
  const numbered = side.subOrder.flatMap((id) => side.bench.filter((m) => m.fantraxId === id));
  const subs = autoSubs(side.eleven, numbered, limits);
  const coming = subs.filter((s) => !s.provisional).reduce((sum, s) => sum + (s.in.points ?? 0), 0);
  const eleven = side.eleven.filter((m) => !subs.some((s) => s.out === m));
  // The men most likely to matter first: a projection orders them and is never printed.
  const toPlay = [...eleven, ...subs.map((s) => s.in)].filter((m) => m.left > 0).sort((a, b) => (b.projected ?? 0) - (a.projected ?? 0));
  return { side, subs, total: (side.total ?? 0) + coming, toPlay };
}

/** The score as a verdict: Saturday's as it stands, the gameweek's as a result, with the substitutions when they change it. */
function scoreLine(home: SideState, away: SideState, cutoff: Cutoff, worth: SlotWorth): string {
  const [h, a] = [home.side.total ?? 0, away.side.total ?? 0];
  const coming = (s: SideState) => s.subs.filter((x) => !x.provisional).map((x) => x.in.name);
  if (cutoff === "saturday") {
    const on = [...coming(home), ...coming(away)];
    const changed = home.total !== h || away.total !== a;
    // The side ahead first and its score first, as a paper prints a half-time score.
    const [lead, trail] = h >= a ? [home, away] : [away, home];
    const [l, t] = [lead.side.total ?? 0, trail.side.total ?? 0];
    const now = l === t ? `${home.side.name} and ${away.side.name} are level at ${l}-${t}` : `${lead.side.name} lead ${trail.side.name} ${l}-${t}`;
    if (!changed) return now;
    const once = `once ${listed(on, "and")} come${on.length === 1 ? "s" : ""} on`;
    return trail.total > lead.total ? `${now}, and ${trail.side.name} go ahead ${trail.total}-${lead.total} ${once}` : `${now}, ${lead.total}-${trail.total} ${once}`;
  }
  if (home.total === away.total) return `${home.side.name} and ${away.side.name} drew ${home.total}-${away.total}`;
  const [winner, loser] = home.total > away.total ? [home, away] : [away, home];
  const margin = winner.total - loser.total;
  const beat = `${winner.side.name} beat ${loser.side.name} ${winner.total}-${loser.total}`;
  // Flipped by the bench: the side that loses had led on the eleven's points alone.
  const before = (loser.side.total ?? 0) > (winner.side.total ?? 0) ? `; ${loser.side.name} led ${loser.side.total}-${winner.side.total} before the substitutions` : "";
  // Decided by one late goal: the winner's last goal worth more than the margin.
  const goals = winner.side.eleven.flatMap((m) => m.scoredAt.map((t) => ({ m, t }))).filter(({ m }) => priceOf(worth, m.slot, "goal") > margin);
  const last = goals.sort((x, y) => x.t.minute + (x.t.added ?? 0) - (y.t.minute + (y.t.added ?? 0))).at(-1);
  const decided = last === undefined || last.t.minute < DRAFT_DESK.lateGoal ? "" : `, decided by ${last.m.name}'s goal ${whenScored(last.t)}`;
  return `${beat}${decided}${before}`;
}

/** A Premier League match with the two sides' men on opposing clubs: "Man City v Sunderland: Haaland for 123, Meunier
 *  for test2". Unplayed ones (`played` false) for who is still to play; played ones only when one of them returned. */
function opposedMatches(home: DraftSide, away: DraftSide, played: boolean): string[] {
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
    score: scoreLine(home, away, cutoff, worth),
    stillToPlay,
    stories: [...sideStories(home.side, home.subs, worth, cutoff, margin), ...sideStories(away.side, away.subs, worth, cutoff, -margin), ...opposedMatches(input.home, input.away, true)],
  };
}
