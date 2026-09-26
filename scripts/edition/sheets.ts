import {
  FANTRAX_LEAGUE_ID,
  SHEETS,
  buildSheetsBrief,
  fixtureLabel,
  oppositionByClub,
  fetchLive,
  fetchPlayerStories,
  fetchPoolNews,
  fetchTeamRosters,
  fullClubName,
  mapLiveStats,
  mapPlayerStories,
  mapPoolNews,
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
  type PlayerStory,
  type RecentGame,
  type Projected,
  type Sheet,
  type TieFacts,
} from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";
import { INTEL_SEASON, readIntel } from "../intel";
import type { DeskFacts } from "./facts";
import { readArchive } from "./persist";
import { recentGames } from "./recent";
import { readXi } from "./xi";

// The reads behind team news at the lock, made only when the article is due: every earlier
// period's rosters (for changes and debuts), the projections, the predicted elevens, the last few
// rounds' match reads (for form), Fantrax's news, and what the paper wrote about each side last round.

export interface SheetsDesk {
  gameweek: number;
  ties: TieFacts[];
  brief: string;
  /** His club's match this round, "EVE (H)", stamped into the filed sheet. */
  against: (clubId: number) => string | null;
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
  now: string;
  say: (message: string) => void;
}): Promise<SheetsDesk | null> {
  const { info, snapshot, facts, period, gameweeks, clubs, now, say } = input;
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
  const [recent, news] = await Promise.all([formRounds(gameweeks[0] ?? snapshot.gameweek), newsFor(facts, now)]);

  const ties = sheetsFacts({
    pairings: facts.pairings,
    sheets: new Map(facts.teams.map((team) => [team.teamId, sheetOf(team)])),
    history,
    projected: projected.reading,
    fixtures,
    lastWrote: lastWrote(period),
    recent: (man) => recent(man.player.id),
    news: (man) => news.get(man.fantraxId) ?? null,
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
  const opposition = oppositionByClub(snapshot);
  return {
    gameweek,
    ties,
    brief: buildSheetsBrief({ gameweek, ties, clubName, projected: projected.covers }),
    against: (clubId) => fixtureLabel(opposition.get(clubId)),
  };
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

/** Each man's last few rounds before this one, a round he missed read as nought, so a row is
 *  always as long as the rounds read. Keyed by FPL's per-season id, and never persisted. */
async function formRounds(first: number): Promise<(playerId: number) => RecentGame[]> {
  const rounds = Array.from({ length: SHEETS.formRounds }, (_, at) => first - SHEETS.formRounds + at).filter((gw) => gw >= 1);
  const reads = await Promise.all(rounds.map((gw) => fetchLive(gw).then(mapLiveStats).catch(() => null)));
  // A round we could not read is not a round he missed: no form is claimed off half the reads.
  if (reads.some((read) => read === null)) return () => [];
  const played = recentGames(rounds, reads as NonNullable<(typeof reads)[number]>[]);
  return (playerId) =>
    rounds.map((gameweek) => played.get(playerId)?.find((game) => game.gameweek === gameweek) ?? { gameweek, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, points: 0 });
}

/** Fantrax's latest story on each starter: the pool's last day in one read, then the history of
 *  any starter FPL lists as unavailable, whose injury story can be weeks old and still the news. */
async function newsFor(facts: DeskFacts, now: string): Promise<Map<string, PlayerStory>> {
  const within = (days: number) => (story: PlayerStory | undefined) =>
    story !== undefined && story.at !== null && story.at >= Date.parse(now) - days * 24 * 60 * 60 * 1000 ? story : undefined;
  const fresh = within(SHEETS.newsDays);
  const pool = await fetchPoolNews(FANTRAX_LEAGUE_ID).then(mapPoolNews).catch(() => ({}) as Record<string, PlayerStory>);
  const out = new Map<string, PlayerStory>();
  for (const [fantraxId, story] of Object.entries(pool)) if (fresh(story) !== undefined) out.set(fantraxId, story);

  const doubts = facts.teams
    .flatMap((team) => sheetOf(team).starters)
    .filter((man) => man.player.status !== "a");
  for (let at = 0; at < doubts.length; at += HISTORY_BATCH) {
    const batch = doubts.slice(at, at + HISTORY_BATCH);
    const reads = await Promise.all(batch.map((man) => fetchPlayerStories(FANTRAX_LEAGUE_ID, man.fantraxId).then(mapPlayerStories).catch(() => [])));
    batch.forEach((man, index) => {
      const story = within(SHEETS.injuryDays)(reads[index][0]);
      if (story !== undefined) out.set(man.fantraxId, story);
    });
  }
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
