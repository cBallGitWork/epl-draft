import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  SEASON_PREDICTIONS,
  availabilityOf,
  fetchTeamRosters,
  firstKickoff,
  formations,
  fullClubName,
  fullPrintName,
  isResolved,
  locksAt,
  mapTeamRosters,
  minimumsOf,
  periodGameweeks,
  playSeason,
  projectionIntel,
  readMoves,
  resolveRosters,
  seasonCalls,
  seasonMan,
  ukSpelling,
  type Assignment,
  type Bridge,
  type CallMan,
  type DraftPick,
  type EditorMove,
  type FootballSnapshot,
  type GameweekKickoff,
  type IntelProjections,
  type LeagueInfo,
  type LeagueProjectionFile,
  type PlayedSeason,
  type SeasonCalls,
  type SeasonSquad,
  type StoryKind,
} from "@epl/core";
import limits from "../../data/leagues/roster-limits.json";
import mapping from "../../data/mappings/fantrax.json";
import { INTEL_SEASON, readIntel } from "../intel";
import { EDITIONS_ROOT } from "../paths";

const KIND: StoryKind = "season-predictions";

// The squads as Lawro's power rankings may know them: every squad as drafted, ranked by playing it out over the league's
// own schedule. Its reads are its own and made only when the column is assigned; each refusal files nothing.

export interface SeasonDesk {
  calls: SeasonCalls;
  played: PlayedSeason;
  /** The season's first lock, which the column files before. */
  locksAt: string;
  /** The slot letters in words, from the commissioner's own position names. */
  slotName: (slot: string) => string;
  /** Each side's men by name, for the line that may name only its own. */
  squads: ReadonlyMap<string, readonly string[]>;
  /** Every team and man the column may name, and every club by FPL's own name. */
  names: string[];
  clubs: string[];
}

export async function seasonDesk(input: {
  assignments: readonly Assignment[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  kickoffs: readonly GameweekKickoff[];
  pedigree: ReadonlyMap<string, DraftPick>;
  say: (message: string) => void;
}): Promise<SeasonDesk | null> {
  const round = input.assignments.find((each) => each.kind === KIND)?.round;
  if (round === undefined) return null;
  const { info, say } = input;
  if (input.pedigree.size === 0) return say("Season predictions: the draft is not complete; nothing filed."), null;
  const minimums = minimumsOf(limits, FANTRAX_LEAGUE_ID);
  const shapes = minimums === null ? [] : formations({ ...info.roster, minActiveByPosition: minimums });
  if (shapes.length === 0) return say("Season predictions: no position minimums on record (npm run roster-limits); nothing filed."), null;
  const pack = readIntel<LeagueProjectionFile>("league-projections", `${INTEL_SEASON}.json`);
  if (pack === null) return say("Season predictions: no league projections held (npm run draft-pack); nothing filed."), null;
  const rosters = await fetchTeamRosters(FANTRAX_LEAGUE_ID, round.period).catch(() => null);
  if (rosters === null) return say(`Season predictions: Fantrax would not give period ${round.period}'s rosters.`), null;

  const played = new Set(info.matchups.map((each) => each.period));
  const calendar = periodGameweeks(info.scoringPeriods, [...input.kickoffs]);
  const periods = new Map(calendar.filter((each) => played.has(each.period)).map((each) => [each.period, each.gameweeks]));
  const bands = projectionIntel(readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`));
  const rows = new Map(pack.players.map((row) => [row.fantraxId, row]));
  const clubs = new Map(input.snapshot.clubs.map((club) => [club.id, fullClubName(club.name)]));
  const teams = resolveRosters(input.snapshot, mapTeamRosters(rosters), mapping as Bridge).teams;

  const missing: string[] = [];
  const squads: SeasonSquad[] = [];
  const named = new Map<string, CallMan[]>();
  for (const team of teams) {
    const men = team.players.filter(isResolved).flatMap(({ slot, player }) => {
      const row = rows.get(slot.fantraxId);
      if (row === undefined) return missing.push(player.name), [];
      const man = seasonMan(row, bands.get(player.code), pack.gameweeks, periods, SEASON_PREDICTIONS.band);
      const pick = input.pedigree.get(slot.fantraxId);
      const call: CallMan = { fantraxId: slot.fantraxId, name: ukSpelling(fullPrintName(player)), club: clubs.get(player.clubId) ?? "", season: man.season, availability: availabilityOf(player), overall: pick?.overall ?? null };
      return [{ man, call }];
    });
    squads.push({ teamId: team.teamId, name: info.teams.find((each) => each.teamId === team.teamId)?.name ?? team.teamName, men: men.map((each) => each.man) });
    named.set(team.teamId, men.map((each) => each.call));
  }
  if (missing.length > 0) say(`  Season predictions: ${missing.length} men have no league projection (npm run draft-pack): ${missing.slice(0, 5).join(", ")}`);

  const season = playSeason({ squads, shapes, together: SEASON_PREDICTIONS.together, matchups: info.matchups, runs: SEASON_PREDICTIONS.runs, seed: SEASON_PREDICTIONS.seed });
  if (season.short.length > 0) say(`  Season predictions: ${season.short.length} periods a side could field no allowed shape.`);
  const calls = seasonCalls(season, named, editorMoves(FANTRAX_LEAGUE_ID));
  if (calls === null) return say("Season predictions: too few sides to rank; nothing filed."), null;
  for (const move of calls.moved) say(`  Season predictions: ${move.by} moved ${move.teamId} from ${move.from} to ${move.place} (${move.on}).`);

  const roster = info.rosterPeriods.find((each) => each.number === round.period);
  const kickoff = roster === undefined ? null : firstKickoff(roster, input.kickoffs);
  const lock = kickoff === null ? null : locksAt(kickoff);
  if (lock === null) return say(`Season predictions: no lock for period ${round.period}; nothing filed.`), null;

  const recorded = limits.leagues[FANTRAX_LEAGUE_ID as keyof typeof limits.leagues]?.positions ?? [];
  const single = new Set(Object.keys(info.roster.maxActiveByPosition).filter((slot) => info.roster.maxActiveByPosition[slot] === 1));
  return {
    calls,
    played: season,
    locksAt: lock,
    slotName: (slot) => {
      const word = recorded.find((each) => each.shortName === slot)?.name.toLowerCase() ?? slot;
      return single.has(slot) ? `the ${word}` : `the ${word}s`;
    },
    squads: new Map([...named].map(([teamId, men]) => [teamId, men.flatMap(spoken)])),
    names: [...info.teams.map((team) => team.name), ...[...named.values()].flat().flatMap(spoken)],
    clubs: input.snapshot.clubs.map((club) => club.name),
  };
}

/** The editor's moves over this league's column, from `data/editions/editor.json`; none where it names none. */
function editorMoves(leagueId: string): EditorMove[] {
  const path = join(EDITIONS_ROOT, "editor.json");
  if (!existsSync(path)) return [];
  const file = JSON.parse(readFileSync(path, "utf8")) as { leagues?: Record<string, Record<string, unknown>> };
  return readMoves(file.leagues?.[leagueId]?.[KIND]);
}

/** A man as the column may write him: his name in full, and his surname alone. */
function spoken(man: CallMan): string[] {
  return [man.name, man.name.split(" ").at(-1) ?? man.name];
}
