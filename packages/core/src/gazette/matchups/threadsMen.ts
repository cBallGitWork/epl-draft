import { CLEAN_SHEET_MINUTES, DRAFT_DESK, DRAFT_NEWS } from "../../config";
import { blank } from "./autoSubs";
import type { Cutoff, MatchupContext } from "./brief";
import { counted } from "./state";
import { benchLines, clubLines, fitnessLine, isLate, keeperHauled, lostCleanLine, minutesLine, newLine, pts, returnCount, scoredLine, uncoveredLine, whenScored } from "./stories";
import { thread, type Thread, type ThreadKind } from "./thread";
import { SIDES, otherSide } from "../side";
import type { DraftMan, GoalTime, SlotWorth } from "./types";

// Each man's gameweek as a thread: a haul, a keeper's haul, an injury, his goal taking the other side's clean sheet, a
// clean sheet lost late, a late goal, a bench score, a blank nobody covered, a star's blank, a start off the bench, an
// old boy, a signing, a debut, an early exit, club-mates, a double. Pure.

const same = (a: GoalTime, b: GoalTime) => a.kickoff === b.kickoff && a.minute === b.minute && a.added === b.added;
const named = (m: DraftMan, text: string) => `${m.name} ${text}`;

/** A goal by one side's man that took the clean sheet of the other side's man, in the match they played against each other;
 *  a man on for less than a clean sheet's minutes never had one to lose. */
function crossfire(scorer: DraftMan, victims: readonly DraftMan[]): { victim: DraftMan; t: GoalTime } | null {
  for (const victim of victims) {
    if (victim.club === scorer.club || victim.minutes < CLEAN_SHEET_MINUTES || !victim.matches.some((x) => scorer.matches.some((y) => y.code === x.code))) continue;
    const t = scorer.scoredAt.find((g) => victim.concededFirstAt.some((c) => same(g, c)));
    if (t !== undefined) return { victim, t };
  }
  return null;
}

/** The match-up's few biggest projected men who blanked: the projection picks them and never prints. */
function starBlanks(ctx: MatchupContext): DraftMan[] {
  const men = SIDES.flatMap((w) => counted(ctx.state[w]));
  const stars = men.filter((m) => m.projected !== null).sort((a, b) => (b.projected ?? 0) - (a.projected ?? 0)).slice(0, DRAFT_NEWS.starBlankTop);
  return stars.filter((m) => m.left === 0 && m.minutes > 0 && returnCount(m) === 0);
}

export function manThreads(ctx: MatchupContext, cutoff: Cutoff, worth: SlotWorth, gameweek: number, place: (m: DraftMan) => string | null | undefined): Thread[] {
  const out: Thread[] = [];
  const stars = gameweek >= DRAFT_NEWS.starBlankFrom ? starBlanks(ctx) : [];
  for (const w of SIDES) {
    const s = ctx.state[w];
    const them = ctx.state[otherSide(w)];
    const add = (kind: ThreadKind, men: DraftMan[], facts: string[], bigger = false, weight?: number) => out.push(thread(kind, { teamId: s.side.teamId, men, beat: place(men[0]), facts, bigger, weight }));
    // The men whose points count, and the men they replaced, whose word from the club is still news.
    for (const m of [...new Set([...counted(s), ...s.side.eleven])]) {
      const returned = returnCount(m) > 0;
      const involved = m.minutes > 0 || m.left > 0;
      const scored = scoredLine(m, worth);
      if (scored !== null && keeperHauled(m, worth)) {
        const [base, cap] = DRAFT_NEWS.weight["keeper-haul"];
        add("keeper-haul", [m], [named(m, scored)], false, Math.min(cap, base + DRAFT_NEWS.keeperHaulPerPoint * ((m.points ?? 0) - DRAFT_DESK.keeperHaul)));
      } else if (scored !== null && returnCount(m) > 1) add("haul", [m], [named(m, scored)]);
      const hit = crossfire(m, counted(them));
      if (hit !== null) add("crossfire", [m, hit.victim], [named(m, `scored ${whenScored(hit.t)}, the goal that cost ${hit.victim.name} his clean sheet for ${them.side.name}`)]);
      for (const t of m.scoredAt.filter(isLate)) add("late-goal", [m], [named(m, `scored ${whenScored(t)}`)], t.added !== undefined);
      const lost = lostCleanLine(m, worth);
      if (lost !== null) add("clean-lost-late", [m], [named(m, lost)]);
      const minutes = minutesLine(m);
      if (m.fitness !== null) add("injury", [m], [named(m, [minutes, fitnessLine(m)].filter((x) => x !== null).join("; "))]);
      else if (m.started === true && minutes !== null) add("early-off", [m], [named(m, minutes)]);
      if (m.started === false && minutes !== null) add("non-starter", [m], [named(m, minutes)], returned);
      const fresh = newLine(m, s.side);
      if (fresh !== null && involved) add(m.arrived !== null ? "new-arrival" : "debut", [m], [named(m, fresh)], returned);
      for (const o of ctx.oldBoys.filter((x) => x.fantraxId === m.fantraxId && involved)) add("old-boy", [m], [o.line], returned);
      if (cutoff === "gameweek" && m.played > 1 && m.minutes > 0) add("double", [m], [named(m, `had two matches this gameweek${m.points === null ? "" : `, for ${pts(m.points)}`}`)]);
      if (stars.includes(m)) add("star-blank", [m], [named(m, "blanked")]);
    }
    const uncovered = s.side.eleven.filter((x) => blank(x) && !s.subs.some((sub) => sub.out === x));
    if (uncovered.length > 0) add("uncovered-blank", uncovered, uncovered.map((m) => uncoveredLine(m, s.side, cutoff)), uncovered.length > 1);
    for (const b of benchLines(s.side, s.subs, s.total - them.total)) add("bench-six", [b.man], [b.line], b.pastMargin);
    for (const c of clubLines(s.side)) add("club-mates", c.men, [c.line], c.men.length > 2);
  }
  return out;
}
