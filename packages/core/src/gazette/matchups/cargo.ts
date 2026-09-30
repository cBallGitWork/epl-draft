import type { Cutoff, MatchupContext } from "./brief";
import type { DraftPiece } from "./writing";

// A draft report as the page draws it: per match-up, the verdict, the writing, and each side's place and run (the FM
// form strip). Its one photograph is the story's cover (`cover.ts`).

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
}

export interface StoryDraftMatchup {
  home: StoryDraftSide;
  away: StoryDraftSide;
  verdict: string;
  standfirst: string;
  paragraphs: string[];
}

export interface StoryDraftReport {
  cutoff: Cutoff;
  gameweek: number;
  matchups: StoryDraftMatchup[];
}

/** The report's cargo, from the desk's contexts and the writing that survived; a match-up with no writing keeps its verdict. */
export function draftCargo(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[], pieces: ReadonlyMap<number, DraftPiece>, rankAfter: ReadonlyMap<string, number>): StoryDraftReport {
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
      });
            // The opening line is the desk's verdict, set as a sentence: the one line a reader must never find wrong. A side's
      // name prints as its manager wrote it, even at the head of a sentence.
      const standfirst = `${ctx.state.score}.`;
      return { home: side("home"), away: side("away"), verdict: ctx.state.score, standfirst, paragraphs: piece.paragraphs };
    }),
  };
}
