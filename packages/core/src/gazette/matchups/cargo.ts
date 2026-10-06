import { angleRecord, type AngleRecord } from "./angle";
import type { Cutoff, MatchupContext } from "./brief";
import { runningScore, type StoryDraftStep } from "./days";
import type { StoryFace } from "../face";
import { draftFace } from "./cover";
import { draftBench, draftReturns, draftRows, type StoryDraftReturns, type StoryDraftRow } from "./elevens";
import type { DraftPiece } from "./writing";

// A draft report as the page draws it: per match-up, the score and how it ran by day, each side's returns, place and run
// (the FM form strip), the writer's lede and paragraphs, and both elevens. Its one photograph is the story's cover (`cover.ts`).

export interface StoryDraftSide {
  teamId: string;
  name: string;
  /** The score with the automatic substitutions. */
  score: number;
  rankBefore: number | null;
  /** Null after Saturday: the table moves only when the gameweek is done. */
  rankAfter: number | null;
  /** The last results going in, oldest first, as W, D and L. */
  run: string;
  returns: StoryDraftReturns;
  eleven: StoryDraftRow[];
  /** The reserves who stayed on the bench, printed under the line-up. */
  bench: StoryDraftRow[];
}

export interface StoryDraftMatchup {
  home: StoryDraftSide;
  away: StoryDraftSide;
  /** The desk's result in words, for the deck and a match-up the writer did not reach. */
  verdict: string;
  /** The writer's lede, or the desk's result as a sentence when there is none. */
  standfirst: string;
  paragraphs: string[];
  /** The running score by day, then the substitutions'; empty when it never moved. */
  byDay: StoryDraftStep[];
  /** The story the desk chose, for the next report's repeat discount; null when there was none. */
  story: AngleRecord | null;
  /** The match-up's own photograph, the man its story is told through; never the article's cover again. */
  face: StoryFace | null;
}

export interface StoryDraftReport {
  cutoff: Cutoff;
  gameweek: number;
  matchups: StoryDraftMatchup[];
}

/** The report's cargo, from the desk's contexts and the writing that survived; a match-up with no writing keeps its result. */
export function draftCargo(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[], pieces: ReadonlyMap<number, DraftPiece>, rankAfter: ReadonlyMap<string, number>): StoryDraftReport {
  const cover = draftFace(contexts)?.code;
  return {
    cutoff,
    gameweek,
    matchups: contexts.map((ctx, at) => {
      const piece = pieces.get(at + 1) ?? { paragraphs: [] };
      const side = (which: "home" | "away"): StoryDraftSide => ({
        teamId: ctx.state[which].side.teamId,
        name: ctx.state[which].side.name,
        score: ctx.state[which].total,
        rankBefore: ctx.places[which]?.rank ?? null,
        rankAfter: cutoff === "gameweek" ? (rankAfter.get(ctx.state[which].side.teamId) ?? null) : null,
        run: ctx.places[which]?.run ?? "",
        returns: draftReturns(ctx.state[which]),
        eleven: draftRows(ctx.state[which]),
        bench: draftBench(ctx.state[which]),
      });
      // A man with points to show, never a reserve yet to play.
      const pictured = ctx.angle?.cast.find((m) => m.code !== cover && (m.points ?? 0) > 0);
      const face = pictured === undefined ? null : { code: pictured.code, name: pictured.name, clubId: pictured.clubId, position: pictured.slot };
      // The writer's lede prints as the standfirst under the score; a match-up with no writing keeps the desk's result.
      const [lede, ...body] = piece.paragraphs;
      const standfirst = lede ?? `${ctx.state.score}.`;
      return { home: side("home"), away: side("away"), verdict: ctx.state.score, standfirst, paragraphs: body, byDay: runningScore(ctx.state), story: ctx.angle === null ? null : angleRecord(ctx, ctx.angle), face };
    }),
  };
}
