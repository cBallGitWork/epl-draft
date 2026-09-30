import { DRAFT_NEWS } from "../../config";
import type { Cutoff, MatchupContext } from "./brief";
import { thread, type Thread } from "./thread";
import { matchThreads } from "./threadsMatch";
import { manThreads } from "./threadsMen";
import { saturdayThreads } from "./threadsSaturday";
import { beatLabel, beatOf, ledForGood, timeline, type Beat } from "./timeline";
import type { DraftMan, SlotWorth } from "./types";

// Every thread a match-up's story could be told through, weighed (DRAFT_NEWS): the match's shape, a man's gameweek, the
// season's, and after Saturday what is still to come; then the ones that decided it. The desk decides what the story is;
// the writer tells it. Pure.

const bump = (t: Thread, by: number): Thread => ({ ...t, weight: t.weight + by, decisive: true });

/** The decider (+30, one): the substitutions if they turned it, a late goal worth more than the margin, or the return
 *  after which the winner led for good; then one other thread whose man's points reach the margin (+15). */
function decisiveAtEnd(ctx: MatchupContext, threads: Thread[], beats: readonly Beat[]): Thread[] {
  const { home, away, margin } = ctx.state;
  if (margin === 0) return threads;
  const [w, winner] = margin > 0 ? (["home", home] as const) : (["away", away] as const);
  const out = [...threads];
  let at = out.findIndex((t) => t.kind === "bench-turned");
  if (at < 0) at = out.findIndex((t) => t.kind === "late-decider");
  if (at < 0) {
    // The first beat of the winner's last unbroken lead, and the man who did most in it.
    const from = ledForGood(beats, w);
    const key = beats[from]?.returns.filter((r) => r.side === w).sort((a, b) => b.points - a.points)[0];
    if (key !== undefined) {
      at = out.findIndex((t) => t.teamId === winner.side.teamId && t.men[0] === key.man);
      if (at < 0) {
        const day = beats[from].day;
        out.push(thread("turning-point", { teamId: winner.side.teamId, men: [key.man], beat: day, facts: [`${winner.side.name} led for good from ${beatLabel(day)}, when ${key.man.name} (${key.man.club}) got ${key.points}`] }));
        at = out.length - 1;
      }
    }
  }
  if (at >= 0) out[at] = bump(out[at], DRAFT_NEWS.decider);
  const reach = out
    .map((t, i) => ({ t, i }))
    .filter(({ t, i }) => i !== at && t.teamId === winner.side.teamId && t.men.length > 0 && (t.men[0].points ?? 0) >= Math.abs(margin))
    .sort((a, b) => b.t.weight - a.t.weight)[0];
  if (reach !== undefined) out[reach.i] = bump(reach.t, DRAFT_NEWS.reachesMargin);
  return out;
}

/** After Saturday, the leader's thread about the man who did most to build the lead (+20). */
function builderAfterSaturday(ctx: MatchupContext, threads: Thread[]): Thread[] {
  const { home, away, margin } = ctx.state;
  if (margin === 0) return threads;
  const leader = margin > 0 ? home : away;
  const out = [...threads];
  const at = out
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.teamId === leader.side.teamId && t.men.length > 0)
    .sort((a, b) => (b.t.men[0].points ?? 0) - (a.t.men[0].points ?? 0) || b.t.weight - a.t.weight)[0];
  if (at !== undefined) out[at.i] = bump(at.t, DRAFT_NEWS.builder);
  return out;
}

/** The season's facts as threads, each tagged with its own kind for its frame. */
function seasonThreads(ctx: MatchupContext, cutoff: Cutoff): Thread[] {
  return ctx.form.map((f) => thread(cutoff === "saturday" && f.kind === "streak" ? "going-in" : f.kind, { teamId: f.teamId, facts: [f.text] }));
}

export function threadsOf(ctx: MatchupContext, cutoff: Cutoff, worth: SlotWorth, gameweek: number): Thread[] {
  const beats = timeline(ctx.state);
  const place = (man: DraftMan) => beatOf(ctx.state, man);
  const own = [...manThreads(ctx, cutoff, worth, gameweek, place), ...seasonThreads(ctx, cutoff)];
  if (cutoff === "saturday") return builderAfterSaturday(ctx, [...saturdayThreads(ctx, worth), ...own]);
  const all = [...matchThreads(ctx, beats, worth, gameweek), ...own];
  // The goal that decided it is told once, as the decider.
  const decider = all.find((t) => t.kind === "late-decider")?.men[0];
  return decisiveAtEnd(ctx, all.filter((t) => !(t.kind === "late-goal" && t.men[0] === decider)), beats);
}
