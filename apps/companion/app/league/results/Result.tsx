import Link from "next/link";
import { leads, type PeriodPairing, type LeagueTeam } from "@epl/core";
import TeamBadge from "../../components/league/TeamBadge";
import { yoursBorder, yoursInk } from "../../mine";
import { LABEL } from "@/app/desk";

// One finished head-to-head, as a scoreline.
//
// The board's grammar and not a second one: name, score, v, score, name, on one
// row (Craig, 19 Aug) — the same shape `PairingCard` and `Tie` print, because a
// reader who has learnt to read a scoreline on the matchups board should not
// have to learn a different one two tabs along. It is a separate component from
// both all the same: `PairingCard` takes `LiveTeamScore` and pending clean
// sheets, which are live-round shapes with no meaning on a settled result, and
// `Tie` takes a `CompetitionTie` because it also draws cup ties.
//
// **Each side is its own row-height link, which is `PairingCard`'s structure and
// not a coincidence.** The first cut made the whole pairing one `.cm-row` with
// two ordinary links inside it, and `tapfit` failed the page at both widths:
// four targets 20px tall in a 44px row. `self-stretch` fixed the pixels and not
// the finding — the link still was not a row, so it was measured against the
// 36px CONTROL floor, which is right. A tappable line in a list carries
// `.cm-row` itself. `PairingCard` and `TableRow` both already did this; this
// file is the third and the pattern is now worth reading off them rather than
// rediscovering.
//
// **The winner is the only thing bolder than the rest.** A finished result has
// one fact worth the emphasis and it is who won; both totals print in full
// because the margin is the other half of the story. Marking a winner at all is
// only safe because the page hands this FINISHED rounds — see `gameweekStatus`
// in core.

export default function Result({
  pairing,
  points,
  badges,
  mine,
  gameweek,
}: {
  pairing: PeriodPairing;
  /** The round this result belongs to, so a side opens the head-to-head ON ITS
   *  OWN WEEK rather than on whatever Fantrax is pointing at today. Without it
   *  a September result opened December's tie. */
  gameweek: number;
  /** Each side's settled total for the period, by team id. */
  points: Map<string, number | null>;
  badges: Map<string, string>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
}) {
  const home = points.get(pairing.home.teamId) ?? null;
  const away = points.get(pairing.away.teamId) ?? null;
  const yours = pairing.home.teamId === mine || pairing.away.teamId === mine;

  return (
    <div className={`flex items-stretch ${yoursBorder(yours)}`}>
      <Side
        team={pairing.home}
        total={home}
        beat={leads(home, away)}
        badge={badges.get(pairing.home.teamId)}
        mine={mine}
        gameweek={gameweek}
      />
      <span className={`self-center px-1 ${LABEL}`}>v</span>
      <Side
        team={pairing.away}
        total={away}
        beat={leads(away, home)}
        badge={badges.get(pairing.away.teamId)}
        mine={mine}
        gameweek={gameweek}
        away
      />
    </div>
  );
}

/** Absence, never a nought. A period Fantrax has not scored was not drawn 0-0,
 *  and `PeriodResult.points` is null exactly when it could not be read. */
const DASH = "—";

function Side({
  team,
  total,
  beat,
  badge,
  mine,
  gameweek,
  away = false,
}: {
  team: LeagueTeam;
  total: number | null;
  beat: boolean;
  badge: string | undefined;
  mine: string | null;
  gameweek: number;
  /** The away side reads inward: its total against the middle and its badge on
   *  the outside, so the two numbers meet either side of the `v` and the margin
   *  between them is the answer without anyone doing the subtraction. */
  away?: boolean;
}) {
  const yours = team.teamId === mine;

  return (
    <Link
      // **The head-to-head, not the squad.** A result IS a tie, and the screen
      // that reads one is the board — opened on the side that was tapped, and on
      // the round's own gameweek so a September result shows September's eleven
      // rather than today's. This is the schedule's own link, which sent a
      // gameweek from the day it was written while this sent a reader to a squad
      // page that knows nothing about the match he tapped.
      href={`/league/matchups/${team.teamId}?gw=${gameweek}`}
      className={`cm-row flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2 hover:bg-raised ${
        away ? "flex-row-reverse" : ""
      }`}
    >
      <TeamBadge team={team} url={badge} />
      {/* White, and yellow for yours — the table's own rule. Its old reason
          (cyan means "a person", a team is not one) was resting on a misread of
          the reference; the rule stands on CM's own league table instead. */}
      <span
        className={`min-w-0 flex-1 truncate text-sm font-bold ${
          away ? "text-right" : ""
        } ${yoursInk(yours)}`}
      >
        {team.name}
      </span>
      <span
        className={`numeric shrink-0 text-base font-bold lg:text-lg ${
          beat ? "text-ink" : "text-muted"
        }`}
      >
        {total ?? DASH}
      </span>
    </Link>
  );
}
