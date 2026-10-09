import {
  DASH,
  clubResults,
  fetchFixtures,
  fetchHighlightsFeed,
  fetchLive,
  fetchPlFixture,
  fetchPlMatchStats,
  fetchPlRound,
  fetchPlStaff,
  fetchPlTextstream,
  fullClubName,
  highlightFor,
  isDated,
  clubById,
  londonDayOf,
  mapFixtures,
  mapLiveStats,
  parseHighlightFeed,
  periodFixtures,
  plFixtureCode,
  plManager,
  plMatchFacts,
  lineupOf,
  plMoments,
  plPlayerCodes,
  plTeamSheets,
  reportMen,
  shortClubNames,
  sideFigures,
  strengthIntel,
  strengthPlaces,
  type Club,
  type FootballSnapshot,
  type Fixture,
  type IntelStrength,
  type LeaguePeriod,
  type PlayerMatchStats,
  type ReportDayInput,
  type ReportMatchInput,
  type SeasonLine,
} from "@epl/core";
import { readIntel } from "../intel";
import type { DeskFacts } from "./facts";
import { fitnessAfter, leagueJoin } from "./matchdayLeague";
import { dayMarks } from "./matchdayRatings";
import type { Say } from "./newsroom";
import { codesByOpta } from "./opta";
import { involves } from "./round";

// The reads behind one match-day report: the Premier League's own account of each match, FPL's per-man figures, the league's,
// and our marks. Script-side: about four requests a match, one per past gameweek and six for the marks, made only when a
// report is being written.

/** FPL's live figures for every gameweek before this one; null for a gameweek that would not load. */
function pastRounds(gameweek: number): Promise<(PlayerMatchStats[] | null)[]> {
  return Promise.all(Array.from({ length: gameweek - 1 }, (_, i) => fetchLive(i + 1).then(mapLiveStats).catch(() => null)));
}

/** Each man's season before this gameweek, from FPL's live figures per past gameweek, by code; null when a gameweek is
 *  missing, since a start or a goal in it would go uncounted. */
export function seasonLines(
  past: readonly (readonly PlayerMatchStats[] | null)[],
  snapshot: { players: readonly { id: number; code: number }[]; stats: readonly PlayerMatchStats[] },
): Map<number, SeasonLine> | null {
  const rounds = past.filter((rows) => rows !== null);
  if (rounds.length < past.length) return null;
  const codeOf = new Map(snapshot.players.map((p) => [p.id, p.code]));
  const lines = new Map<number, SeasonLine>();
  const line = (code: number) => lines.get(code) ?? lines.set(code, { startsBefore: 0, matchesBefore: 0, yellowsBefore: 0, goalsSeason: 0 }).get(code)!;
  for (const rows of rounds) {
    for (const row of rows) {
      const code = codeOf.get(row.playerId);
      if (code === undefined) continue;
      const l = line(code);
      l.startsBefore += row.starts;
      l.yellowsBefore += row.yellowCards;
      l.goalsSeason += row.goals;
    }
  }
  for (const row of snapshot.stats) {
    const code = codeOf.get(row.playerId);
    if (code !== undefined) line(code).goalsSeason += row.goals;
  }
  return lines;
}

function reportClub(club: Club | undefined, manager: string | null) {
  return { code: club?.code ?? 0, name: fullClubName(club?.name ?? DASH), shorts: club === undefined ? [] : shortClubNames(club.name), manager };
}

/** The day's input, or null when the Premier League's round cannot be read. `pick` chooses the day's fixtures. */
export async function matchdayInput(opts: {
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  /** The period the day scores in: its matches say whose points are one match's alone. */
  scoring: LeaguePeriod | undefined;
  pick: (fixture: Fixture) => boolean;
  say: Say;
}): Promise<ReportDayInput | null> {
  const { snapshot, facts, say } = opts;
  const gameweek = snapshot.gameweek;
  const season = await fetchFixtures().then(mapFixtures).catch(() => null);
  if (season === null) return say("FPL would not give the season's fixtures, which the table is read from."), null;
  const fixtures = snapshot.fixtures.filter(isDated).filter((f) => f.status === "finished" && opts.pick(f));
  if (fixtures.length === 0) return null;
  const day = londonDayOf(fixtures[0].kickoff) ?? "";

  const round = await fetchPlRound(gameweek).catch(() => null);
  if (round === null) return say("The Premier League's round would not load."), null;

  const clubs = clubById(snapshot);
  const clubOfCode = new Map(snapshot.players.map((p) => [p.code, p.clubId]));
  const optaToCode = codesByOpta(snapshot.players);
  const league = leagueJoin(facts, periodFixtures(opts.scoring, season), clubOfCode);
  const past = await pastRounds(gameweek);
  const seasons = seasonLines(past, snapshot);
  if (seasons === null) say("  FPL would not give every past gameweek: no man's starts or goals this season are told.");
  const codeOfId = new Map(snapshot.players.map((p) => [p.id, p.code]));
  const liveLines = new Map(snapshot.stats.map((s) => [codeOfId.get(s.playerId) ?? -1, { minutes: s.minutes, saves: s.saves, expectedGoals: s.expectedGoals, expectedAssists: s.expectedAssists }]));
  const markFor = await dayMarks({
    day,
    results: clubResults(season, [...past.filter((rows) => rows !== null), snapshot.stats], new Map(snapshot.players.map((p) => [p.id, p.clubId]))),
    fantraxIds: league.fantraxIds,
    minutesOf: (code) => liveLines.get(code)?.minutes ?? 0,
    say,
  });

  // Sky's playlist, joined on both clubs and the score; a video not up yet is null and the page looks again when drawn.
  const videos = await fetchHighlightsFeed().then(parseHighlightFeed).catch(() => []);
  const matches: ReportMatchInput[] = [];
  for (const fixture of fixtures) {
    const pl = round.content.find((each) => plFixtureCode(each) === fixture.code);
    if (pl === undefined) {
      say(`  no Premier League record of fixture ${fixture.code}`);
      continue;
    }
    const [detail, stream, stats] = await Promise.all([fetchPlFixture(pl.id), fetchPlTextstream(pl.id), fetchPlMatchStats(pl.id).catch(() => null)]);
    const sheets = plTeamSheets(detail, optaToCode);
    if (sheets === null) {
      say(`  no team sheets for fixture ${fixture.code}`);
      continue;
    }
    const [homeStaff, awayStaff] = await Promise.all([fetchPlStaff(sheets.home.teamId).catch(() => ({})), fetchPlStaff(sheets.away.teamId).catch(() => ({}))]);
    const moments = plMoments(stream.events.content, plPlayerCodes(detail, optaToCode));
    const injured = [...moments].flatMap((m) => (m.injury ? [m.kind === "substitution" ? m.men[1] : m.men[0]] : [])).filter((c): c is number => c !== null);
    const fitness = await fitnessAfter(injured, fixture.kickoff, league.fantraxIds);
    const home = stats === null ? null : sideFigures(stats, sheets.home.teamId);
    const away = stats === null ? null : sideFigures(stats, sheets.away.teamId);
    const men = reportMen(sheets, moments, { live: liveLines, season: seasons, holders: league.holders, points: league.points, fitness });
    const opponentOf = (side: "home" | "away") => (side === "home" ? fixture.awayClubId : fixture.homeClubId);
    const marks = new Map(markFor === null ? [] : men.filter((m) => m.minutes > 0).map((m) => [m.code, markFor(m.code, opponentOf(m.side), fixture.kickoff)] as const));
    matches.push({
      fixture,
      home: reportClub(clubs.get(fixture.homeClubId), plManager(homeStaff)),
      away: reportClub(clubs.get(fixture.awayClubId), plManager(awayStaff)),
      halfTime: detail.halfTimeScore === undefined ? null : { home: detail.halfTimeScore.homeScore, away: detail.halfTimeScore.awayScore },
      referee: detail.matchOfficials?.find((o) => o.role === "MAIN")?.name?.display ?? null,
      moments,
      men,
      figures: home === null || away === null ? null : { home, away },
      venue: plMatchFacts(detail).ground,
      attendance: plMatchFacts(detail).attendance,
      lineups: { home: lineupOf(sheets.home, moments, markFor === null ? undefined : marks), away: lineupOf(sheets.away, moments, markFor === null ? undefined : marks) },
      marks,
      videoId: highlightFor(videos, { home: clubs.get(fixture.homeClubId)?.name ?? "", away: clubs.get(fixture.awayClubId)?.name ?? "", homeScore: fixture.homeScore, awayScore: fixture.awayScore })?.id ?? null,
    });
  }

  // Each man's club matches before this day, which his starts are counted against.
  for (const match of matches) {
    for (const man of match.men) {
      const clubId = clubOfCode.get(man.code);
      man.matchesBefore = season.filter((f) => f.status === "finished" && clubId !== undefined && involves(f, clubId) && (londonDayOf(f.kickoff) ?? "") < day).length;
    }
  }

  const strengths = strengthIntel(readIntel<IntelStrength>("strength"));
  return {
    day,
    gameweek,
    matches,
    season,
    clubs: snapshot.clubs,
    standing: { attack: strengthPlaces(strengths, "attack"), defence: strengthPlaces(strengths, "defence") },
  };
}
