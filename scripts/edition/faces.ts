import { draftFace, type Assignment, type Cutoff, type FootballSnapshot, type MatchupContext, type PresserLine, type StoryFace } from "@epl/core";

// Who the story prints a picture of: the desk's choice from the facts, never the writer's from the prose.

/** The face for one assignment, or null for a kind with no man in it. Keyed on `code`, never `id`: it is persisted in
 *  `paper.json`. */
export function faceOf(assignment: Assignment, ctx: FaceContext): StoryFace | null {
  // The draft report's cover is the lead match-up's key man.
  if (assignment.kind === "draft-report") {
    const job = assignment.cutoff === undefined ? undefined : ctx.drafts?.get(assignment.cutoff);
    return job === undefined ? null : draftFace(job.contexts);
  }

  // The Team Sheet's man: the biggest name in the day's news, by `weight`.
  if (assignment.kind === "presser") {
    const named = ctx.presserLines ?? [];
    const best = [...named]
      .map((line) => ({ line, fresh: line.fresh, player: ctx.players?.find((each) => each.code === line.code) }))
      .sort((a, b) => weight(b) - weight(a) || a.line.playerName.localeCompare(b.line.playerName))[0];
    if (best === undefined || best.player === undefined) return null;
    return {
      code: best.player.code,
      name: best.line.playerName,
      clubId: best.player.clubId,
      // The Team Sheet knows no roster slot: he may be a man nobody holds.
      position: null,
    };
  }

  return null;
}

/** How much this man's news matters today: a man whose availability moved around this conference leads, and FPL's
 *  season `influence` only breaks the tie, being minutes-weighted so a cameo cannot beat a regular. */
export function weight(each: { fresh?: boolean; player?: { season: { influence: number } } }): number {
  const season = each.player?.season;
  if (season === undefined) return -1;
  const matters = season.influence;
  // A standing absence cannot outrank news, whoever he is.
  return each.fresh === false ? matters : matters + 100_000;
}

/** What `faceOf` needs, which is less than a whole `DeskContext`. */
export interface FaceContext {
  /** The Team Sheet's men — empty for every other kind. */
  presserLines?: readonly PresserLine[];
  /** The season's numbers, for deciding which of them is the story. */
  players?: readonly FootballSnapshot["players"][number][];
  /** A draft report's match-ups by cut-off, the lead first, for its cover. */
  drafts?: ReadonlyMap<Cutoff, { contexts: readonly MatchupContext[] }>;
}
