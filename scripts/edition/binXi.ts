import {
  ASSIST,
  FANTRAX_LEAGUE_ID,
  KEEPER,
  OUTFIELD,
  BIN_XI,
  availabilityOf,
  binHistory,
  binKeyStats,
  binMen,
  binStandfirst,
  binXi,
  buildBinBrief,
  categoryPoints,
  fetchLive,
  fetchPoolWindow,
  fetchTransactions,
  firstScored,
  formations,
  fplWeeks,
  fullClubName,
  isUnmapped,
  londonDayOf,
  mapLiveStats,
  mapPlayerStats,
  mapTransactions,
  leagueLimits,
  openingGameweek,
  periodDays,
  periodGameweeks,
  playerByCode,
  type Assignment,
  type BinMatch,
  type Club,
  type Fixture,
  type FootballSnapshot,
  type GameweekKickoff,
  type LeagueInfo,
  type StoryBin,
  type StoryFace,
  type StoryThread,
  undrafted,
} from "@epl/core";
import limits from "../../data/leagues/roster-limits.json";
import { STATS_LEAGUE } from "../leagues";
import { readScoring } from "../scoring";
import { BRIDGE } from "./bridge";
import type { DeskFacts } from "./facts";
import { readArchive } from "./persist";

// The reads behind the Bin XI, made only when it is assigned: the league's free agents and their
// points over the period's days, the stats league's shots and chances over the same days, and FPL's
// matches, joined through the bridge.

export interface BinDesk {
  brief: string;
  /** The desk's standfirst, which replaces whatever the writer returned. */
  deck: string;
  cargo: StoryBin;
  /** Every name the brief gives, for the editor. */
  names: string[];
  face: StoryFace;
}

const STATUS: Record<string, string> = { injured: "injured", suspended: "suspended", unavailable: "unavailable", doubt: "a doubt" };

export async function binXiDesk(input: {
  assignments: readonly Assignment[];
  info: LeagueInfo;
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  period: number;
  gameweeks: readonly number[];
  season: readonly Fixture[];
  kickoffs: readonly GameweekKickoff[];
  clubs: ReadonlyMap<number, Club>;
  threads: readonly StoryThread[];
  say: (message: string) => void;
}): Promise<BinDesk | null> {
  const { info, snapshot, facts, period, clubs, say } = input;
  if (!input.assignments.some((each) => each.kind === "bin-xi")) return null;
  // Before a draft every man is in nobody's squad, and an eleven of the whole pool is not the bin.
  if (!facts.teams.some((team) => team.players.length > 0)) return say("Bin XI: no squads yet; nothing filed."), null;
  const shapes = formations(leagueLimits(info.roster, limits, FANTRAX_LEAGUE_ID));
  if (shapes.length === 0) return say("Bin XI: no position minimums on record for this league (npm run roster-limits); nothing filed."), null;
  const scoring = info.scoringPeriods.find((each) => each.number === period);
  if (scoring === undefined) return say(`Bin XI: Fantrax has no period ${period}; nothing filed.`), null;

  const window = periodDays(scoring);
  const played = input.season.filter((fixture) => {
    const day = londonDayOf(fixture.kickoff);
    return fixture.status === "finished" && day !== null && day >= window.startDate && day <= window.endDate;
  });
  const [pool, outfield, keepers, transactions, rows, priced] = await Promise.all([
    fetchPoolWindow(FANTRAX_LEAGUE_ID, window, "ALL_AVAILABLE").then(mapPlayerStats),
    // The stats league costs the brief its shots and chances, never the column.
    fetchPoolWindow(STATS_LEAGUE.leagueId, window, "ALL", OUTFIELD).then(mapPlayerStats).catch(() => []),
    fetchPoolWindow(STATS_LEAGUE.leagueId, window, "ALL", KEEPER).then(mapPlayerStats).catch(() => []),
    fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").then((raw) => mapTransactions(raw, "CLAIM_DROP")).catch(() => []),
    Promise.all(input.gameweeks.map((gw) => (gw === snapshot.gameweek ? Promise.resolve(snapshot.stats) : fetchLive(gw).then(mapLiveStats)))),
    readScoring(),
  ]);

  const byCode = playerByCode(snapshot);
  const inWindow = new Set(played.map((fixture) => fixture.id));
  const { men, extras, unjoined } = binMen({
    pool,
    sheet: new Map([...outfield, ...keepers].map((line) => [line.fantraxId, line])),
    player: (fantraxId) => {
      const entry = BRIDGE[fantraxId];
      return entry === undefined || isUnmapped(entry) ? null : (byCode.get(entry.fplCode) ?? null);
    },
    weeks: fplWeeks(rows.flat(), (fixtureId) => inWindow.has(fixtureId)),
  });
  if (unjoined.length > 0) say(`  Bin XI: ${unjoined.length} scorers could not be joined (npm run bridge): ${unjoined.slice(0, 5).join(", ")}`);

  const rules = priced?.rules ?? null;
  const assistCategory = priced === null ? null : firstScored(priced.categories, ASSIST);
  const side = binXi(
    men,
    shapes,
    (position) => {
      const goal = rules === null ? null : categoryPoints(rules, "G", position);
      const assist = rules === null || assistCategory === null ? null : categoryPoints(rules, assistCategory.short, position);
      return goal === null || assist === null ? null : { goal, assist };
    },
    info.roster.maxReservePlayers,
    BIN_XI.luck,
  );
  if (side === null) return say("Bin XI: no allowed shape could be filled from men who started; nothing filed."), null;

  const calendar = periodGameweeks(info.scoringPeriods, [...input.kickoffs]);
  const gameweek = openingGameweek(calendar, period) ?? snapshot.gameweek;
  const club = (clubId: number) => fullClubName(clubs.get(clubId)?.name ?? "an unknown club");
  const teamName = (teamId: string) => info.teams.find((team) => team.teamId === teamId)?.name ?? teamId;
  const lastWeek = readArchive(FANTRAX_LEAGUE_ID, "bin-xi").find((story) => story.gameweek === gameweek - 1)?.extras?.bin?.xi ?? [];
  const sides = [...facts.scores.values()].map((score) => score.points);
  const brief = buildBinBrief({
    gameweek,
    side,
    sides,
    club,
    matches: (clubId) =>
      played.flatMap((fixture): BinMatch[] => {
        if (fixture.homeScore === null || fixture.awayScore === null) return [];
        if (fixture.homeClubId === clubId) return [{ opponent: club(fixture.awayClubId), home: true, scored: fixture.homeScore, conceded: fixture.awayScore }];
        if (fixture.awayClubId === clubId) return [{ opponent: club(fixture.homeClubId), home: false, scored: fixture.awayScore, conceded: fixture.homeScore }];
        return [];
      }),
    extras: (man) => extras.get(man.fantraxId) ?? { cleanSheet: false, saves: null, tacklesWon: null, interceptions: null, clearances: null },
    history: binHistory({
      gameweek, teams: facts.teams, fielded: facts.fielded, transactions, pedigree: facts.pedigree, teamName,
      gameweekOf: (each) => openingGameweek(calendar, each) ?? null,
    }),
    undrafted: undrafted(facts.pedigree),
    status: (man) => STATUS[availabilityOf(byCode.get(man.code) ?? null).state] ?? null,
    lastWeek: new Set(lastWeek.map((man) => man.code)),
    blanked: [...clubs.values()].filter((each) => !played.some((f) => f.homeClubId === each.id || f.awayClubId === each.id)).map((each) => fullClubName(each.name)),
    threads: input.threads,
  });

  const printed = (man: (typeof side.xi)[number]) => ({
    name: man.name, code: man.code, slot: man.position, club: clubs.get(man.clubId)?.shortName ?? "", points: man.points, minutes: man.minutes,
  });
  const deck = binStandfirst(gameweek, side.total, sides);
  const [best] = [...side.xi].sort((a, b) => b.points - a.points);
  return {
    brief,
    deck,
    cargo: { shape: side.shape, total: side.total, xi: side.xi.map(printed), bench: side.bench.map(printed), keyStats: binKeyStats(side) },
    names: [...side.xi, ...side.bench].map((man) => man.name).concat(info.teams.map((team) => team.name), [...clubs.values()].map((each) => fullClubName(each.name))),
    face: { code: best.code, name: best.name, clubId: best.clubId, position: best.position },
  };
}
