import { Suspense } from "react";
import { goalMinutes, sheetSides, londonDayAndDate, londonTime } from "@epl/core";
import type { PlMatchFacts, SheetRow } from "@epl/core";
import Skeleton from "../../../components/shell/Skeleton";
import { PANEL } from "@/app/desk";
import MatchShell from "./Shell";
import Scoresheet from "./Scoresheet";
import Preview from "./Preview";
import MatchReport from "./MatchReport";
import { matchOwners, readMatch } from "./match";
import { matchCards, namedOn } from "./matchCards";
import { side } from "./scoreLines";
import type { Match } from "./match";
import { leagueOpinions } from "../../leagueOpinions";
import { roundAssistKinds } from "../../../assistKinds";
import { matchGoalMinutes } from "../../../matchFeed";
import { matchFacts, matchGoals, matchInjuries, matchManEvents, matchStreamCredits, teamSheets } from "../../../matchDetail";

// One match on CM's Match Overview (`cm0102/02.jpg`): a dated strip, who scored and when, then the report.

export const revalidate = 30;

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  const { fixture } = match;
  // The detail read the shell's ground caption makes too; the half-time score rides on it.
  const facts = await matchFacts(fixture.gameweek, fixture.code);

  return (
    <MatchShell match={match} current="overview">
      {/* Padding rather than a height, so the last scorer breathes the same on a 0-0 and a 5-2. */}
      <section className={`${PANEL} pb-6 lg:pb-8`}>
        {/* `02.jpg`'s dated head: the date at the left, the round and the tense at the right, both in cyan. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-1">
          <span className="numeric text-sm font-bold uppercase text-info lg:text-xl">
            {fixture.kickoff === null ? "Date TBC" : londonDayAndDate(fixture.kickoff)}
          </span>
          <span className="numeric text-sm font-bold text-info lg:text-xl">{state(match, facts)}</span>
        </div>

        {fixture.status === "upcoming" ? (
          <Preview match={match} />
        ) : (
          <Suspense fallback={<SheetWaiting />}>
            <Sheet match={match} />
          </Suspense>
        )}
      </section>

      {/* Two rows of air, then the report: the scoresheet ends before the account of how starts. */}
      {fixture.status === "upcoming" ? null : (
        <div className="mt-6 lg:mt-8">
          <MatchReport match={match} />
        </div>
      )}
    </MatchShell>
  );
}

/** The scoresheet: the Premier League's minutes and assisters over the sister repo's log, and each name's card. */
async function Sheet({ match }: { match: Match }) {
  const { gameweek, code } = match.fixture;
  const players = match.snapshot.players;
  const [owners, minutes, goals, credits, did, injured, sheets, league, kinds] = await Promise.all([
    matchOwners(match.fixture),
    matchGoalMinutes(gameweek, code, players, goalMinutes(match.logged)),
    matchGoals(gameweek, code, players),
    // The commentary's word on the assists Opta does not place; `side` uses it only where FPL's counts agree.
    matchStreamCredits(gameweek, code, players),
    // The minute of a sending off, which FPL's line does not carry.
    matchManEvents(gameweek, code, players),
    matchInjuries(gameweek, code, players),
    teamSheets(gameweek, code, players),
    // Each named man's Fantrax id, for his card.
    leagueOpinions(),
    roundAssistKinds(gameweek),
  ]);
  const { home, away } = sides(match);
  const ours = side(goals, home, away, minutes, credits, kinds, injured);
  const theirs = side(goals, away, home, minutes, credits, kinds, injured);

  return (
    <Scoresheet
      home={ours.goals}
      away={theirs.goals}
      homeElse={ours.rest}
      awayElse={theirs.rest}
      owners={owners}
      byCode={match.byCode}
      did={did}
      injured={injured}
      cards={sheets === null ? new Map() : matchCards(match, namedOn(sheets), league)}
    />
  );
}

function SheetWaiting() {
  return (
    <div aria-busy className="grid grid-cols-2 gap-2 py-1">
      {Array.from({ length: 6 }, (_, at) => (
        <Skeleton key={at} width="80%" height="0.875rem" />
      ))}
    </div>
  );
}

/** Both team sheets, or two empty ones for a match FPL has filed nothing for. */
function sides(match: Match): { home: SheetRow[]; away: SheetRow[] } {
  return match.sheet === null ? { home: [], away: [] } : sheetSides(match.sheet, match.snapshot);
}

/** The round, the tense and the half-time score. */
function state(match: Match, facts: PlMatchFacts | null): string {
  const { fixture, live, finished } = match;
  const round = fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
  const half = facts?.halfTime == null ? null : `HT ${facts.halfTime.home}–${facts.halfTime.away}`;
  const parts = [round];
  if (live) parts.push(`Live ${fixture.minutes}′`);
  else if (finished) parts.push("FT");
  else if (fixture.kickoff !== null) parts.push(londonTime(fixture.kickoff));
  else parts.push("Kick-off TBC");
  if (half !== null) parts.push(half);
  return parts.join(" · ");
}
