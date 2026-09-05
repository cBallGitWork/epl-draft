import { Suspense } from "react";
import {
  PLACEHOLDER_ROUNDS,
  type CompetitionTie,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  clubById,
  duringGameweek,
  fixturesInOrder,
  leagueTable as realTable,
  leagueTies,
  nextRound,
  periodPairings,
  roundState,
  seededTies,
} from "@epl/core";
import { leagueTable, teamBadges } from "../standings";
import { footballNow, seasonFixtures, speaksForNow } from "../football";
import { Scores } from "./Scores";
import RoundWord from "../components/league/RoundWord";
import PageHeader from "../components/shell/PageHeader";
import { getLeagueSquads } from "../squads";
import { liveScores } from "../scoreboard";
import Afternoon from "./Afternoon";
import YourMatchup from "./YourMatchup";
import { marks } from "../involvement";

import { readerTeamId } from "../squads";
import { roundBreaks, roundGoals } from "../commentary";
import { wireLines } from "./wireLines";
import Wire from "./Wire";
import { londonDayKey } from "../londonTime";
import { BetweenGameweeks, MatchupWaiting } from "./Between";

// The live centre. Your head-to-head first, the real football under it — the
// order a manager actually cares about them in.
//
// The football half runs entirely off FPL's public API, so it works from the
// first match of the season without Fantrax, a draft, or a single credential.
// The head-to-head renders nothing when there is nothing to say, which keeps
// that true.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** The snapshot and whether there is football on. The clock is read here rather
 *  than in the component: a render is meant to be reproducible, and fetching is
 *  already where this page touches the world. */
async function matchday(): Promise<{
  snapshot: FootballSnapshot;
  /** The whole season's fixtures. Returned rather than dropped, because the real
   *  table is built from them and re-fetching would be a second cache lookup for
   *  a value already in hand. */
  season: Fixture[];
  during: boolean;
  up: { gameweek: number; kickoff: string } | null;
}> {
  // The season, not the snapshot: `getFootballSnapshot` fetches one round's
  // fixtures, so nothing on it can name the round after it. `seasonFixtures` is
  // the read that sees the rest of the calendar, and it is already warm.
  const [snapshot, season] = await Promise.all([footballNow(), seasonFixtures()]);
  const at = new Date().toISOString();
  return { snapshot, season, during: duringGameweek(snapshot, at), up: nextRound(season, at) };
}

export default async function MatchdayPage() {
  const { snapshot, season, during, up } = await matchday();
  const league = await marks(snapshot.fixtures);

  // The round's goals, joined to the men who own them. One upstream request for
  // ten matches, and the one question on this page neither Fantrax nor FPL can
  // answer: not just who scored, but whose he is.
  // The breaks come off the SAME cached round read as the goals, so half time
  // and full time cost nothing upstream.
  const [goals, breaks, mine, squads] = await Promise.all([
    roundGoals(snapshot.gameweek, snapshot.players),
    roundBreaks(snapshot.gameweek),
    readerTeamId(),
    getLeagueSquads(),
  ]);
  const wire = wireLines(goals, breaks, snapshot, league.owners, mine);

  // **The day being played, not the whole round** — Craig, 5 Sep 2026: *"Maybe
  // the live tab only shows matches from TODAY, to keep the space?"* A gameweek
  // runs Friday to Monday, so on a Sunday afternoon six of the ten rows are
  // about matches that finished yesterday and the two that are on are below the
  // fold.
  //
  // **The whole round is the fallback and that is the load-bearing half.** A
  // reader who opens this on a Tuesday, or before FPL has dated the round, must
  // not be shown an empty panel — `duringGameweek` is a four-day window and this
  // filter is a one-day one, so the two disagree for most of the week.
  // **Both tables, for CM's blue block** (Craig, 5 Sep 2026: "The blue box in CM
  // is for league position… Put current league position there instead"). Two
  // competitions on one screen means two rankings, and neither may stand in for
  // the other: a manager's place is Fantrax's own rank off the standings, and a
  // club's is its place in the real table, which is the ARRAY ORDER of
  // `leagueTable` — a `TableRow` carries no rank of its own precisely because
  // the list IS the ranking (`football/table.ts`).
  //
  // Costs nothing new: `seasonFixtures` is already fetched by `matchday()` above
  // and `leagueTable` is pure.
  const clubPlaces = new Map(
    realTable(season, snapshot.clubs).map((row, at) => [row.clubId, at + 1]),
  );

  const round = fixturesInOrder(snapshot);
  const day = londonDayKey(new Date().toISOString());
  const onToday = round.filter((f) => f.kickoff !== null && londonDayKey(f.kickoff) === day);
  const today: readonly Fixture[] = onToday.length > 0 ? onToday : round;

  // The draft's eight ties, beside the round's ten matches. A league with no
  // draft yet, no schedule, or a Fantrax that would not answer costs the first
  // table and nothing else — the football half needs none of them.
  const drafted = "period" in squads ? squads : null;
  const period = drafted?.roundPeriod ?? null;
  const [{ scores }, badges, table] = await Promise.all([
    period === null ? { scores: new Map<string, LiveTeamScore>() } : liveScores(period),
    teamBadges(),
    leagueTable(),
  ]);

  // Every tie being played this week, not only the league's eight — Craig, 5 Sep
  // 2026: *"'The draft' should be which comp it is (we will have duel comps at
  // times)."* The schedule's own shape and the schedule's own two sources:
  // Fantrax's pairings, and the knockouts `league/competitions.ts` declares.
  // Both reads behind this are already warm — the board's badges and the table
  // come off one cached `getStandings`.
  // Fantrax's own rank, by team id. Empty when the scoreboard would not answer,
  // which draws empty blocks rather than a made-up ordering.
  const places = new Map(
    "unavailable" in table ? [] : table.map((row) => [row.teamId, row.rank] as const),
  );

  const ties: CompetitionTie[] =
    drafted?.info != null && period !== null
      ? [
          ...leagueTies(periodPairings(drafted.info.matchups, drafted.info.teams, period)),
          ...seededTies(
            PLACEHOLDER_ROUNDS,
            "unavailable" in table ? [] : table,
            snapshot.gameweek,
          ),
        ]
      : [];

  // The tab is hidden between gameweeks, but the route still has to answer:
  // someone lands here from a bookmark, or is reading it when the last match
  // ends. A redirect would take the page out from under them; a `Nothing` would
  // claim something failed. Neither is true, so it says where the football went.
  // The head-to-head leads either way. Between rounds it is the pairing without
  // a score, which is the honest version of "who am I playing next" — and it is
  // the same component, so the one that matters on Saturday is the one that has
  // been on screen all week.
  return (
    <div className="flex flex-col gap-4">
      {/* **The round is the page's TITLE, at the top and at the size of one**
          (Craig, 5 Sep 2026: "Gameweek 3 · Live - this should be at the top, big
          title"). It was a yellow caption two thirds of the way down, between
          the wire and the scores, where it read as a heading for the tables
          under it rather than as the name of the screen — and the one fact a
          manager wants first from this tab is which round is on and whether it
          is live.

          `PageHeader` and not `Caption`, which is the app's own rule (see
          `app/titles.ts`): the plated bar names the SUBJECT of a screen and the
          yellow caption names the view. The subject here is the round.

          Drawn at every state, including between rounds — `BetweenGameweeks`
          below carries its own header for the case where there is no football,
          and this one answers the question the tab is named for. */}
      <PageHeader
        // **The round AND its state, on the bar** (Craig, 5 Sep 2026: "gameweek
        // 3 LIVE as the title"). The state was under it, in `RoundWord`, on a
        // 24px sub line — which is the right place for a date or a count and the
        // wrong place for the one word this tab exists to say. A reader opening
        // the Live tab at ten past four is asking whether football is on; the
        // bar is what he reads first.
        //
        // Only when there IS a state. Between rounds `roundState` answers null,
        // and a bar reading "Gameweek 4" with nothing after it is the honest
        // shape of a Tuesday.
        title={`Gameweek ${snapshot.gameweek}${roundState(snapshot) === "live" ? " LIVE" : ""}`}
        sub={
          // `RoundWord` renders nothing between kickoffs, which is right — there
          // is no state to name — and `PageHeader.Sub` renders nothing for a
          // false child, so the strip goes with it rather than drawing empty.
          //
          // **And nothing while it is LIVE**, because the bar above now says that
          // word. The two states this still carries are "Full time" and "Final",
          // which are qualifications on a number rather than headlines: Final is
          // a promise that the total has stopped moving, and a bar is the wrong
          // place for a promise about a figure three panels down.
          //
          // The live DOT goes with it, and the rule it served survives: state
          // never rides on colour alone, and the bar's own LIVE is the word.
          roundState(snapshot) === null || roundState(snapshot) === "live" ? undefined : (
            <RoundWord state={roundState(snapshot)} />
          )
        }
        competition
      />
      {/* **No way out at the top of the page** (Craig, 5 Sep 2026: "remove desk
          button"). The desk is still at `/matchday/desk` and the wall is still
          the thing to put on a television; what it does not get is the first
          object on the screen a manager opens at ten to four. The three
          questions this tab exists to answer are all below it, and a control
          above them pushed each one 56px further down the fold. */}
      {/* The head-to-head arrives after the football, and the boundary is what
          lets it. `YourMatchup` makes the one read on this page nothing else
          waits for — `getLiveScoringStats`, the busiest request the app makes on
          a Saturday — while the fixtures and the marks above are already
          resolved by the time this renders. Without it the whole screen, the ten
          scorelines included, waits on Fantrax's scoreboard.

          It stays first in the document because it is the question the tab is
          for: it lands into a card of its own height, so the football under it
          does not move when it does. */}
      <Suspense fallback={<MatchupWaiting />}>
        <YourMatchup />
      </Suspense>
      {/* Under the scoreline, because it is the same question asked forwards:
          the card says where you are, this says what is left to change it. */}
      <Afternoon snapshot={snapshot} players={league.afternoon} />
      {/* **No flash** (Craig, 5 Sep 2026: "live tab - remove the ticker row").
          It was a full-width plate saying the newest goal once, loudly, above a
          wire whose first row said the same goal — `cm0102/02.jpg` draws both on
          one screen, and the game's version announces an event the screen has no
          other record of. Ours had one directly underneath. */}
      <Wire lines={wire.lines} />
      {during ? (
        <>
          <Scores
            ties={ties}
            scores={scores}
            badges={badges}
            places={places}
            clubPlaces={clubPlaces}
            mine={mine}
            fixtures={today}
            clubs={clubById(snapshot)}
            now={speaksForNow(snapshot)}
            gameweek={snapshot.gameweek}
          />
        </>
      ) : (
        <BetweenGameweeks snapshot={snapshot} up={up} />
      )}
    </div>
  );
}
