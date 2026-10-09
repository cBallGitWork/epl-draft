import { draftFace, type Cutoff, type MatchupContext } from "@epl/core";
import type {
  Assignment,
  Fixture,
  FootballSnapshot,
  PresserLine,
  ResolvedPlayer,
  StoryFace,
} from "@epl/core";
import { fielded, menIn } from "./lineups";
import type { DeskFacts } from "./facts";

// Who the story prints a picture of: the desk's choice from the facts, never the writer's from the prose.

/** The highest-scoring rostered man among those given, null when none was priced; ties break on name. Keyed on
 *  `code`, never `id`: it is persisted in `paper.json`. */
function bestOf(men: readonly ResolvedPlayer[], facts: DeskFacts): StoryFace | null {
  const priced = men.flatMap((man) => {
    const points = facts.playerPoints.get(man.slot.fantraxId);
    return points === undefined ? [] : [{ man, points }];
  });
  if (priced.length === 0) return null;

  priced.sort((a, b) => b.points - a.points || a.man.player.name.localeCompare(b.man.player.name));
  const { player, slot } = priced[0].man;
  return { code: player.code, name: player.name, clubId: player.clubId, position: slot.position };
}

/** The face for one assignment, or null for a kind with no man in it — a power
 *  ranking is about ten managers and a wire column about a market. */
export function faceOf(assignment: Assignment, ctx: FaceContext): StoryFace | null {
  const { facts } = ctx;

  // The draft report's cover is the lead match-up's key man.
  if (assignment.kind === "draft-report") {
    const job = assignment.cutoff === undefined ? undefined : ctx.drafts?.get(assignment.cutoff);
    return job === undefined ? null : draftFace(job.contexts);
  }

  // The tie-shaped kinds: both squads, and the best man across the two.
  if (assignment.kind === "tie-report" || assignment.kind === "tie-call") {
    const both = [assignment.tie?.homeTeamId, assignment.tie?.awayTeamId].flatMap((teamId) =>
      teamId === undefined ? [] : fielded(facts.teams.find((team) => team.teamId === teamId)),
    );
    return bestOf(both, facts);
  }

  // The fixture-shaped kinds: everyone in the league with a man in that match.
  if (assignment.kind === "fixture-preview") {
    const fixture = ctx.fixtures.find((each) => each.id === assignment.fixtureId);
    if (fixture === undefined) return null;
    return bestOf(
      facts.teams.flatMap((team) => menIn(fixture, team)),
      facts,
    );
  }

  // The eleven's own best man, by the `score` that put him in the side.
  if (assignment.kind === "eleven") {
    const picks = [...(facts.eleven?.picks ?? [])].sort(
      (a, b) => b.score - a.score || a.playerName.localeCompare(b.playerName),
    );
    const best = picks[0];
    return best === undefined
      ? null
      : {
          code: best.playerCode,
          name: best.playerName,
          clubId: best.clubId,
          position: best.position,
        };
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

/** What `faceOf` needs, which is less than a whole `DeskContext`: the round's
 *  facts and the fixtures a fixture-scoped assignment joins on. */
export interface FaceContext {
  facts: DeskFacts;
  fixtures: readonly Fixture[];
  /** The Team Sheet's men — empty for every other kind. */
  presserLines?: readonly PresserLine[];
  /** The season's numbers, for deciding which of them is the story. */
  players?: readonly FootballSnapshot["players"][number][];
  /** A draft report's match-ups by cut-off, the lead first, for its cover. */
  drafts?: ReadonlyMap<Cutoff, { contexts: readonly MatchupContext[] }>;
}
