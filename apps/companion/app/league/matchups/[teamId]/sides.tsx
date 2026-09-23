import Link from "next/link";
import type {
  Club,
  LeagueTeam,
  LineupDetail,
  Opposition,
  RosterDisplay,
  RosteredTeam,
  SquadDetailLine,
} from "@epl/core";
import { lineupDetail, squadDetail, squadUnarranged } from "@epl/core";
import { widestLine } from "../../../components/league/PitchRows";
import Caption from "../../../components/shell/Caption";
import Nothing from "../../../components/shell/Nothing";
import SquadRows from "../../../components/league/SquadRows";
import { teamHref } from "@/app/squad/routes";

// What the head-to-head route assembles before it draws anything.
//
// Split out of `page.tsx` when the Stats and Football tabs took it past
// CODE_RULES §4's hard 300-line ceiling. The seam is the one `squad/[teamId]/
// team.ts` already sets: the route file stays about what appears on screen, and
// the joins that feed it live beside it.
//
// **The four SHARED boards moved on to `tabs.tsx` on 12 Sep 2026**, when there
// were four of them and this file was back at the ceiling. What is left here is
// the two things that are genuinely per-side: why a side is not on screen, and
// the two squad lists a round nobody has kicked off is reduced to.

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
      ? `${team.name}'s eleven is not public until gameweek ${display.period}'s lineups lock.`
      : `${team.name}'s eleven is not showing.`;

  return (
    <div className="flex flex-col items-center gap-3 border border-line bg-surface px-4 py-10 text-center">
      <p className="max-w-xs text-sm text-muted">{because}</p>
      <Link
        href={teamHref(team.teamId)}
        className="flex min-h-11 items-center text-2xs font-bold uppercase text-accent"
      >
        See the squad
      </Link>
    </div>
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

/** What both sides look like as arrangements, and the card width they agree on.
 *
 *  Lifted out of `page.tsx` on 12 Sep 2026 when the route file went past §4's
 *  hard ceiling for the second time. It is exactly what this file is for: the
 *  joins that feed the screen, beside the screen.
 */
export function arrangeBoth({
  pairing,
  rostered,
  shows,
  scored,
  clubs,
  opposition,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  scored: Map<string, { points: Map<string, number | null> } | null>;
  clubs: Map<number, Club>;
  opposition: Map<number, Opposition[]>;
}): { arranged: Map<string, LineupDetail>; widest: number } {
  // Both elevens are arranged before either is drawn, because they have to agree
  // about the card. `PitchRows` sizes every man from the fullest line it is
  // given, and the two sides of a head-to-head are one view toggled in place —
  // so a 3-4-3 against a 3-5-2 redrew every player on the page at a different
  // size the moment the reader tapped the other half. Taken across both sides,
  // and across each bench, the pitch holds still.
  //
  // Only sides whose eleven is actually going on screen count: a withheld one
  // draws no cards, and letting its shape decide the width would be a rival's
  // formation leaking out through the layout.
  const arranged = new Map(
    [pairing.team, pairing.opponent].flatMap((team) => {
      const roster = rostered.get(team.teamId);
      if (roster === undefined || !shows(team)) return [];
      const points = scored.get(team.teamId)?.points ?? null;
      return [[team.teamId, lineupDetail(roster, clubs, opposition, points)] as const];
    }),
  );
  const widest = Math.max(
    1,
    ...[...arranged.values()].map((sheet) => widestLine([...sheet.rows, { players: sheet.bench }])),
  );
  return { arranged, widest };
}

/** The fifteen, unarranged, for a round that has not been played. */
export function unplayedLists({
  pairing,
  rostered,
  clubs,
  opposition,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  clubs: Map<number, Club>;
  opposition: Map<number, Opposition[]>;
}): Map<string, SquadDetailLine[]> {
  // The fifteen, unarranged, for a round that has not been played. The
  // arrangement is exactly what the gate withholds before lineups lock, and
  // `squadUnarranged` is the shape that cannot leak it — alphabetical within
  // position, so even the payload order says nothing about who starts. Built
  // only when it is going to be drawn.
  const listed = new Map(
        [pairing.team, pairing.opponent].flatMap((team) => {
          const roster = rostered.get(team.teamId);
          if (roster === undefined) return [];
          return [
            [
              team.teamId,
              squadDetail(squadUnarranged(roster), clubs, opposition, null),
            ] as const,
          ];
    }),
  );
  return listed;
}
