import { Suspense } from "react";
import {
  type CompetitionTie,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  FANTRAX_LEAGUE_PAGE,
  FANTRAX_MATCHUPS_PATH,
  clubById,
  duringGameweek,
  fixturesInOrder,
  leagueTies,
  nextRound,
  periodPairings,
  roundState,
  cupTies,
  fplCodeOf,
  londonDay,
  onLondonDay,
} from "@epl/core";
import { leagueTable } from "../standings";
import { footballNow, gameweekLive, seasonFixtures, speaksForNow } from "../football";
import { Scores } from "./Scores";
import RoundWord from "../components/league/RoundWord";
import PageHeader from "../components/shell/PageHeader";
import TabStrip from "../components/shell/TabStrip";
import { bridge, getLeagueSquads, readerTeamId } from "../squads";
import { liveScores, periodPoints } from "../scoreboard";
import YourMatchup from "./YourMatchup";
import { marks } from "../involvement";
import { creditAssists, roundBreaks, roundGoals, roundRedCards, roundStreams } from "../commentary";
import { roundAssistKinds } from "../assistKinds";
import { LEADERS_SHOWN } from "../config";
import { filedMarks } from "../ratings";
import Vidiprinter from "./Vidiprinter";
import TopStats, { STATS_VIEW, statsHref } from "./TopStats";
import { LEADER_STATS, gameweekLeaders } from "./leaders";
import { wireLines } from "./wireLines";
import { now } from "../clock";
import { BetweenGameweeks, MatchupWaiting } from "./Between";
import OutLink from "../components/shell/OutLink";
import { LIVE } from "../components/shell/sections";
import { clubPlaces } from "../prem/places";
import { placings } from "../league/placings";

// The live centre: your head-to-head first, the real football under it. The football half runs
// off FPL's public API alone, so it works with no Fantrax, no draft and no credential.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** The snapshot and whether there is football on; the clock is read here so a render reproduces. */
async function matchday(): Promise<{
  snapshot: FootballSnapshot;
  /** The whole season's fixtures, kept because the real table is built from them. */
  season: Fixture[];
  during: boolean;
  up: { gameweek: number; kickoff: string } | null;
}> {
  // The season, because the snapshot holds one round and cannot name the next.
  const [snapshot, season] = await Promise.all([footballNow(), seasonFixtures()]);
  const at = now().toISOString();
  return { snapshot, season, during: duringGameweek(snapshot, at), up: nextRound(season, at) };
}

export default async function MatchdayPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stat?: string }>;
}) {
  // Scores is the landing view (Craig, 21 Sep 2026); the vidiprinter and the top stats are a tap away.
  const query = await searchParams;
  const printing = query.view === PRINTER;
  const leading = query.view === STATS_VIEW;
  const stat = LEADER_STATS.find((each) => each === query.stat) ?? LEADER_STATS[0];
  const { snapshot, season, during, up } = await matchday();
  const league = await marks(snapshot.fixtures);

  // The round's goals joined to the men who own them, and the breaks, off one cached read.
  const [goals, streams, breaks, stats, mine, squads, kinds] = await Promise.all([
    roundGoals(snapshot.gameweek, snapshot.players),
    roundStreams(snapshot.gameweek),
    roundBreaks(snapshot.gameweek),
    // FPL's own per-man assist counts, which audit every proposal in `creditAssists`.
    gameweekLive(snapshot.gameweek),
    readerTeamId(),
    getLeagueSquads(),
    roundAssistKinds(snapshot.gameweek),
  ]);
  const reds = roundRedCards(streams, snapshot.players);
  const scored = creditAssists(goals, snapshot, stats, streams, kinds);

  const realPlaces = clubPlaces(season, snapshot.clubs);

  // Today's matches (Craig, 5 Sep 2026), and the whole round when today has none.
  const round = fixturesInOrder(snapshot);
  const day = londonDay(now());
  const onToday = round.filter((f) => onLondonDay(f.kickoff, day));
  const today: readonly Fixture[] = onToday.length > 0 ? onToday : round;

  // The draft's ties; no draft, no schedule or a silent Fantrax costs this half and nothing else.
  const drafted = "period" in squads ? squads : null;
  const period = drafted?.roundPeriod ?? null;
  const [{ scores }, table] = await Promise.all([
    period === null ? { scores: new Map<string, LiveTeamScore>() } : liveScores(period),
    leagueTable(),
  ]);

  const places = placings(table);

  // Every tie this week: the league's pairings and our cups (Craig, 5 Sep 2026).
  const ties: CompetitionTie[] =
    drafted?.info != null && period !== null
      ? [
          ...leagueTies(periodPairings(drafted.info.matchups, drafted.info.teams, period)),
          ...cupTies(drafted.info.teams.length, snapshot.gameweek),
        ]
      : [];

  // The gameweek's leaders, off reads already made: Fantrax's cached live read and FPL's round.
  const boards = leading
    ? gameweekLeaders({
        snapshot,
        stats,
        priced: period === null ? new Map() : await periodPoints(period),
        marks: filedMarks,
        codeOf: (fantraxId) => fplCodeOf(bridge, fantraxId),
        owners: league.owners,
        mine,
        shown: LEADERS_SHOWN,
      })
    : null;

  // Between gameweeks the route still answers, saying where the football went.
  return (
    <div className="flex flex-col gap-4">
      {/* The round and its state are the page's title (Craig, 5 Sep 2026: "gameweek 3 LIVE as the
          title"); the sub line carries "Full time" or "Final", never LIVE twice. */}
      <PageHeader
        title={`Draft Gameweek ${snapshot.gameweek}${roundState(snapshot) === "live" ? " LIVE" : ""}`}
        sub={
          roundState(snapshot) === null || roundState(snapshot) === "live" ? undefined : (
            <RoundWord state={roundState(snapshot)} />
          )
        }
        competition
      />
      {/* First in the document, streamed: Fantrax's scoreboard is the one read nothing waits on. */}
      <Suspense fallback={<MatchupWaiting />}>
        <YourMatchup />
      </Suspense>
      <TabStrip
        label="Which view"
        tabs={[
          { key: PRINTER, label: "Vidiprinter", href: `${LIVE}?view=${PRINTER}` },
          { key: "scores", label: "Scores", href: LIVE },
          { key: STATS_VIEW, label: "Top stats", href: statsHref(LEADER_STATS[0]) },
        ]}
        current={printing ? PRINTER : leading ? STATS_VIEW : "scores"}
      />
      {printing ? (
        <Vidiprinter
          lines={wireLines([...scored, ...reds], breaks, snapshot, league.owners, mine).lines}
        />
      ) : boards !== null ? (
        <TopStats boards={boards} stat={stat} />
      ) : during ? (
        <Scores
          ties={ties}
          scores={scores}
          places={places}
          clubPlaces={realPlaces}
          mine={mine}
          fixtures={today}
          clubs={clubById(snapshot)}
          now={speaksForNow(snapshot)}
          gameweek={snapshot.gameweek}
        />
      ) : (
        <BetweenGameweeks snapshot={snapshot} up={up} />
      )}
      {/* Fantrax's Matchups for this gameweek's period; its current one when we could not read it. */}
      <OutLink
        href={`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_MATCHUPS_PATH}${period === null ? "" : `;period=${period}`}`}
      >
        Matchups on Fantrax
      </OutLink>
    </div>
  );
}

/** Which plate is open: a query rather than a route, so one page keeps its panels in step. */
const PRINTER = "vidiprinter";
