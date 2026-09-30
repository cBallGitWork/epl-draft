import { DRAFT_NEWS } from "../../config";
import type { MatchupContext } from "./brief";
import { counted } from "./state";
import type { Family, Thread, ThreadKind } from "./thread";
import type { DraftMan } from "./types";

// A match-up's story, chosen from its threads by weight: THE STORY, a TWIST from the turn family in another beat, a few
// supporting threads and a small cast. A side's last story and last cast are worth less, so a story is not told the same
// way twice running (Craig, 29 Sep 2026); two match-ups on a page tell different kinds of story when it is close. Pure.

export interface Angle {
  story: Thread;
  twist: Thread | null;
  supporting: Thread[];
  /** The men the story is told through, the one it is most about first. */
  cast: DraftMan[];
  /** THE STORY's score, repeats discounted: the page's running order. */
  score: number;
  /** The threads left over, two a side at most and none about a cast man: told as a group, or not at all. */
  rest: Thread[];
  /** Each side's last story, which this one must not tell the same way. */
  past: AngleRecord[];
}

/** A filed match-up's angle, kept so the next report does not tell it the same way. */
export interface AngleRecord {
  kind: ThreadKind;
  family: Family;
  teamIds: string[];
  /** The cast by fantraxId. */
  cast: string[];
}

const SCOPE = { match: 0, man: 1, season: 2 } as const;

/** The discount for a thread whose family was its side's last story, or whose man was in that story's cast. */
function scored(t: Thread, past: readonly AngleRecord[], sides: readonly string[]): number {
  const last = past.find((p) => (t.teamId === null ? sides : [t.teamId]).some((id) => p.teamIds.includes(id)));
  if (last === undefined) return t.weight;
  return t.weight * (last.family === t.family ? DRAFT_NEWS.repeatFamily : 1) * (t.men.some((m) => last.cast.includes(m.fantraxId)) ? DRAFT_NEWS.repeatMan : 1);
}

const topScorer = (ctx: MatchupContext, teamId: string) =>
  [ctx.state.home, ctx.state.away]
    .filter((s) => s.side.teamId === teamId)
    .flatMap(counted)
    .filter((m) => (m.points ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || a.name.localeCompare(b.name))[0];

/** The angle, with `taken` the families already leading the page; null for a match-up with no thread at all. */
export function pickAngle(ctx: MatchupContext, threads: readonly Thread[], past: readonly AngleRecord[], taken: ReadonlySet<Family> = new Set()): Angle | null {
  const sides = [ctx.state.home.side.teamId, ctx.state.away.side.teamId];
  const ranked = threads.map((t) => ({ t, s: scored(t, past, sides) })).sort((a, b) => b.s - a.s || SCOPE[a.t.scope] - SCOPE[b.t.scope]);
  let top = ranked[0];
  if (top === undefined) return null;
  const other = ranked.find((r) => !taken.has(r.t.family));
  if (taken.has(top.t.family) && other !== undefined && top.s - other.s <= DRAFT_NEWS.varietyWithin) top = other;
  const story = top.t;
  // A twist happens at another moment than the story: two threads with no day are different facts, not one moment.
  const elsewhere = (t: Thread) => t.beat === undefined || story.beat === undefined || t.beat !== story.beat;
  const twist = ranked.find((r) => r.t !== story && r.t.family === "turn" && r.s >= DRAFT_NEWS.twistFrom && elsewhere(r.t))?.t ?? null;
  const used = new Set([...story.men, ...(twist?.men ?? [])]);
  const kinds = new Set([story.kind, twist?.kind]);
  const supporting: Thread[] = [];
  // The margin is already the printed score's: it can be the story, never a supporting thread.
  const fits = (t: Thread) => t !== story && t !== twist && t.family !== "margin" && !kinds.has(t.kind) && !t.men.some((m) => used.has(m));
  const take = (t: Thread) => {
    supporting.push(t);
    kinds.add(t.kind);
    t.men.forEach((m) => used.add(m));
  };
  for (const r of ranked) if (supporting.length < DRAFT_NEWS.supporting && r.s >= DRAFT_NEWS.supportingFrom && fits(r.t)) take(r.t);
  // The side the story is not about gets a thread if it has one worth telling.
  const theirs = story.teamId === null ? undefined : sides.find((id) => id !== story.teamId);
  if (theirs !== undefined && ![story, twist, ...supporting].some((t) => t?.teamId === theirs)) {
    const best = ranked.find((r) => r.t.teamId === theirs && r.s >= DRAFT_NEWS.otherSideFrom && fits(r.t));
    if (best !== undefined) {
      if (supporting.length >= DRAFT_NEWS.supporting) supporting.pop();
      take(best.t);
    }
  }
  const leads = story.men.length > 0 ? story.men : (story.teamId === null ? sides : [story.teamId]).flatMap((id) => topScorer(ctx, id) ?? []);
  const rival = theirs === undefined ? undefined : topScorer(ctx, theirs);
  const cast = [...new Set([...leads, ...(twist?.men ?? []), ...(rival === undefined ? [] : [rival])])].slice(0, DRAFT_NEWS.cast);
  const last = [...new Set(sides.flatMap((id) => past.find((p) => p.teamIds.includes(id)) ?? []))];
  const told = new Set([story, twist, ...supporting]);
  const rest = sides.flatMap((id) =>
    ranked
      .filter((r) => r.t.teamId === id && r.t.scope !== "season" && r.t.family !== "margin" && !told.has(r.t) && !r.t.men.some((m) => cast.includes(m)))
      .slice(0, DRAFT_NEWS.restPerSide)
      .map((r) => r.t),
  );
  return { story, twist, supporting, cast, score: top.s, rest, past: last };
}

/** Every match-up with its angle, in the page's running order: the strongest story leads, and two match-ups share a
 *  story's family only when nothing else comes close. */
export function judgePage(entries: readonly { ctx: MatchupContext; threads: readonly Thread[] }[], past: readonly AngleRecord[]): MatchupContext[] {
  const first = entries.map((e) => ({ ...e, best: pickAngle(e.ctx, e.threads, past)?.score ?? 0 })).sort((a, b) => b.best - a.best);
  const taken = new Set<Family>();
  const judged = first.map((e) => {
    const angle = pickAngle(e.ctx, e.threads, past, taken);
    if (angle !== null) taken.add(angle.story.family);
    return { ...e.ctx, angle };
  });
  return judged.sort((a, b) => (b.angle?.score ?? 0) - (a.angle?.score ?? 0));
}

/** What a filed match-up keeps of its angle. */
export const angleRecord = (ctx: MatchupContext, angle: Angle): AngleRecord => ({
  kind: angle.story.kind,
  family: angle.story.family,
  teamIds: [ctx.state.home.side.teamId, ctx.state.away.side.teamId],
  cast: angle.cast.map((m) => m.fantraxId),
});
