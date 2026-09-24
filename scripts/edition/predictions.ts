import {
  FANTRAX_LEAGUE_ID,
  PLANNER_RUN,
  callTie,
  fetchLiveScoring,
  fetchSeasonResults,
  fetchTeamRosters,
  firstKickoff,
  fullClubName,
  locksAt,
  mapProjectedTotals,
  mapSeasonResults,
  mapTeamRosters,
  movement,
  pastOffered,
  periodPairings,
  plannerRows,
  predictionRecord,
  predictionSide,
  projectionIntel,
  resolveRosters,
  seasonForm,
  squadMen,
  strengthIntel,
  type Assignment,
  type Bridge,
  type Club,
  type Deal,
  type Fixture,
  type FootballSnapshot,
  type GameweekKickoff,
  type IntelProjections,
  type IntelStrength,
  type LeagueInfo,
  type PredictionsTie,
  type PublishedStory,
  type SideForm,
  type StandingsRow,
} from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";
import { INTEL_SEASON, readIntel } from "../intel";
import { readArchive } from "./persist";

// The round ahead, as Lawro may know it: its ties, both squads, and every call already made.
// Three reads of its own, made only when his column is due; each refusal files nothing.

export interface PredictionsDesk {
  gameweek: number;
  locksAt: string;
  ties: PredictionsTie[];
  record: ReturnType<typeof predictionRecord>;
  past: ReturnType<typeof pastOffered>;
  /** His earlier columns' prose, newest first, and what the skit writer used in them. */
  archive: { prose: string[]; lastLines: string[]; shapes: string[]; targets: string[] };
  /** Names to blank before the word lists run, and the men whose sentences are never a joke. */
  names: string[];
  doubts: string[];
}

export async function predictionsDesk(input: {
  assignments: readonly Assignment[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  season: readonly Fixture[];
  kickoffs: readonly GameweekKickoff[];
  table: readonly StandingsRow[];
  business: readonly Deal[];
  say: (message: string) => void;
}): Promise<PredictionsDesk | null> {
  const round = input.assignments.find((each) => each.kind === "predictions")?.round;
  if (round === undefined) return null;
  const { info, snapshot } = input;
  const pairings = periodPairings(info.matchups, info.teams, round.period);
  const rosterPeriod = info.rosterPeriods.find((each) => each.number === round.period);
  const kickoff = rosterPeriod === undefined ? null : firstKickoff(rosterPeriod, input.kickoffs);
  const lock = kickoff === null ? null : locksAt(kickoff);
  if (pairings.length === 0 || lock === null) return null;

  const [live, rosters, results] = await Promise.all([
    fetchLiveScoring(FANTRAX_LEAGUE_ID, round.period).catch(() => null),
    fetchTeamRosters(FANTRAX_LEAGUE_ID, round.period).catch(() => null),
    fetchSeasonResults(FANTRAX_LEAGUE_ID).catch(() => null),
  ]);
  if (live === null || rosters === null) {
    input.say(`Predictions: Fantrax would not give period ${round.period}'s ${live === null ? "projections" : "rosters"}.`);
    return null;
  }
  const projections = projectionIntel(readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`));
  const strengths = strengthIntel(readIntel<IntelStrength>("strength", `${INTEL_SEASON}.json`));
  if (![...projections.values()].some((player) => player.gameweeks.some((week) => week.gw === round.gameweek))) {
    input.say(`Predictions: the projections export does not reach gameweek ${round.gameweek}; key men and doubts are thin.`);
  }

  const clubs = [...snapshot.clubs];
  const byShort = new Map(clubs.map((club) => [club.shortName, club]));
  const rows = (view: "attack" | "defence") =>
    new Map(plannerRows(input.season, clubs, strengths, view, [round.gameweek]).map((row) => [row.club.id, row]));
  const join = {
    eligible: new Map(info.players.map((player) => [player.fantraxId, player.eligiblePositions])),
    projections,
    horizon: Array.from({ length: PLANNER_RUN }, (_, at) => round.gameweek + at),
    attack: rows("attack"),
    defence: rows("defence"),
    clubs: new Map(clubs.map((club) => [club.id, club])),
    clubName: (club: Club) => fullClubName(club.name),
  };
  const squads = resolveRosters(snapshot, mapTeamRosters(rosters), mapping as Bridge).teams;
  const projected = new Map(mapProjectedTotals(live).map((guess) => [guess.teamId, guess.points]));
  const form = seasonForm(input.table, info.matchups, results === null ? [] : mapSeasonResults(results));
  const named = new Map(info.teams.map((team) => [team.teamId, team.name]));

  const side = (teamId: string, name: string) =>
    predictionSide({
      teamId,
      name,
      projected: projected.get(teamId) ?? null,
      men: (() => {
        const squad = squads.find((team) => team.teamId === teamId);
        return squad === undefined ? [] : squadMen(squad, join);
      })(),
      hardest: strengths.size,
      arrivals: arrivals(input.business, teamId, round.period, byShort),
      form: sideForm(teamId, input.table, form, info, named),
    });
  const ties = pairings.map(({ home, away }) => {
    const [h, a] = [side(home.teamId, home.name), side(away.teamId, away.name)];
    return { home: h, away: a, call: callTie(h, a) };
  });

  const columns = readArchive(FANTRAX_LEAGUE_ID, "predictions")
    .filter((story) => story.period < round.period)
    .sort((a, b) => b.period - a.period);
  const prose = columns.map(proseOf);
  const men = ties.flatMap((tie) => [...tie.home.keyMen, ...tie.away.keyMen, ...tie.home.doubts, ...tie.away.doubts]);
  return {
    gameweek: round.gameweek,
    locksAt: lock,
    ties,
    record: predictionRecord(columns.map((story) => ({ period: story.period, gameweek: story.gameweek, ties: story.ties ?? [] })), form),
    past: pastOffered(ties.flatMap((tie) => (tie.call.instinct === null ? [] : [tie.call.instinct])), prose),
    archive: {
      prose,
      lastLines: columns.slice(0, 12).flatMap((story) => (story.ties ?? []).map((tie) => tie.line.split(/(?<=[.?!])\s+/u).at(-1) ?? "")),
      shapes: (columns[0]?.extras?.skit ?? []).map((edit) => edit.shape),
      targets: columns.slice(0, 10).flatMap((story) => (story.extras?.skit ?? []).flatMap((edit) => (edit.target === null ? [] : [edit.target]))),
    },
    names: [...new Set([...named.values(), ...squads.flatMap((team) => team.players.flatMap((man) => ("player" in man ? [man.player.name] : [])))])],
    doubts: [...new Set(men.filter((man) => man.availability.state !== "fit").map((man) => man.name))],
  };
}

/** Men arriving for this round, as the brief names them. */
function arrivals(deals: readonly Deal[], teamId: string, period: number, clubs: ReadonlyMap<string, Club>): string[] {
  return deals
    .filter((deal) => deal.period === period)
    .flatMap((deal) => movement(deal, teamId).in)
    .map((side) => {
      const club = side.club == null ? undefined : clubs.get(side.club);
      const detail = [side.position, club === undefined ? side.club : fullClubName(club.name)].filter(Boolean).join(", ");
      return detail === "" ? side.playerName : `${side.playerName} (${detail})`;
    });
}

/** Where a side stands, from Fantrax's table and the rounds it has settled. */
function sideForm(
  teamId: string,
  table: readonly StandingsRow[],
  form: ReturnType<typeof seasonForm>,
  info: LeagueInfo,
  named: ReadonlyMap<string, string>,
): SideForm | null {
  const row = table.find((each) => each.teamId === teamId);
  if (row === undefined) return null;
  const run = form.find((each) => each.teamId === teamId)?.run ?? [];
  const last = run.at(-1);
  const opponent = last === undefined ? undefined : info.matchups.find((each) => each.period === last.period && (each.homeTeamId === teamId || each.awayTeamId === teamId));
  const opponentId = opponent === undefined ? undefined : opponent.homeTeamId === teamId ? opponent.awayTeamId : opponent.homeTeamId;
  return {
    rank: row.rank,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    points: row.points,
    last:
      last === undefined || opponentId === undefined
        ? null
        : { gameweek: last.period, result: last.result, opponent: named.get(opponentId) ?? opponentId, pointsFor: last.pointsFor, pointsAgainst: last.pointsAgainst },
    run: run.map((game) => game.result).join(""),
  };
}

/** A column's own words: the opening and every tie's line. */
export function proseOf(story: PublishedStory): string {
  return [story.body, ...(story.ties ?? []).map((tie) => tie.line)].filter((text) => text !== "").join("\n");
}
