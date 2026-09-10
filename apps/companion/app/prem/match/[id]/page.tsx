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
import { assistMinutes } from "@epl/core";
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

  // **Reconciled per SIDE, because a fantasy assist is only derivable there.**
  // FPL pays for the pass before an own goal and Opta credits nobody; the gap
  // closes when one man's shortfall matches his side's unexplained goals exactly.
  // `assistMinutes` refuses the moment two men could claim the same goal.
  const assists = new Map([
    ...sideAssists(goals, home),
    ...sideAssists(goals, away),
  ]);
  return (
    <Scoresheet
      home={scoresheet(home)}
      away={scoresheet(away)}
      minutes={minutes}
      assists={assists}
      owners={owners}
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

/** One side's assist minutes, from that side's goals and FPL's own counts.
 *
 *  The side is identified by the goals CREDITED to its club — which for an own
 *  goal is the beneficiary, and that is precisely the case this exists for.
 *  `PlGoal.teamId` is the Premier League's club id and `Club.code` is FPL's, so
 *  the two are matched through the sheet's own rows rather than a third table:
 *  a goal belongs to this side when its scorer is one of these men, or when it
 *  is an own goal that none of them scored. */
function sideAssists(goals: readonly PlGoal[], rows: readonly SheetRow[]): Map<number, number[]> {
  const mine = new Set(rows.map((row) => row.player.code));
  const theirs = goals.filter((goal) =>
    goal.own ? goal.scorer !== null && !mine.has(goal.scorer) : goal.scorer !== null && mine.has(goal.scorer),
  );
  const paid = new Map(
    rows.filter((row) => row.line.assists > 0).map((row) => [row.player.code, row.line.assists]),
  );
  return assistMinutes(theirs, paid);
}
