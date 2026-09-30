import { DRAFT_NEWS } from "../../config";
import { listed } from "../../format";
import { ordinal } from "../../league/ordinal";
import { londonDayOf } from "../../time";
import type { MatchupContext } from "./brief";
import { counted, lateDecider } from "./state";
import { returnCount, returnWords, whenScored } from "./stories";
import { thread, type Thread } from "./thread";
import { SIDES, beatLabel, beatOf, ledForGood, type Beat, type Which } from "./timeline";
import type { SlotWorth } from "./types";
import { possessive } from "./words";

// The match's shape at the end of the gameweek: turned by the bench, decided late, a comeback, a lead lost, a fightback
// that fell short, one man's result, level, close, an upset, a rout. Each from the running score, never the model. Pure.

const other = (w: Which): Which => (w === "home" ? "away" : "home");
const lead = (b: Beat, w: Which) => b.score[w] - b.score[other(w)];

/** The beat of a side's biggest lead (`sign` 1) or biggest deficit (`sign` -1) at a beat's end. */
const extreme = (beats: readonly Beat[], w: Which, sign: 1 | -1) => beats.reduce<Beat | null>((best, b) => (best === null || sign * lead(b, w) > sign * lead(best, w) ? b : best), null);

/** A man with most of his side's points: 10 or more and over a third of its total. */
function oneManShows(ctx: MatchupContext): Thread[] {
  return SIDES.flatMap((w) => {
    const s = ctx.state[w];
    return counted(s)
      .filter((m) => (m.points ?? 0) >= DRAFT_NEWS.oneManPoints && (m.points ?? 0) >= DRAFT_NEWS.oneManShare * s.total)
      .map((m) => thread("one-man-show", { teamId: s.side.teamId, men: [m], beat: beatOf(ctx.state, m), facts: [`${m.name} (${m.club}) got ${m.points} of ${possessive(s.side.name)} ${s.total}${returnCount(m) === 0 ? "" : `: ${returnWords(m)}`}`] }));
  });
}

/** A draw, and a side that led at a day's end and was caught. */
function levelThreads(ctx: MatchupContext, beats: readonly Beat[]): Thread[] {
  const { home, away } = ctx.state;
  const caught = SIDES.flatMap((w) => {
    const high = extreme(beats, w, 1);
    return high === null || lead(high, w) < DRAFT_NEWS.leadLostFrom ? [] : [thread("lead-lost", { teamId: ctx.state[w].side.teamId, beat: high.day, facts: [`${ctx.state[w].side.name} led by ${lead(high, w)} after ${beatLabel(high.day)}, and it finished level`] })];
  });
  return [thread("level", { teamId: null, facts: [`${home.side.name} and ${away.side.name} drew ${home.total}-${away.total}`] }), ...caught];
}

export function matchThreads(ctx: MatchupContext, beats: readonly Beat[], worth: SlotWorth, gameweek: number): Thread[] {
  const { margin } = ctx.state;
  if (margin === 0) return [...levelThreads(ctx, beats), ...oneManShows(ctx)];
  const [w, l]: [Which, Which] = margin > 0 ? ["home", "away"] : ["away", "home"];
  const [W, L, m] = [ctx.state[w], ctx.state[l], Math.abs(margin)];
  const out = oneManShows(ctx);
  // Turned by the bench: the side that lost led on the eleven's points alone.
  if ((L.side.total ?? 0) > (W.side.total ?? 0)) {
    const on = W.subs.filter((s) => !s.provisional);
    // The reserves' own points are the cast's, given once there.
    const who = listed(on.map((s) => `${s.in.name} (${s.in.club}) for ${s.out.name}`), "and");
    out.push(thread("bench-turned", { teamId: W.side.teamId, men: on.map((s) => s.in), beat: null, facts: [`${L.side.name} led ${L.side.total}-${W.side.total} before the substitutions, which brought on ${who} for ${W.side.name}`] }));
  }
  const late = lateDecider(W, m, worth);
  if (late !== null) {
    out.push(thread("late-decider", { teamId: W.side.teamId, men: [late.m], beat: londonDayOf(late.t.kickoff) ?? undefined, bigger: late.t.added !== undefined, facts: [`${late.m.name} (${late.m.club}) scored ${whenScored(late.t)}; without that goal ${L.side.name} would have won`] }));
  }
  const low = extreme(beats, w, -1);
  if (low !== null && -lead(low, w) >= DRAFT_NEWS.comebackFrom) {
    const from = beats[ledForGood(beats, w)];
    out.push(thread("comeback", { teamId: W.side.teamId, beat: from?.day, bigger: -lead(low, w) >= DRAFT_NEWS.bigComebackFrom, facts: [`${W.side.name} were ${-lead(low, w)} behind after ${beatLabel(low.day)}${from === undefined ? "" : ` and led for good from ${beatLabel(from.day)}`}`] }));
  }
  const high = extreme(beats, l, 1);
  if (high !== null && lead(high, l) >= DRAFT_NEWS.leadLostFrom) out.push(thread("lead-lost", { teamId: L.side.teamId, beat: high.day, facts: [`${L.side.name} led by ${lead(high, l)} after ${beatLabel(high.day)}`] }));
  const behind = extreme(beats, l, -1);
  if (behind !== null && -lead(behind, l) >= DRAFT_NEWS.fightbackFrom && m <= DRAFT_NEWS.fightbackWithin) {
    out.push(thread("fightback-short", { teamId: L.side.teamId, beat: behind.day, facts: [`${L.side.name} were ${-lead(behind, l)} behind after ${beatLabel(behind.day)} and lost by ${m}`] }));
  }
  if (m <= DRAFT_NEWS.closeWithin) out.push(thread("close", { teamId: W.side.teamId, bigger: m === 1, facts: [`${W.side.name} won by ${m}`] }));
  const [pw, pl] = [ctx.places[w], ctx.places[l]];
  if (gameweek >= DRAFT_NEWS.upsetFrom && pw !== null && pl !== null && pw.rank - pl.rank >= DRAFT_NEWS.upsetPlaces) {
    out.push(thread("upset", { teamId: W.side.teamId, bigger: pl.rank === 1, facts: [`${W.side.name} were ${ordinal(pw.rank)} going into the gameweek and ${L.side.name} ${ordinal(pl.rank)}`] }));
  }
  if (m >= DRAFT_NEWS.routFrom) out.push(thread("rout", { teamId: W.side.teamId, bigger: m >= DRAFT_NEWS.bigRoutFrom, facts: [`${W.side.name} won by ${m}`] }));
  return out;
}
