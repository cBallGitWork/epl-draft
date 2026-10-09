import { FIT_AGAIN, draftFace, type Assignment, type Cutoff, type FootballSnapshot, type MatchupContext, type PresserLine, type StoryFace } from "@epl/core";

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
  if (assignment.kind === "presser") return biggest(ctx.presserLines ?? [], ctx.players);

  // The Line-Ups' man: a starter the league holds and the round's pressers named, one back fit first (Craig, 9 Oct 2026).
  if (assignment.kind === "predicted-xi") {
    const named = (ctx.presserLines ?? []).filter((line) => line.ownerName !== null && ctx.starters?.has(line.code) === true);
    return biggest(named, ctx.players, (line) => (line.tag === FIT_AGAIN ? 1 : 0));
  }

  return null;
}

/** The man who leads `lines` by `first`, then by `weight`; null when he is no footballer the snapshot holds. */
function biggest(
  lines: readonly PresserLine[],
  players: FaceContext["players"],
  first: (line: PresserLine) => number = () => 0,
): StoryFace | null {
  const best = lines
    .map((line) => ({ line, fresh: line.fresh, player: players?.find((each) => each.code === line.code) }))
    .sort(
      (a, b) =>
        first(b.line) - first(a.line) || weight(b) - weight(a) || a.line.playerName.localeCompare(b.line.playerName),
    )[0];
  if (best === undefined || best.player === undefined) return null;
  return {
    code: best.player.code,
    name: best.line.playerName,
    clubId: best.player.clubId,
    // A presser line knows no roster slot.
    position: null,
  };
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
  /** The Team Sheet's men, or the round's for the Line-Ups. */
  presserLines?: readonly PresserLine[];
  /** Who the printed elevens start, by code, for the Line-Ups' man. */
  starters?: ReadonlySet<number>;
  /** The season's numbers, for deciding which of them is the story. */
  players?: readonly FootballSnapshot["players"][number][];
  /** A draft report's match-ups by cut-off, the lead first, for its cover. */
  drafts?: ReadonlyMap<Cutoff, { contexts: readonly MatchupContext[] }>;
}
