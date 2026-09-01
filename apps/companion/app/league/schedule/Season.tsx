import Link from "next/link";
import { leads } from "@epl/core";
import TeamBadge from "../../components/league/TeamBadge";
import type { SeasonRow } from "./teamSeason";
import { londonDate } from "../../londonTime";

// One team's season on one screen: every round it is in, who it plays, and what
// each one finished. The league's fixtures and any knockout it has been drawn
// into, in gameweek order. `yours.ts` assembles the rows; this draws them.
//
// The asked-about team's total leads every row, because there is no ground and
// the team you came to read about reads first.

export default function Season({
  rows,
  badges,
}: {
  rows: SeasonRow[];
  badges: Map<string, string>;
}) {
  return (
    <ul className="cm-rows flex flex-col">
      {rows.map((row) => (
        <li key={`${row.round.period}-${row.tie.competition.id}-${row.tie.round ?? ""}`}>
          <div
            className={`cm-row flex min-h-14 items-center gap-2.5 px-3 py-2 ${
              row.round.started ? "" : "text-muted"
            }`}
          >
            <span className="numeric w-9 shrink-0 text-2xs font-bold uppercase text-faint">
              GW{row.round.gameweek}
            </span>

            <TeamBadge team={row.opponent.team} url={row.opponent.team === null ? undefined : badges.get(row.opponent.team.teamId)} />

            <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
              <Opponent opponent={row.opponent} gameweek={row.round.gameweek} />
              <span className="shrink-0 truncate text-2xs text-faint">
                {row.tie.round === null
                  ? row.round.deadline === null
                    ? row.tie.competition.name
                    : londonDate(row.round.deadline)
                  : `${row.tie.competition.name} · ${row.tie.round}`}
              </span>
            </span>

            <Score row={row} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The result, or the fact that there is not one yet. A fixture still to come
 *  shows nothing at all rather than a nought Fantrax would happily supply. */
function Score({ row }: { row: SeasonRow }) {
  if (!row.round.started) {
    return (
      <span className="shrink-0 text-2xs font-bold uppercase text-faint">
        To play
      </span>
    );
  }

  // Only at full time, exactly as the scoreline does it — see `gameweekStatus`
  // in core for why a half-time lead is not a win.
  const won =
    row.round.status === "finished" && leads(row.pointsFor, row.pointsAgainst);

  return (
    <span className="numeric shrink-0 text-lg font-bold">
      <span className={won ? "text-ink" : ""}>{row.pointsFor ?? "—"}</span>
      <span className="px-1 text-2xs font-normal text-faint">–</span>
      <span className="text-muted">{row.pointsAgainst ?? "—"}</span>
    </span>
  );
}

function Opponent({
  opponent,
  gameweek,
}: {
  opponent: SeasonRow["opponent"];
  /** The round this row is about. Carried into the squad link so a tap on a
   *  March fixture opens March's squad, not this week's — the same reason
   *  `Tie` carries it, and this view was missed when that one was fixed. */
  gameweek: number;
}) {
  const name = (
    <>
      <span className="text-2xs font-normal uppercase text-faint">v </span>
      {opponent.label}
    </>
  );

  return opponent.team === null ? (
    <span className="truncate text-sm italic text-faint">{name}</span>
  ) : (
    <Link
      href={`/squad/${opponent.team.teamId}?gw=${gameweek}`}
      className="truncate text-sm font-semibold hover:underline"
    >
      {name}
    </Link>
  );
}
