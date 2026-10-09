import {
  MS_PER_DAY,
  FANTRAX_LEAGUE_ID,
  SHEETS,
  buildSheetsBrief,
  datedKickoffs,
  fetchLive,
  fetchPlayerStories,
  fetchTeamRosters,
  fullClubName,
  groupedBy,
  mapLiveStats,
  mapPlayerStories,
  openingGameweek,
  periodFixtures,
  periodGameweeks,
  sheetOf,
  sheetsFacts,
  xiFault,
  type Assignment,
  type Club,
  type Fixture,
  type FootballSnapshot,
  type LeagueInfo,
  type LeaguePeriod,
  type PlayerStory,
  type RecentGame,
  type Sheet,
  type TieFacts,
} from "@epl/core";
import { rosteredPeriod } from "./bridge";
import type { DeskFacts } from "./facts";
import type { Say } from "./newsroom";
import { readArchive } from "./persist";
import { recentGames } from "./recent";
import { readXi } from "./xi";

// The reads behind team news at the lock, made only when the article is due: every earlier
// period's rosters (for changes and debuts), the predicted elevens, the last few rounds' match reads
// (for form and benchings), Fantrax's news, and what the paper wrote about each side last round.

export interface SheetsDesk {
  gameweek: number;
  ties: TieFacts[];
  brief: string;
  /** Every club's name as the paper prints it, for the editor. */
  clubs: string[];
  /** His club's match this gameweek, "EVE (H)", stamped into the filed sheet. */
  against: (clubId: number) => string | null;
  /** The league's sides, which the voice counts: a tie left off for a side that fielded nobody shortens only the page. */
  sides: number;
}

export async function sheetsDesk(input: {
  assignments: readonly Assignment[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  period: number;
  /** The period's dates, which choose its matches. */
  scoring: LeaguePeriod | undefined;
  season: readonly Fixture[];
  clubs: ReadonlyMap<number, Club>;
  now: string;
  say: Say;
}): Promise<SheetsDesk | null> {
  const { info, snapshot, facts, period, scoring, clubs, now, say } = input;
  if (!input.assignments.some((each) => each.kind === "sheets")) return null;
  // The rosters must be this period's as locked, or the article reports a side nobody fielded.
  if (!facts.fielded) {
    say(`Sheets: Fantrax's rosters are not period ${period}'s; nothing filed.`);
    return null;
  }
  if (scoring === undefined) {
    say(`Sheets: Fantrax has no period ${period}; nothing filed.`);
    return null;
  }

  // An unread period would turn a change into a debut, so any failure files nothing and the next firing retries.
  const history = await earlierSheets(info, snapshot, period).catch((error: unknown) => {
    say(`Sheets: an earlier period's rosters would not come (${String(error).slice(0, 120)}); nothing filed.`);
    return null;
  });
  if (history === null) return null;

  const fixtures = periodFixtures(scoring, input.season).map((fixture) => ({ homeClubId: fixture.homeClubId, awayClubId: fixture.awayClubId }));
  const gameweek = openingGameweek(periodGameweeks(info.scoringPeriods, datedKickoffs(input.season)), period) ?? snapshot.gameweek;
  const xi = readXi(gameweek);
  const [recent, news] = await Promise.all([formRounds(gameweek), newsFor(facts, now)]);

  const ties = sheetsFacts({
    pairings: facts.pairings,
    sheets: new Map(facts.teams.map((team) => [team.teamId, sheetOf(team)])),
    history,
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

  const clubName = (clubId: number) => {
    const club = clubs.get(clubId);
    return club === undefined ? "an unknown club" : fullClubName(club.name);
  };
  // His club's matches this period, off the same list the meetings are read from, so the two agree.
  const matches = (clubId: number) =>
    fixtures.flatMap((match) =>
      match.homeClubId === clubId ? [{ home: true, other: match.awayClubId }] : match.awayClubId === clubId ? [{ home: false, other: match.homeClubId }] : [],
    );
  const described = (clubId: number, word: (match: { home: boolean; other: number }) => string, join: string) => {
    const found = matches(clubId);
    return found.length === 0 ? null : found.map(word).join(join);
  };
  return {
    gameweek,
    ties,
    // "at home to Everton", both halves of a double: the words a reporter would use for his match.
    clubs: [...clubs.values()].map((club) => fullClubName(club.name)),
    brief: buildSheetsBrief({ gameweek, ties, clubName, fixture: (clubId) => described(clubId, (match) => `${match.home ? "at home to" : "away to"} ${clubName(match.other)}`, " and ") }),
    // "EVE (H)", as every pitch in the app labels a match.
    against: (clubId) => described(clubId, (match) => `${clubs.get(match.other)?.shortName ?? "?"} (${match.home ? "H" : "A"})`, " · "),
    sides: info.teams.length,
  };
}

/** Each side's fielded sheets from every earlier period, oldest first. */
export async function earlierSheets(info: LeagueInfo, snapshot: FootballSnapshot, period: number): Promise<Map<string, Sheet[]>> {
  const periods = info.rosterPeriods.map((each) => each.number).filter((number) => number < period).sort((a, b) => a - b);
  const read: Sheet[][] = [];
  for (let at = 0; at < periods.length; at += SHEETS.batch) {
    const batch = periods.slice(at, at + SHEETS.batch);
    const rosters = await Promise.all(batch.map((number) => fetchTeamRosters(FANTRAX_LEAGUE_ID, number)));
    read.push(...rosters.map((raw) => rosteredPeriod(snapshot, raw).teams.map(sheetOf)));
  }
  return groupedBy(read.flat(), (sheet) => sheet.teamId);
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

/** Fantrax's latest report on each named man listed doubtful or out, for the complaint it names;
 *  an injury story can be weeks old and still true. A man listed available carries no news. */
async function newsFor(facts: DeskFacts, now: string): Promise<Map<string, PlayerStory>> {
  const since = Date.parse(now) - SHEETS.injuryDays * MS_PER_DAY;
  const out = new Map<string, PlayerStory>();
  const doubts = facts.teams
    .flatMap((team) => sheetOf(team).starters)
    .filter((man) => man.player.status !== "a");
  for (let at = 0; at < doubts.length; at += SHEETS.batch) {
    const batch = doubts.slice(at, at + SHEETS.batch);
    const reads = await Promise.all(batch.map((man) => fetchPlayerStories(FANTRAX_LEAGUE_ID, man.fantraxId).then(mapPlayerStories).catch(() => [])));
    batch.forEach((man, index) => {
      const story = reads[index][0];
      if (story !== undefined && story.at !== null && story.at >= since) out.set(man.fantraxId, story);
    });
  }
  return out;
}

/** Each side's paragraph from the latest earlier team-news article, by team id. */
function lastWrote(period: number): Map<string, string> {
  const last = readArchive("sheets").find((story) => story.period < period);
  return new Map((last?.extras?.sheets ?? []).flatMap((tie) => [[tie.home.teamId, tie.home.line], [tie.away.teamId, tie.away.line]] as const));
}
