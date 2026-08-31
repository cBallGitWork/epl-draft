import Link from "next/link";
import type { PeriodPairing, LeagueTeam } from "@epl/core";
import TeamBadge from "../../components/league/TeamBadge";
import { yoursBorder } from "../../mine";

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
// only safe because the page hands this FINISHED rounds — a half-time lead is
// not a win (`Season.tsx`), and the first cut of the page broke that by listing
// the round in play.

export default function Result({
  pairing,
  points,
  badges,
  mine,
}: {
  pairing: PeriodPairing;
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
        beat={beat(home, away)}
        badge={badges.get(pairing.home.teamId)}
        mine={mine}
      />
      <span className="self-center px-1 text-2xs font-bold uppercase text-faint">v</span>
      <Side
        team={pairing.away}
        total={away}
        beat={beat(away, home)}
        badge={badges.get(pairing.away.teamId)}
        mine={mine}
        away
      />
    </div>
  );
}

/** Absence, never a nought. A period Fantrax has not scored was not drawn 0-0,
 *  and `PeriodResult.points` is null exactly when it could not be read. */
const DASH = "—";

/** Whether this side won it. Null on either total is not a draw — it is a result
 *  we cannot call, and calling it would be the confident wrong answer. */
function beat(ours: number | null, theirs: number | null): boolean {
  return ours !== null && theirs !== null && ours > theirs;
}

function Side({
  team,
  total,
  beat,
  badge,
  mine,
  away = false,
}: {
  team: LeagueTeam;
  total: number | null;
  beat: boolean;
  badge: string | undefined;
  mine: string | null;
  /** The away side reads inward: its total against the middle and its badge on
   *  the outside, so the two numbers meet either side of the `v` and the margin
   *  between them is the answer without anyone doing the subtraction. */
  away?: boolean;
}) {
  const yours = team.teamId === mine;

  return (
    <Link
      href={`/squad/${team.teamId}`}
      className={`cm-row flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2 hover:bg-raised ${
        away ? "flex-row-reverse" : ""
      }`}
    >
      <TeamBadge team={team} url={badge} />
      {/* White, and yellow for yours — the table's own rule, and for its reason:
          cyan is "a person" in this palette and a fantasy team is named after
          one without being one. */}
      <span
        className={`min-w-0 flex-1 truncate text-sm font-bold ${
          away ? "text-right" : ""
        } ${yours ? "text-accent" : "text-ink"}`}
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
