import Link from "next/link";
import { leads, londonDate, DASH } from "@epl/core";
import type { SeasonRow } from "./teamSeason";
import { ROW_NAME, SMALL_CAPS } from "@/app/desk";
import { matchupHref } from "../routes";
import { teamHref } from "@/app/squad/routes";

// One team's season as CM's fixture list: a blue gameweek block, the opponent in white, the
// competition in yellow, and the score on a plate at the right edge. `teamSeason.ts` builds the rows.

export default function Season({
  rows,
  teamId,
}: {
  rows: SeasonRow[];
  /** Whose season this is; every score links to his matchup. */
  teamId: string;
}) {
  return (
    // CM's visible scroll bar on a desk; a phone scrolls the page, or the list's foot sits under the rail.
    <ul className="cm-rows cm-scroll cm-scroll-y flex flex-col lg:max-h-[34rem] lg:overflow-y-auto">
      {rows.map((row) => (
        <li key={`${row.round.period}-${row.tie.competition.id}-${row.tie.round ?? ""}`}>
          <div className="cm-row flex min-h-11 items-center gap-2 px-1.5">
            {/* The gameweek always; its date only on a desk, where the opponent still has room. */}
            <span className="cm-index numeric flex shrink-0 items-baseline gap-1 px-1.5 py-0.5">
              <span>GW{row.round.gameweek}</span>
              {row.round.deadline === null ? null : (
                <span className="hidden font-normal opacity-90 lg:inline">
                  {londonDate(row.round.deadline)}
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1 truncate">
              <Opponent opponent={row.opponent} gameweek={row.round.gameweek} />
            </span>

            {/* No H/A column: a fantasy fixture has no ground. */}

            {/* The competition, in yellow, at every width (Craig, 30 Sep): a cup tie must
                stand apart from a league one. A knockout's round sits under its name. */}
            <span className={`flex w-24 shrink-0 flex-col ${SMALL_CAPS} text-accent lg:w-40 lg:text-sm`}>
              <span className="truncate">{row.tie.competition.name}</span>
              {row.tie.round === null ? null : (
                <span className="truncate font-normal">{row.tie.round}</span>
              )}
            </span>

            {/* The score opens the matchup and the name opens his squad: a link cannot hold a link. */}
            <Link
              href={matchupHref(teamId, row.round.gameweek)}
              className="cm-row inline-flex min-h-11 shrink-0 items-center hover:underline"
            >
              <Score row={row} />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The result on an index plate, or a dash on the same plate for a gameweek still to come. */
function Score({ row }: { row: SeasonRow }) {
  if (!row.round.started) {
    return (
      <span className="cm-index numeric flex h-6 w-12 shrink-0 items-center justify-center opacity-60">
        —
      </span>
    );
  }

  // A win only at full time: a half-time lead is not one (`gameweekStatus` in core).
  const won =
    row.round.status === "finished" && leads(row.pointsFor, row.pointsAgainst);

  return (
    <span className="cm-index numeric flex h-6 w-12 shrink-0 items-center justify-center">
      {/* A win is underlined, not coloured: the plate takes the manager's colour and owns its ink. */}
      <span className={won ? "underline decoration-2 underline-offset-2" : ""}>
        {row.pointsFor ?? DASH}
      </span>
      <span className="px-0.5 font-normal opacity-70">–</span>
      <span className="opacity-80">{row.pointsAgainst ?? DASH}</span>
    </span>
  );
}

function Opponent({
  opponent,
  gameweek,
}: {
  opponent: SeasonRow["opponent"];
  /** The row's gameweek, so a tap on a March fixture opens March's squad. */
  gameweek: number;
}) {
  // The gap is a class: a flex parent collapses a trailing space in the markup.
  const name = (
    <>
      <span className="pr-1 text-2xs font-normal uppercase text-faint">v</span>
      {opponent.label}
    </>
  );

  return opponent.team === null ? (
    // Nobody drawn yet: the same name recipe, italic and faint.
    <span className={`truncate italic text-faint ${ROW_NAME}`}>{name}</span>
  ) : (
    <Link
      href={teamHref(opponent.team.teamId, gameweek)}
      // `inline-flex` keeps the link in the line with its "v"; `.cm-row` gives a phone 44px, the desk 28.
      // A name is white (DESIGN §3), in a gameweek to come as in one played.
      className={`cm-row inline-flex min-h-11 items-center truncate text-ink hover:underline ${ROW_NAME}`}
    >
      {name}
    </Link>
  );
}
