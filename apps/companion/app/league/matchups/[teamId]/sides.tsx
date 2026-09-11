import Link from "next/link";
import type {
  CategoryPair,
  FootballSnapshot,
  LeagueTeam,
  RosteredTeam,
  RosterDisplay,
  SquadDetailLine,
} from "@epl/core";
import { isResolved, owners } from "@epl/core";
import Caption from "../../../components/shell/Caption";
import Nothing from "../../../components/shell/Nothing";
import SquadRows from "../../../components/league/SquadRows";
import Wire from "../../../matchday/Wire";
import { roundBreaks, roundGoals } from "../../../commentary";
import { isBreak, wireLines } from "../../../matchday/wireLines";
import CategoryCompare from "../../../components/league/CategoryCompare";
import Section from "../../../components/shell/Section";

// What the head-to-head route assembles before it draws anything.
//
// Split out of `page.tsx` when the Stats and Football tabs took it past
// CODE_RULES §4's hard 300-line ceiling. The seam is the one `squad/[teamId]/
// team.ts` already sets: the route file stays about what appears on screen, and
// the joins that feed it live beside it.

/** Why a side is not on screen.
 *
 *  Three ways to arrive here and they are not one thing to a reader: Fantrax
 *  sent no roster, a rival's period has not opened, or the gate fell back on a
 *  safety because we could not read the calendar. The last is ours failing and
 *  has the least to say here — the squad page is where it is spelled out. */
export function Withheld({
  team,
  known,
  because: display,
}: {
  team: LeagueTeam;
  /** Whether Fantrax gave us a roster for him at all. */
  known: boolean;
  because: RosterDisplay;
}) {
  // The period comes off the DECISION, never off the round in view. Between
  // rounds those are different numbers — Fantrax rolls its label the moment a
  // round's last fixture ends, so for four days in seven this page is drawn
  // about gameweek N while the arrangement it holds is period N+1's. Handed the
  // round's number, this sentence explained a withholding by naming a deadline
  // that had already passed, which is the one thing a reason may not do.
  const because = !known
    ? `Fantrax sent no roster for ${team.name}.`
    : display.show === "squad" && display.because === "not-locked"
      ? `${team.name}'s eleven is not public until period ${display.period}'s lineups lock.`
      : `${team.name}'s eleven is not showing.`;

  return (
    <div className="flex flex-col items-center gap-3 border border-line bg-surface px-4 py-10 text-center">
      <p className="max-w-xs text-sm text-muted">{because}</p>
      <Link
        href={`/squad/${team.teamId}`}
        className="flex min-h-11 items-center text-2xs font-bold uppercase text-accent"
      >
        See the squad
      </Link>
    </div>
  );
}

/** The Stats tab's shared half: where the scoreline came from.
 *
 *  **Provenance here rather than across the top of the screen** (Craig, 11 Sep
 *  2026: *"remove A round already played… row"*). It was 44px of prose over a
 *  scoreline nobody was asking it of. The claim is still owed — these are
 *  Fantrax's figures, and on a round already played the elevens may be the
 *  arrangement it stored or may be today's squads — so it is said where a reader
 *  is actually asking where a number came from, in the slot `Section` already
 *  has for exactly that.
 *
 *  The scores are deliberately not called final either way: `played` is true at
 *  all three finished rungs and only `data_checked` earns that word. */
export function CompareTab({
  rows,
  mine,
  theirs,
  played,
  fielded,
}: {
  rows: readonly CategoryPair[];
  mine: string;
  theirs: string;
  played: boolean;
  /** Whether the roster on hand is the round's own, or today's standing in. Two
   *  different claims, so two sentences and not one hedged one. */
  fielded: boolean;
}) {
  return (
    <Section
      // Short enough to sit on one line beside its aside at 390. It wrapped to
      // two under "Where the points came from", which put three lines of chrome
      // over a six-row board.
      title="By category"
      aside={
        !played
          ? "Fantrax's own"
          : fielded
            ? "Fantrax's own · the stored eleven"
            : "Fantrax's own · today's squads"
      }
    >
      <CategoryCompare rows={rows} mine={mine} theirs={theirs} />
    </Section>
  );
}

/** The Report tab: the afternoon, filtered to the thirty men in this tie.
 *
 *  Craig, 11 Sep 2026: *"do we have a match report blog thing which filters only
 *  by starting players for both teams, like we have in prem?"*
 *
 *  **The event feed, and not the prose.** `prem/match/[id]/report` prints Opta's
 *  minute-stamped commentary, and `PlCommentaryLine` carries `type`, `minute` and
 *  `text` and **no player id at all** — so filtering that to two squads could only
 *  be done by matching names inside sentences, which is the one thing identity
 *  work in this repo never does. `MatchEvent.players` carries FPL's season-stable
 *  `code`, so this filter is a join.
 *
 *  **The filter IS the owners map**, which is the neat part: `wireLines` places an
 *  owner on a man from whatever map it is handed, so handing it the two teams in
 *  this tie rather than the whole league leaves every other manager's goal with a
 *  null owner — and a row with no owner on either man is a row this tie has no
 *  stake in. No second predicate, and nothing that can disagree with the map.
 *
 *  **One request, already warm.** `roundGoals` and `roundBreaks` both read
 *  `plRound(gameweek)`, which the Live tab's own wire has already cached. Cards
 *  are deliberately absent: they live on the per-fixture read and would cost up
 *  to ten more requests for a handful of rows. */
export async function ReportTab({
  snapshot,
  teams,
  mine,
}: {
  snapshot: FootballSnapshot;
  /** The two squads in this tie, and only those two. */
  teams: readonly RosteredTeam[];
  mine: string | null;
}) {
  // **Behind a Suspense boundary at the call site**, because it is the one read
  // on this page that is not already warm for THIS reader: the round is cached,
  // but a reader who never opened the Live tab this window pays for it, and the
  // grass must not wait on an afternoon's commentary to be drawn.
  //
  // Empty rather than a throw: a wire is something this screen ADDS to a tie it
  // can already draw.
  const [goals, breaks] = await Promise.all([
    roundGoals(snapshot.gameweek, snapshot.players).catch(() => []),
    roundBreaks(snapshot.gameweek),
  ]);

  // Which fixtures the tie is actually being played in, so full time is reported
  // for the matches that decide it rather than for all ten. Filtered before
  // `wireLines` rather than after, because a `WireBreak` has already spent its
  // fixture code on a render key and getting it back would mean parsing one.
  const clubs = new Set<number>();
  for (const team of teams) {
    for (const rostered of team.players) {
      if (isResolved(rostered)) clubs.add(rostered.player.clubId);
    }
  }
  const ours = new Set(
    snapshot.fixtures
      .filter((fixture) => clubs.has(fixture.homeClubId) || clubs.has(fixture.awayClubId))
      .map((fixture) => fixture.code),
  );

  const wire = wireLines(
    goals,
    breaks.filter((brk) => ours.has(brk.fixtureCode)),
    snapshot,
    owners(teams),
    mine,
  );

  // A goal in a match neither manager has a man in reaches here with a null owner
  // on both slots, which is exactly "this tie has no stake in it".
  const lines = wire.lines.filter(
    (row) => isBreak(row) || row.man?.owner != null || row.second?.owner != null,
  );

  return lines.length === 0 ? (
    <Section title="This tie's afternoon">
      <Nothing title="Nothing yet">
        No goal in this round has involved a man in either squad.
      </Nothing>
    </Section>
  ) : (
    <Wire lines={lines} title="This tie's afternoon" />
  );
}

/** A tie before a ball is kicked: the two squads, and nothing else.
 *
 *  Craig, 11 Sep 2026: *"for a match that has not been played, just show the two
 *  squad lists, thats it"*.
 *
 *  **The whole board comes off, not just its content.** Every one of the four
 *  tabs is furniture before the football — the scoreline is 0–0, Scores is a
 *  withheld panel because the lineups have not locked, and Stats, Players and
 *  Report are boards of dashes. A strip whose every plate leads to an empty box
 *  is four controls saying the same nothing.
 *
 *  **And the scoreline goes with them**, which is the part "thats it" is doing
 *  the work in. Two dashes on two colour plates is a scoreline that has nothing
 *  to report, and the captions already name the two managers — so the one object
 *  it was carrying is carried better by the thing underneath it.
 *
 *  **Both sides at once at every width.** The halves of the played board are how
 *  you change sides on a phone, because thirty players at 390 is fifteen
 *  unreadable ones on a pitch — but two lists stack, and comparing two squads is
 *  the whole reason to be here on a Tuesday. `SquadRows` truncates a name and
 *  keeps its four columns at that width.
 *
 *  **Unarranged, and that is the gate rather than a shortcut.** `squadUnarranged`
 *  sorts alphabetically within position so that even the payload order cannot
 *  leak who starts — which is exactly the state a rival's squad is in before his
 *  lineups lock, and this screen is only ever drawn before then. */
export function SquadLists({
  team,
  opponent,
  lists,
}: {
  team: LeagueTeam;
  opponent: LeagueTeam;
  /** Each side's fifteen, by team id. A side Fantrax sent no roster for is absent
   *  and says so rather than drawing an empty table. */
  lists: Map<string, SquadDetailLine[]>;
}) {
  const half = (side: LeagueTeam) => {
    const lines = lists.get(side.teamId);
    return (
      <section key={side.teamId} className="flex min-w-0 flex-1 flex-col gap-1">
        <Caption>{side.name}</Caption>
        {lines === undefined ? (
          <Nothing title="No roster" code={side.teamId}>
            Fantrax sent no roster for {side.name}.
          </Nothing>
        ) : (
          // `projected={false}`, and the column does not appear at all: nothing
          // has scored in a round with no football in it, and `SquadRows` draws
          // the figure only where something did.
          <SquadRows lines={lines} projected={false} />
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
      {half(team)}
      {half(opponent)}
    </div>
  );
}
