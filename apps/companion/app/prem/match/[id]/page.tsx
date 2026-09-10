import { Suspense } from "react";
import { goalMinutes, scoresheet, sheetSides } from "@epl/core";
import type { SheetRow } from "@epl/core";
import Skeleton from "../../../components/shell/Skeleton";
import { londonDayAndDate, londonTime } from "../../../londonTime";
import { PANEL } from "@/app/desk";
import MatchShell from "./Shell";
import Scoresheet from "./Scoresheet";
import Preview from "./Preview";
import { matchOwners, readMatch } from "./match";
import { matchFacts, matchGoalMinutes, matchGoals } from "../../../matchFeed";
import type { PlGoal, PlMatchFacts } from "@epl/core";
import { creditedGoals } from "@epl/core";
import type { Match } from "./match";

// One match, on Championship Manager's Match Overview.
//
// `cm0102/02.jpg` is the shape: a dated plate at the left, the competition and
// the half-time score at the right, the scorers under them with their minutes,
// and a line of match facts along the foot — referee, attendance, weather. Ours
// carries the first three; FPL publishes no attendance and no weather, and the
// referee is on 2 of the 20 matches the sister repo has logged.

export const revalidate = 30;

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  const { fixture } = match;
  // The same cached detail read `Shell` makes for the foot line — the interval
  // score rides on it.
  const facts = await matchFacts(fixture.gameweek, fixture.code);

  return (
    <MatchShell match={match} current="overview">
      <section className={PANEL}>
        {/* The date in full and the round beside it, which is `02.jpg`'s own
            head: `Saturday 8th September 2007` on a plate at the left and
            `Serie A / HT 2-0` at the right. The round takes the cyan (Craig,
            4 Sep 2026) and the slot agrees — a gameweek number is a reading we
            derived from FPL's calendar, not a fact printed on a ticket. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-1">
          {/* **Both ends of this strip take the same ink**, which is what
              `cm0102/02.jpg` does — `Sunday 19th May 2002` and `Premier
              Division / HT 1-1` are one colour at the two ends of one bar. The
              date read as `--color-ink` beside a cyan round, which made a strip
              of two facts look like a fact and a label. */}
          <span className="numeric text-xs font-bold uppercase text-info lg:text-sm">
            {fixture.kickoff === null ? "Date TBC" : londonDayAndDate(fixture.kickoff)}
          </span>
          <span className="numeric text-xs font-bold text-info lg:text-sm">
            {state(match, facts)}
          </span>
        </div>

        {fixture.status === "upcoming" ? (
          <Preview match={match} />
        ) : (
          <Suspense fallback={<SheetWaiting />}>
            <Sheet match={match} />
          </Suspense>
        )}

      </section>

    </MatchShell>
  );
}

/** The scoresheet, with the minutes and our league's names on it.
 *
 *  **The minutes come from the Premier League now** (Craig, 5 Sep 2026: "live
 *  match, we can add the minutes too this now"), merged over the sister repo's
 *  match log rather than replacing it. The log has 20 of 380 matches in it, so
 *  nearly every scorer on this screen had a name and no clock; their round read
 *  carries a minute for every goal in all ten matches, for one request, and it
 *  is already cached for the Live tab's wire. */
async function Sheet({ match }: { match: Match }) {
  const [owners, minutes, goals] = await Promise.all([
    matchOwners(match.fixture),
    matchGoalMinutes(
      match.fixture.gameweek,
      match.fixture.code,
      match.snapshot.players,
      goalMinutes(match.logged),
    ),
    // **The goals, with the side credited and Opta's assister**, off the same
    // cached detail read the team sheet makes (Craig, 10 Sep 2026: *"can we get
    // the assists timers too?"*). An assist happens when the ball goes in, so
    // its minute is the goal's own clock.
    matchGoals(match.fixture.gameweek, match.fixture.code, match.snapshot.players),
  ]);
  const { home, away } = sides(match);
  const ours = side(goals, home, minutes);
  const theirs = side(goals, away, minutes);

  return (
    <Scoresheet
      home={ours.goals}
      away={theirs.goals}
      homeElse={ours.rest}
      awayElse={theirs.rest}
      owners={owners}
      byCode={match.byCode}
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
  return match.sheet === null
    ? { home: [], away: [] }
    : sheetSides(match.sheet, match.snapshot);
}

/** The round, the tense, and the half-time score when we have one.
 *
 *  Four rungs and not two. `settled` is FPL's own sign-off that the bonus has
 *  been added and stopped moving — a one-to-two-hour window after the whistle in
 *  which the figures below are still provisional, and nothing may print a flat
 *  `FT` over numbers about to change. */
function state(match: Match, facts: PlMatchFacts | null): string {
  const { fixture, live, finished } = match;
  const round = fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
  // **The interval score off the Premier League's own detail read**, 30/30 on
  // completed fixtures. It came from the sister repo's match log, which has 20 of
  // 380 — so nine of every ten matches showed no half time at all.
  // `cm0102/02.jpg` prints `HT 1-1` on this line, which is where it belongs.
  const half = facts?.halfTime == null ? null : `HT ${facts.halfTime.home}–${facts.halfTime.away}`;
  const parts = [round];
  if (live) parts.push(`Live ${fixture.minutes}′`);
  else if (finished) parts.push(fixture.settled ? "FT" : "FT · bonus provisional");
  else if (fixture.kickoff !== null) parts.push(londonTime(fixture.kickoff));
  else parts.push("Kick-off TBC");
  if (half !== null) parts.push(half);
  return parts.join(" · ");
}

/** One side's goals, credited, and whatever else the sheet names its men for.
 *
 *  **Which goals are this side's is decided by the men, not by a club id.**
 *  `PlGoal.teamId` is the Premier League's and `Club.code` is FPL's, so rather
 *  than carry a third table the test is: a goal is ours when its scorer is one
 *  of our men, and an OWN goal is ours when its scorer is not — which is the
 *  same fact `PlGoal` documents from the other end, since the feed credits an
 *  own goal to the side that benefited.
 *
 *  **`rest` is what a goal list would otherwise drop.** A sending off and a
 *  penalty missed are scoresheet entries; a booking is not, and `named` stopped
 *  letting one on this sheet on 10 Sep 2026.
 *
 *  Falls back to FPL's own scorers when the Premier League has no goals for the
 *  fixture — their feed answers nothing for a match it has not filed, and the
 *  sheet is still true. */
function side(
  goals: readonly PlGoal[],
  rows: readonly SheetRow[],
  minutes: Map<number, number[]>,
): { goals: PlGoal[]; rest: SheetRow[] } {
  const mine = new Set(rows.map((row) => row.player.code));
  const ours = goals.filter((goal) =>
    goal.scorer === null ? false : goal.own ? !mine.has(goal.scorer) : mine.has(goal.scorer),
  );
  const paid = new Map(
    rows.filter((row) => row.line.assists > 0).map((row) => [row.player.code, row.line.assists]),
  );
  const credited = ours.length > 0 ? creditedGoals(ours, paid) : fallbackGoals(rows, minutes);

  // Everyone the sheet names who is not already on a goal line.
  const named = new Set(
    credited.flatMap((goal) => [goal.scorer, goal.assister].filter((code) => code !== null)),
  );
  const rest = scoresheet(rows).filter(
    (row) => !named.has(row.player.code) && marksAnything(row),
  );
  return { goals: credited, rest };
}

/** FPL's own scorers as goals, for a fixture the Premier League has not filed.
 *
 *  Their minutes come from `matchGoalMinutes`, which merges the sister repo's
 *  log; a scorer with neither reads as minute 0 and is dropped rather than drawn
 *  at the kick-off. */
function fallbackGoals(rows: readonly SheetRow[], minutes: Map<number, number[]>): PlGoal[] {
  return rows
    .flatMap((row) =>
      (minutes.get(row.player.code) ?? []).map((minute) => ({
        minute,
        teamId: 0,
        scorer: row.player.code,
        assister: null,
        own: row.line.ownGoals > 0 && row.line.goals === 0,
      })),
    )
    .sort((a, b) => a.minute - b.minute);
}

/** Whether a man belongs on the sheet for something other than a goal. */
function marksAnything(row: SheetRow): boolean {
  return row.line.redCards > 0 || row.line.penaltiesMissed > 0 || row.line.penaltiesSaved > 0;
}
