import { DRAFT_DESK } from "../../config";
import { autoSubs, blank, type AutoSub } from "./autoSubs";
import { sideStories } from "./stories";
import { chaseLines } from "./swing";
import type { DraftMan, DraftMatchupInput, DraftSide, PositionLimits, SlotWorth } from "./types";

// A match-up at the cut-off in fantasy terms: the score with Fantrax's coming substitutions counted, who is left to play,
// what one goal from each of them is worth against the margin, and the men worth a line. Facts only; the writer judges.

export interface SideState {
  side: DraftSide;
  subs: AutoSub[];
  /** Fantrax's total plus the points of reserves certain to come on. */
  total: number;
  /** Men in the eleven, or certain to come into it, with a match still to play. */
  left: DraftMan[];
}

export interface MatchupState {
  home: SideState;
  away: SideState;
  /** Home minus away. */
  margin: number;
  lines: string[];
}

const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
const tag = (man: DraftMan) => `${man.name} (${man.club}, ${man.slot}${man.next === null ? "" : `, against ${man.next}`})`;

function sideState(side: DraftSide, limits: PositionLimits): SideState {
  const numbered = side.subOrder.flatMap((id) => side.bench.filter((m) => m.fantraxId === id));
  const subs = autoSubs(side.eleven, numbered, limits);
  const coming = subs.filter((s) => !s.provisional).reduce((sum, s) => sum + (s.in.points ?? 0), 0);
  const eleven = side.eleven.filter((m) => !subs.some((s) => s.out === m));
  // The men most likely to matter first: a projection orders them and is never printed.
  const left = [...eleven, ...subs.map((s) => s.in)].filter((m) => m.left > 0).sort((a, b) => (b.projected ?? 0) - (a.projected ?? 0));
  return { side, subs, total: (side.total ?? 0) + coming, left };
}

/** Who each side has left to play, and the side behind's sums; when level, the first return for either side leads. */
function swing(behind: SideState, ahead: SideState, gap: number, worth: SlotWorth): string[] {
  const left = [behind, ahead].filter((s) => s.left.length > 0).map((s) => `${s.side.name} have ${s.left.length} to play: ${s.left.map(tag).join(", ")}`);
  if (behind.left.length + ahead.left.length === 0) return [];
  // With most of the round to play the sums mean nothing: the report tells what happened.
  if (behind.left.length + ahead.left.length > DRAFT_DESK.chaseWhenLeft) return left;
  if (gap === 0) return [...left, "level, so the first return for either side puts it ahead"];
  return [...left, ...chaseLines(behind, ahead, gap, worth)];
}

/** The men worth a line on one side: reserves who scored, big and small scores, early exits, debuts, doubles, blanks. */
function talkingPoints(state: SideState): string[] {
  const { side, subs } = state;
  const lines: string[] = [];
  const cameOn = new Set(subs.map((s) => s.in.fantraxId));
  for (const s of subs) lines.push(`${s.out.name} (${s.out.club}) did not play; ${s.in.name} (${s.in.club}) comes on from the bench${s.provisional ? " if he plays" : `, bringing ${pts(s.in.points ?? 0)}`}`);
  for (const m of side.eleven.filter((x) => blank(x) && !subs.some((s) => s.out === x))) lines.push(`${m.name} (${m.club}) did not play, and nobody on the bench can come on for him`);
  for (const m of side.bench.filter((x) => !cameOn.has(x.fantraxId) && (x.points ?? 0) >= DRAFT_DESK.benchScore)) lines.push(`${m.name} (${m.club}) scored ${pts(m.points ?? 0)} on the bench, which do not count`);
  for (const m of side.eleven) {
    // One line a man: a big score, or a small one with how long he played when he was off early.
    const early = m.minutes > 0 && m.minutes < DRAFT_DESK.earlyOff && m.left === 0;
    const low = m.minutes > 0 && m.left === 0 && (m.points ?? 0) <= DRAFT_DESK.lowScore;
    if ((m.points ?? 0) >= DRAFT_DESK.bigScore) lines.push(`${m.name} (${m.club}) scored ${pts(m.points ?? 0)}`);
    else if (early || low) lines.push(`${m.name} (${m.club}) played ${m.minutes} minutes${low ? ` and scored ${pts(m.points ?? 0)}` : ""}`);
    if (m.debut && m.minutes > 0) lines.push(`${m.name} (${m.club}) started for ${side.name} for the first time`);
    if (m.played + m.left > 1) lines.push(`${m.name} (${m.club}) has ${m.played + m.left} matches this period`);
  }
  for (const m of [...side.eleven, ...side.bench].filter((x) => x.fitness !== null)) lines.push(`${m.name} (${m.club}): ${m.fitness}`);
  lines.push(...sideStories(side));
  return lines.map((l) => `${side.name}: ${l}`);
}

export function matchupState(input: DraftMatchupInput, worth: SlotWorth, limits: PositionLimits): MatchupState {
  const home = sideState(input.home, limits);
  const away = sideState(input.away, limits);
  const margin = home.total - away.total;
  const [ahead, behind] = margin >= 0 ? [home, away] : [away, home];
  const gap = Math.abs(margin);
  // Fantrax's score as it stands; the lead is judged with the substitutions it will make, when they change the score.
  const now = `${home.side.name} ${home.side.total ?? 0}-${away.side.total ?? 0} ${away.side.name}`;
  const subbed = home.total !== (home.side.total ?? 0) || away.total !== (away.side.total ?? 0);
  const lines = [
    `${now}${subbed ? `; ${home.total}-${away.total} with the automatic substitutions` : ""}: ${gap === 0 ? "level" : `${ahead.side.name} lead by ${pts(gap)}`}`,
    ...swing(behind, ahead, gap, worth),
    ...talkingPoints(home),
    ...talkingPoints(away),
  ];
  return { home, away, margin, lines };
}
