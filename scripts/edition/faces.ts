import type {
  Assignment,
  Fixture,
  FootballSnapshot,
  PresserLine,
  ResolvedPlayer,
  StoryFace,
} from "@epl/core";
import { fielded, menIn } from "./lineups";
import type { RoundFacts } from "./facts";

// Who the story prints a picture of.
//
// **The desk's choice and never the writer's**, which is why it is computed from
// facts rather than read out of the prose — a model that named the man would be
// a model choosing the photograph, and that is the one thing `strangers()`
// exists to catch it doing.

/** The man a story prints a picture of: the highest-scoring rostered man among
 *  those given, and null when nobody among them was priced.
 *
 *  **The desk's choice and never the writer's.** It comes off the same numbers
 *  the brief was built out of, so the face and the prose cannot disagree, and a
 *  model cannot put a footballer in the picture slot by naming him. `code` and
 *  not `id` (CODE_RULES §3): this is persisted in `paper.json`, and only the
 *  code is season-stable.
 *
 *  Ties on points break on name, so the same round picks the same man twice. */
function bestOf(men: readonly ResolvedPlayer[], facts: RoundFacts): StoryFace | null {
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

  // The tie-shaped kinds: both squads, and the best man across the two.
  if (assignment.kind === "tie-report" || assignment.kind === "tie-call") {
    const both = [assignment.tie?.homeTeamId, assignment.tie?.awayTeamId].flatMap((teamId) =>
      teamId === undefined ? [] : fielded(facts.teams.find((team) => team.teamId === teamId)),
    );
    return bestOf(both, facts);
  }

  // The fixture-shaped kinds: everyone in the league with a man in that match.
  if (assignment.kind === "match-report" || assignment.kind === "fixture-preview") {
    const fixture = ctx.fixtures.find((each) => each.id === assignment.fixtureId);
    if (fixture === undefined) return null;
    return bestOf(
      facts.teams.flatMap((team) => menIn(fixture, team)),
      facts,
    );
  }

  // The eleven's own best man, from the picks the column is written about —
  // `score` is the eleven's own number and is what put him in the side.
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

  // The Team Sheet's man: the biggest name in the day's news.
  //
  // **Importance is FPL's own numbers, because we have no better yet.** Goal
  // involvements first, then FPL's `influence`, then minutes — the mix Craig
  // asked for on 18 Sep ("use draft position/fpl scoring mix ... to know which
  // players are the most important"). Draft position and Fantrax ownership %
  // would be better signals and neither is exported yet; GAZETTA.md carries it.
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

/** How much this man's news matters today.
 *
 *  **What CHANGED outranks everything**, which took three goes to learn. The
 *  first version multiplied goal involvements by a thousand and led on two goals
 *  scored in a sixty-three-minute season; the second used minutes, which Craig
 *  rejected outright — low minutes can mean first-choice and injured, and a
 *  returning first-teamer is the most newsworthy thing on the page. Nor is
 *  volume news: "more doesnt mean bigger news".
 *
 *  So a man whose availability moved around this conference leads, and FPL's own
 *  `newsAdded` is what says so — the field `types.ts` already calls "what makes
 *  it an item on a news list rather than a state on a badge". Among those, the
 *  season's numbers only break the tie. Ownership and draft position would be
 *  better still; GAZETTA.md carries it. */
export function weight(each: { fresh?: boolean; player?: { season: { influence: number } } }): number {
  const season = each.player?.season;
  if (season === undefined) return -1;
  // FPL's own `influence` is the tie-break and the whole of it: it already
  // aggregates a season's contribution and is minutes-weighted by construction,
  // so a cameo cannot beat a regular the way a per-90 rate let it.
  const matters = season.influence;
  // A standing absence cannot outrank news, whoever he is.
  return each.fresh === false ? matters : matters + 100_000;
}

/** What `faceOf` needs, which is less than a whole `DeskContext`: the round's
 *  facts and the fixtures a fixture-scoped assignment joins on. */
export interface FaceContext {
  facts: RoundFacts;
  fixtures: readonly Fixture[];
  /** The Team Sheet's men — empty for every other kind. */
  presserLines?: readonly PresserLine[];
  /** The season's numbers, for deciding which of them is the story. */
  players?: readonly FootballSnapshot["players"][number][];
}
