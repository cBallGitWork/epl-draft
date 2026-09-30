import { mentionAt } from "../predictions/prose";
import type { Cutoff, MatchupContext } from "./brief";
import type { DraftPiece } from "./writing";

// A draft report as the page draws it: per match-up, the verdict, the writing, each side's place and run (the FM form
// strip), and the men the writing names, for their photographs. Codes only, resolved at render; nothing per-season kept.

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

export interface StoryDraftMan {
  code: number;
  clubCode: number;
  name: string;
}

export interface StoryDraftMatchup {
  home: StoryDraftSide;
  away: StoryDraftSide;
  verdict: string;
  standfirst: string;
  paragraphs: string[];
  /** The men the writing names, in the order it first names them. */
  men: StoryDraftMan[];
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
      const piece = pieces.get(at + 1) ?? { standfirst: "", paragraphs: [] };
      const prose = [piece.standfirst, ...piece.paragraphs].join(" ");
      const side = (which: "home" | "away"): StoryDraftSide => ({
        teamId: ctx.state[which].side.teamId,
        name: ctx.state[which].side.name,
        score: ctx.state[which].total,
        rankBefore: ctx.places[which]?.rank ?? null,
        rankAfter: cutoff === "gameweek" ? (rankAfter.get(ctx.state[which].side.teamId) ?? null) : null,
        run: ctx.places[which]?.run ?? "",
      });
      const everyone = [ctx.state.home.side, ctx.state.away.side].flatMap((s) => [...s.eleven, ...s.bench]);
      const men = everyone
        .map((m) => ({ m, at: mentionAt(prose, m.name.split(/\s+/u).at(-1) ?? m.name) }))
        .filter((x) => x.at >= 0)
        .sort((a, b) => a.at - b.at)
        .map(({ m }) => ({ code: m.code, clubCode: m.clubCode, name: m.name }));
      return { home: side("home"), away: side("away"), verdict: ctx.state.score, standfirst: piece.standfirst, paragraphs: piece.paragraphs, men };
    }),
  };
}
