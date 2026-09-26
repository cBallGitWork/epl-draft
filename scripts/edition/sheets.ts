import {
  FANTRAX_LEAGUE_ID,
  buildSheetsBrief,
  fetchTeamRosters,
  fullClubName,
  mapTeamRosters,
  nextGameweeks,
  projectedTotal,
  projectionIntel,
  resolveRosters,
  sheetOf,
  sheetsFacts,
  xiFault,
  type Assignment,
  type Bridge,
  type Club,
  type Fixture,
  type FootballSnapshot,
  type IntelProjections,
  type LeagueInfo,
  type Projected,
  type Sheet,
  type TieFacts,
} from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";
import { INTEL_SEASON, readIntel } from "../intel";
import type { DeskFacts } from "./facts";
import { readArchive } from "./persist";
import { readXi } from "./xi";

// The reads behind team news at the lock, made only when the article is due: every earlier
// period's rosters (for changes and debuts), the projections, the predicted elevens, and what the
// paper wrote about each side last round.

export interface SheetsDesk {
  gameweek: number;
  ties: TieFacts[];
  brief: string;
}

/** Earlier periods read at a time: a late-season round asks Fantrax for thirty-odd. */
const HISTORY_BATCH = 5;

export async function sheetsDesk(input: {
  assignments: readonly Assignment[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  period: number;
  /** The gameweeks this period scores. */
  gameweeks: readonly number[];
  season: readonly Fixture[];
  clubs: ReadonlyMap<number, Club>;
  say: (message: string) => void;
}): Promise<SheetsDesk | null> {
  const { info, snapshot, facts, period, gameweeks, clubs, say } = input;
  if (!input.assignments.some((each) => each.kind === "sheets")) return null;
  // The rosters must be this period's as locked, or the article reports a side nobody fielded.
  if (!facts.fielded) {
    say(`Sheets: Fantrax's rosters are not period ${period}'s; nothing filed.`);
    return null;
  }

  // An unread period would turn a change into a debut, so any failure files nothing and the next firing retries.
  const history = await earlierSheets(info, snapshot, period).catch((error: unknown) => {
    say(`Sheets: an earlier period's rosters would not come (${String(error).slice(0, 120)}); nothing filed.`);
    return null;
  });
  if (history === null) return null;

  const fixtures = input.season
    .filter((fixture) => fixture.gameweek !== null && gameweeks.includes(fixture.gameweek))
    .map((fixture) => ({ homeClubId: fixture.homeClubId, awayClubId: fixture.awayClubId }));
  const projected = projectedIn(gameweeks);
  const xi = readXi(gameweeks[0]);

  const ties = sheetsFacts({
    pairings: facts.pairings,
    sheets: new Map(facts.teams.map((team) => [team.teamId, sheetOf(team)])),
    history,
    projected: projected.reading,
    fixtures,
    lastWrote: lastWrote(period),
    playing: new Set(fixtures.flatMap((fixture) => [fixture.homeClubId, fixture.awayClubId])),
    predicted: (man) => {
      const club = clubs.get(man.player.clubId);
      const eleven = club === undefined ? undefined : xi?.clubs?.[club.shortName];
      if (eleven === undefined || xiFault(eleven) !== null) return null;
      return eleven.starters.some((starter) => starter.code === man.player.code);
    },
  });
  if (ties.length === 0) {
    say("Sheets: no head-to-head has two fielded sides; nothing filed.");
    return null;
  }
  if (!projected.covers) say(`Sheets: the projections do not reach gameweek ${gameweeks.join("+")}; no benching is news.`);

  const clubName = (clubId: number) => {
    const club = clubs.get(clubId);
    return club === undefined ? "an unknown club" : fullClubName(club.name);
  };
  const gameweek = gameweeks[0] ?? snapshot.gameweek;
  return { gameweek, ties, brief: buildSheetsBrief({ gameweek, ties, clubName, projected: projected.covers }) };
}

/** Each side's fielded sheets from every earlier period, oldest first. */
async function earlierSheets(info: LeagueInfo, snapshot: FootballSnapshot, period: number): Promise<Map<string, Sheet[]>> {
  const periods = info.rosterPeriods.map((each) => each.number).filter((number) => number < period).sort((a, b) => a - b);
  const read: Sheet[][] = [];
  for (let at = 0; at < periods.length; at += HISTORY_BATCH) {
    const batch = periods.slice(at, at + HISTORY_BATCH);
    const rosters = await Promise.all(batch.map((number) => fetchTeamRosters(FANTRAX_LEAGUE_ID, number)));
    read.push(...rosters.map((raw) => resolveRosters(snapshot, mapTeamRosters(raw), mapping as Bridge).teams.map(sheetOf)));
  }
  const out = new Map<string, Sheet[]>();
  for (const sheet of read.flat()) out.set(sheet.teamId, [...(out.get(sheet.teamId) ?? []), sheet]);
  return out;
}

/** The sister model's points over the period's gameweeks and his chance of starting the first. */
function projectedIn(gameweeks: readonly number[]): { reading: (code: number) => Projected | null; covers: boolean } {
  const projections = projectionIntel(readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`));
  const covers = [...projections.values()].some((player) => player.gameweeks.some((week) => gameweeks.includes(week.gw)));
  return {
    covers,
    reading: (code) => {
      const player = projections.get(code);
      const points = player === undefined ? null : projectedTotal(player, gameweeks);
      return player === undefined || points === null ? null : { points, start: nextGameweeks(player, gameweeks)[0]?.start ?? null };
    },
  };
}

/** Each side's paragraph from the latest earlier team-news article, by team id. */
function lastWrote(period: number): Map<string, string> {
  const last = readArchive(FANTRAX_LEAGUE_ID, "sheets")
    .filter((story) => story.period < period)
    .sort((a, b) => b.period - a.period)[0];
  return new Map((last?.extras?.sheets ?? []).flatMap((tie) => [[tie.home.teamId, tie.home.line], [tie.away.teamId, tie.away.line]] as const));
}
