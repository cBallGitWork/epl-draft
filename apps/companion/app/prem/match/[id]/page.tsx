import { Suspense } from "react";
import { goalMinutes, scoresheet, sheetSides } from "@epl/core";
import type { SheetRow } from "@epl/core";
import Skeleton from "../../../components/shell/Skeleton";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import { londonDayAndDate, londonTime } from "../../../londonTime";
import { PANEL, PANEL_FLUSH } from "@/app/desk";
import MatchShell from "./Shell";
import Scoresheet from "./Scoresheet";
import Preview from "./Preview";
import Line from "./Commentary";
import { matchOwners, readMatch } from "./match";
import {
  matchFacts,
  matchGoalMinutes,
  matchGoals,
  matchPlayerNames,
  matchReport,
  matchStreamCredits,
} from "../../../matchFeed";
import type { PlGoal, PlMatchFacts, StreamCredit } from "@epl/core";
import { creditedGoals, streamCredited, worthReading } from "@epl/core";
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
          {/* **A step and a half up since 11 Sep 2026** (Craig: *"stadium name,
              data, and gameweek, referee row all way to small"*). `02.jpg` sets
              its own dated strip at about 1.4% of an 800px canvas — 20px on a
              1440 desk, where ours was 14. The foot line moved with it and the
              two are still set alike, which is the rule this strip has been
              under since it took the same ink. */}
          <span className="numeric text-sm font-bold uppercase text-info lg:text-xl">
            {fixture.kickoff === null ? "Date TBC" : londonDayAndDate(fixture.kickoff)}
          </span>
          <span className="numeric text-sm font-bold text-info lg:text-xl">
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

      {/* **The match report, under the goals** (Craig, 11 Sep 2026: *"so we
          could leave a bit of space under the goals, and have the match report
          underneath?"*). The overview was the scorers and then a screenful of
          empty ground — the panel is sized to hold a scoresheet and a 2-0 fills
          a fifth of it — so what was under the goals was the photograph.

          **Its own panel, not more of the one above** (DESIGN §2: a title row is
          its own box and the thing it heads is another). The scoresheet answers
          "what was the score"; this answers "what happened", and they are two
          statements rather than one long one.

          Behind its own boundary because it is the one read on this page that
          the scoresheet has not already warmed: the stream is a second request
          per fixture, and the scorers must not wait on it. */}
      {/* **Two rows of air under the goals** (Craig, 11 Sep 2026: *"allow a
          little room between match report and the goalscorders, (maybe 2 rows
          or so) as breathing room"*). The shell spaces its children by `gap-2`,
          which is right between panels that are two halves of one statement and
          too tight here: the scoresheet ENDS, and the reader should feel it end
          before the account of how starts. Stated in rows because that is the
          unit the thing below is made of. */}
      {fixture.status === "upcoming" ? null : (
        <div className="mt-6 lg:mt-8">
          <Suspense fallback={<ReportWaiting />}>
            <Commentary match={match} />
          </Suspense>
        </div>
      )}

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
  const [owners, minutes, goals, credits] = await Promise.all([
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
    // **What the commentary says about the three assists Opta does not place** —
    // a penalty won, an own goal forced, a rebound off a blocked shot. A
    // proposal that `side` below only uses if FPL's own counts confirm it.
    matchStreamCredits(match.fixture.gameweek, match.fixture.code, match.snapshot.players),
  ]);
  const { home, away } = sides(match);
  const ours = side(goals, home, away, minutes, credits);
  const theirs = side(goals, away, home, minutes, credits);

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

/** What happened, in Opta's own sentences, with the fouls taken out.
 *
 *  **Capped and scrolling rather than ninety rows long.** `Wire` settled the
 *  shape for the same problem — a list cut short with no bar looks like a short
 *  list, so the box is the length and `.cm-scroll-y` says there is more. The
 *  Match Report tab is where the feed runs full height; this is the overview's
 *  share of it.
 *
 *  `worthReading` is 42.9% of the rows on the counts in `map.ts`, which is what
 *  makes this fit under a scoresheet at all. */
async function Commentary({ match }: { match: Match }) {
  const { gameweek, code } = match.fixture;
  const [whole, names] = await Promise.all([
    matchReport(gameweek, code),
    // The same men the Report tab marks, so a name is white on both screens.
    matchPlayerNames(gameweek, code),
  ]);
  const lines = worthReading(whole);
  if (lines.length === 0) return null;

  return (
    // **A share of the SCREEN, not a stated 384 pixels** (Craig, 11 Sep 2026:
    // *"make the space for the match report more dynamic, we can use more space
    // i think"*). `max-h-96` was the same box on a 667px phone and a 1440 desk —
    // most of the first and a quarter of the second. `dvh` spends what the
    // device actually has, and the scoresheet above it is four or five rows on
    // every match ever played, so there is no case where this crowds it.
    <section
      className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y max-h-[60dvh] overflow-y-auto lg:max-h-[70dvh]`}
    >
      {lines.map((line) => (
        <Line key={line.id} line={line} names={names} />
      ))}
    </section>
  );
}

function ReportWaiting() {
  return (
    <div aria-busy>
      <SkeletonRows count={6} height="2.75rem" />
    </div>
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
 *  of our men, and an OWN goal is ours when its scorer is one of THEIRS.
 *
 *  **That second half used to read "when its scorer is not ours", and it put one
 *  own goal on both scoresheets.** A man the bridge cannot place is in neither
 *  side's rows, so "not ours" was true for both sides at once and Brighton 4-0
 *  Aston Villa printed Lindelöf's own goal twice — a sheet claiming five goals
 *  in a four-goal match. Naming the opponent's men makes the test exclusive:
 *  exactly one side can satisfy it, and a scorer neither side knows now appears
 *  on neither rather than on both. Losing a goal we cannot place is the lesser
 *  error, and it is the one DESIGN §7 asks for.
 *
 *  **`rest` is what a goal list would otherwise drop.** A sending off and a
 *  penalty missed are scoresheet entries; a booking is not, and `named` stopped
 *  letting one on this sheet on 10 Sep 2026.
 *
 *  Falls back to FPL's own scorers when the Premier League has no goals for the
 *  FIXTURE — their feed answers nothing for a match it has not filed, and the
 *  sheet is still true. Asked of the whole feed rather than of this side: a
 *  goalless side is not an unfiled match, and treating it as one is what put an
 *  own goal on two scoresheets. */
function side(
  goals: readonly PlGoal[],
  rows: readonly SheetRow[],
  opponents: readonly SheetRow[],
  minutes: Map<number, number[]>,
  credits: readonly StreamCredit[],
): { goals: PlGoal[]; rest: SheetRow[] } {
  const mine = new Set(rows.map((row) => row.player.code));
  const theirs = new Set(opponents.map((row) => row.player.code));
  const ours = goals.filter((goal) =>
    goal.scorer === null
      ? false
      : goal.own
        ? !mine.has(goal.scorer) && theirs.has(goal.scorer)
        : mine.has(goal.scorer),
  );
  const paid = new Map(
    rows.filter((row) => row.line.assists > 0).map((row) => [row.player.code, row.line.assists]),
  );
  // **The commentary first, and only if FPL's arithmetic confirms the lot.**
  // `creditedGoals` resolves exactly one case — one man short by exactly the
  // side's unexplained goals — and Man Utd 5-2 Ipswich is the shape it cannot
  // touch: three men each short by one against three unexplained goals, so it
  // credited nobody and the screen dropped three real assists. `streamCredited`
  // proposes all three off the textstream and returns null unless every name
  // agrees with FPL, which is when `creditedGoals` gets its go as before.
  // **The fallback is asked of the FEED, not of this side.** It was
  // `ours.length > 0`, which is a per-side test driving a per-match decision: a
  // side that simply did not score fell through to FPL's own scorers, and
  // Brighton 4-0 Aston Villa then printed Lindelöf's own goal on BOTH sheets —
  // once where the Premier League credited it, and once more because Villa's
  // empty column reached for FPL's list and found their own man's `own_goals`.
  // The question the fallback answers is "has the Premier League filed this
  // match at all", and `goals` is the whole match.
  const credited =
    goals.length > 0
      ? (streamCredited(ours, credits, paid) ?? creditedGoals(ours, paid))
      : fallbackGoals(rows, minutes);

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
