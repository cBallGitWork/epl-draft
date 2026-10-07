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
import BackPlate from "../../../components/shell/BackPlate";
import Caption from "../../../components/shell/Caption";
import Nothing from "../../../components/shell/Nothing";
import SquadRows from "../../../components/league/SquadRows";
import { teamHref } from "@/app/squad/routes";
import { MATCHUPS } from "../../routes";
import { SMALL_CAPS } from "@/app/desk";

// The head-to-head's per-side pieces: why a side is withheld, both sides' arrangements, and the two squad lists a
// round not yet kicked off is reduced to. The shared boards are `tabs.tsx`'s.

/** Why a side is not on screen: no roster from Fantrax, a lineup not yet locked, or our calendar failing. */
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
  // The period comes off the decision, never the round in view: between rounds they differ, and a reason may not
  // name a deadline that has passed.
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
        className={`flex min-h-11 items-center ${SMALL_CAPS} text-accent`}
      >
        See the squad
      </Link>
    </div>
  );
}

/** A tie before a ball is kicked: the two squads and nothing else, scoreline included (Craig, 11 Sep 2026: *"just show
 *  the two squad lists, thats it"*). Both at every width, unarranged, so not even the order leaks who starts. */
export function SquadLists({
  team,
  opponent,
  lists,
}: {
  team: LeagueTeam;
  opponent: LeagueTeam;
  /** Each side's fifteen, by team id; a side with no roster is absent and says so. */
  lists: Map<string, SquadDetailLine[]>;
}) {
  // The top of the page on a phone, so the first side's caption carries the way back.
  const half = (side: LeagueTeam, top: boolean) => {
    const lines = lists.get(side.teamId);
    const caption = <Caption>{side.name}</Caption>;
    return (
      <section key={side.teamId} className="flex min-w-0 flex-1 flex-col gap-1">
        {top ? (
          <div className="flex min-h-11 items-stretch lg:min-h-0">
            <BackPlate fallback={MATCHUPS} />
            <div className="grid min-w-0 flex-1">{caption}</div>
          </div>
        ) : (
          caption
        )}
        {lines === undefined ? (
          <Nothing title="No roster" code={side.teamId}>
            Fantrax sent no roster for {side.name}.
          </Nothing>
        ) : (
          // No figure column: nothing has scored in a round with no football.
          <SquadRows lines={lines} projected={false} />
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
      {half(team, true)}
      {half(opponent, false)}
    </div>
  );
}

/** Both sides as arrangements, and the card width they agree on. */
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
  // Both arranged before either is drawn, so the pitch keeps one card size as the reader flips sides; a withheld side
  // does not count, or its formation would leak through the layout.
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
  return new Map(
    [pairing.team, pairing.opponent].flatMap((team) => {
      const roster = rostered.get(team.teamId);
      if (roster === undefined) return [];
      return [[team.teamId, squadDetail(squadUnarranged(roster), clubs, opposition, null)] as const];
    }),
  );
}
