import { Suspense } from "react";
import {
  type CompetitionTie,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  FANTRAX_MATCHUPS_PATH,
  MS_PER_MINUTE,
  clubById,
  datedKickoffs,
  duringGameweek,
  fixturesInOrder,
  leagueTies,
  nextRound,
  periodPairings,
  roundState,
  cupTies,
  fplCodeOf,
  londonDay,
  londonTime,
  nextDeadline,
  onLondonDay,
} from "@epl/core";
import { leagueTable } from "../standings";
import { footballNow, gameweekLive, seasonFixtures, speaksForNow } from "../football";
import { Scores } from "./Scores";
import RoundWord from "../components/league/RoundWord";
import PageHeader from "../components/shell/PageHeader";
import TabStrip from "../components/shell/TabStrip";
import { bridge, getLeagueSquads, readable, readerTeamId } from "../squads";
import { liveScores, periodPoints } from "../scoreboard";
import YourMatchup from "./YourMatchup";
import { marks } from "../involvement";
import { creditAssists, roundBreaks, roundGoals, roundRedCards, roundStreams } from "../commentary";
import { roundAssistKinds } from "../assistKinds";
import { LEADERS_SHOWN, LIVE_LEAD_MINUTES } from "../config";
import { filedMarks } from "../ratings";
import Vidiprinter from "./Vidiprinter";
import TopStats, { STATS_VIEW, statsHref } from "./TopStats";
import { LEADER_STATS, gameweekLeaders } from "./leaders";
import { wireLines } from "./wireLines";
import { now } from "../clock";
import { BetweenGameweeks, MatchupWaiting } from "./Between";
import OutLink from "../components/shell/OutLink";
import { fantraxPage } from "../fantraxPages";
import Link from "@/app/components/shell/Link";
import { LIVE } from "../components/shell/sections";
import { MY_TEAM } from "../squad/routes";
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
  return { snapshot, season, during: duringGameweek(snapshot, at, LIVE_LEAD_MINUTES), up: nextRound(season, at) };
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
  const drafted = readable(squads);
  const period = drafted?.roundPeriod ?? null;
  const [{ scores }, table] = await Promise.all([
    period === null ? { scores: new Map<string, LiveTeamScore>() } : liveScores(period),
    leagueTable(),
  ]);

  const places = placings(table);

  // The hour before the first kickoff (Craig, 8 Oct 2026: "build the hype"): the minutes to go, and the lock if ahead.
  const first = fixturesInOrder(snapshot).find((fixture) => fixture.kickoff !== null)?.kickoff ?? null;
  const toGo = during && first !== null ? Date.parse(first) - now().getTime() : 0;
  const lock = drafted?.info == null ? null : nextDeadline(drafted.info.rosterPeriods, datedKickoffs(season), now().toISOString());
  const locksAt = lock !== null && first !== null && Date.parse(lock.locksAt) < Date.parse(first) ? lock.locksAt : null;
  const buildUp = toGo > 0 ? <BuildUp ms={toGo} locksAt={locksAt} /> : null;

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
          buildUp ??
          (roundState(snapshot) === null || roundState(snapshot) === "live" ? undefined : (
            <RoundWord state={roundState(snapshot)} />
          ))
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
      <OutLink href={fantraxPage(FANTRAX_MATCHUPS_PATH, period)}>
        Matchups on Fantrax
      </OutLink>
    </div>
  );
}

/** Which plate is open: a query rather than a route, so one page keeps its panels in step. */
const PRINTER = "vidiprinter";

/** The build-up's line: whole minutes to the first kickoff, rounded up, then the lineup lock while it is ahead, as a
 *  way to his team, whose tab Live has taken on a phone. */
function BuildUp({ ms, locksAt }: { ms: number; locksAt: string | null }) {
  const kickoff = `Kick-off in ${Math.ceil(ms / MS_PER_MINUTE)} min`;
  if (locksAt === null) return kickoff;
  // One span: the sub line is a flex row, which drops the space between bare text and a link.
  return (
    <span>
      {kickoff} ·{" "}
      <Link href={MY_TEAM} className="underline">
        lineups lock {londonTime(locksAt)}
      </Link>
    </span>
  );
}
