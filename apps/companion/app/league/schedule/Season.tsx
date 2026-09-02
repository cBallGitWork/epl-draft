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
  teamId,
}: {
  rows: SeasonRow[];
  badges: Map<string, string>;
  /** Whose season this is. Present only where a matchup page can be reached —
   *  the team's own Fixtures tab — so the score becomes a link there and stays
   *  plain text on the schedule's own view, which already has that side's
   *  matchup a tap away in its own row. */
  teamId?: string;
}) {
  return (
    // **Championship Manager's own fixture list** (Craig, 2 Sep, with the shot).
    // Five columns and every one of them a colour with a job: a blue DATE block
    // down the left, the opponent in white, H or A in cyan, the competition in
    // yellow, and the result on a purple ground hard against the right edge.
    // Ours had the date as grey prose inside the name column and the competition
    // beside it in the same grey, which is the same five facts with four of them
    // wearing the same clothes.
    //
    // The scroll bar is CM's too, and it is deliberately visible: the season is
    // 38 rounds and the panel holds about a dozen, so a list that hides its own
    // bar looks like a list that ends.
    <ul className="cm-rows cm-scroll flex max-h-[34rem] flex-col overflow-y-auto">
      {rows.map((row) => (
        <li key={`${row.round.period}-${row.tie.competition.id}-${row.tie.round ?? ""}`}>
          <div
            className={`cm-row flex min-h-11 items-center gap-2 px-1.5 ${
              row.round.started ? "" : "text-muted"
            }`}
          >
            {/* The date block. CM carries the DAY here — "Sat 4th Aug" — and
                the round number is ours to add, because a fantasy season is
                numbered in a way a football calendar is not. */}
            {/* The round always; the DATE only where there is room for it.
                Both inside 5.5rem truncated the date to "Friday 21 Aug…" and
                left the opponent — the one thing a fixture list is FOR — with
                no width at all. */}
            <span className="cm-index numeric flex shrink-0 items-baseline gap-1 px-1.5 py-0.5 text-3xs font-bold">
              <span>GW{row.round.gameweek}</span>
              {row.round.deadline === null ? null : (
                <span className="hidden font-normal opacity-90 lg:inline">
                  {londonDate(row.round.deadline)}
                </span>
              )}
            </span>

            <TeamBadge team={row.opponent.team} url={row.opponent.team === null ? undefined : badges.get(row.opponent.team.teamId)} />

            <span className="min-w-0 flex-1 truncate">
              <Opponent opponent={row.opponent} gameweek={row.round.gameweek} />
            </span>

            {/* **CM's H/A column is deliberately absent.** The shot has one and
                a fantasy fixture cannot fill it: Fantrax names a home and an
                away because its schedule has the fields, but there is no ground
                and `teamSeason.ts` already drops the distinction for that
                reason. Printing an H would be inventing a venue, and an empty
                column is furniture. Four columns, then, and the fifth is the
                one fact this list has that CM's does not — the score. */}

            {/* The competition, in yellow — `First Division` in the shot. A
                knockout names its round beside it, which is the one thing our
                calendar has that a league fixture list does not. */}
            <span className="hidden w-20 shrink-0 truncate text-3xs font-bold uppercase text-accent lg:block">
              {row.tie.round === null
                ? row.tie.competition.name
                : `${row.tie.competition.name} · ${row.tie.round}`}
            </span>

            {/* **The score is the link, not the row** (Craig, 2 Sep: "tap a
                row/score to go to the matchup page"). The row cannot be one:
                it already contains the opponent's link to his squad, and an
                anchor inside an anchor is invalid HTML that browsers resolve by
                dropping one of them. So the two taps are the two things a reader
                wants from the row — the name opens the squad, the score opens
                the match. */}
            {teamId === undefined ? (
              <Score row={row} />
            ) : (
              <Link
                href={`/league/matchups/${teamId}?gw=${row.round.gameweek}`}
                className="cm-row inline-flex min-h-11 shrink-0 items-center hover:underline"
              >
                <Score row={row} />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The result, or the fact that there is not one yet. A fixture still to come
 *  shows nothing at all rather than a nought Fantrax would happily supply. */
function Score({ row }: { row: SeasonRow }) {
  // **A plate either way, played or not** — CM's fixture list runs a filled
  // block down its right edge on every row, carrying `1:1` where there is a
  // result and `---` where there is not (the shot Craig sent). A row whose
  // right-hand column simply vanishes breaks the column, and the dashes are
  // what make the list read as a season rather than as a handful of results.
  //
  // `cm-index` rather than a new purple: the game's money column is white on a
  // filled ground, which is the same mechanism this token already is, and
  // DESIGN §3 retired `pl-purple` deliberately — every colour here is a slot
  // with one meaning and "a score" is not a new one.
  if (!row.round.started) {
    return (
      <span className="cm-index numeric flex h-6 w-12 shrink-0 items-center justify-center text-2xs font-bold opacity-60">
        —
      </span>
    );
  }

  // Only at full time, exactly as the scoreline does it — see `gameweekStatus`
  // in core for why a half-time lead is not a win.
  const won =
    row.round.status === "finished" && leads(row.pointsFor, row.pointsAgainst);

  return (
    <span className="cm-index numeric flex h-6 w-12 shrink-0 items-center justify-center text-2xs font-bold">
      <span className={won ? "text-accent" : ""}>{row.pointsFor ?? "—"}</span>
      <span className="px-0.5 font-normal opacity-70">–</span>
      <span className="opacity-80">{row.pointsAgainst ?? "—"}</span>
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
  // **The gap is a class, not a trailing space in the markup.** It was `"v "`,
  // and a flex container collapses that space away — which is how the tap-floor
  // fix below turned every row into "Vtest3331". A space that only survives
  // while its parent is not flex is not a space, it is a coincidence.
  const name = (
    <>
      <span className="pr-1 text-2xs font-normal uppercase text-faint">v</span>
      {opponent.label}
    </>
  );

  return opponent.team === null ? (
    <span className="truncate text-sm italic text-faint">{name}</span>
  ) : (
    <Link
      href={`/squad/${opponent.team.teamId}?gw=${gameweek}`}
      // **`min-h-11` and the `.cm-row` pair**, which this link had neither of:
      // it was 18px of text in a 56px row, so the row looked thumbable and only
      // the name actually was. `tapfit` never saw it because its route list
      // holds no query strings and this view only existed at
      // `/league/schedule?team=`; a team's own Fixtures tab put it on a plain
      // route and the instrument found all thirty-eight of them at once.
      //
      // `.cm-row` is what lets the desk keep 28px while the phone gets 44 —
      // pairing the two is the documented lesson from 1 Sep, not a belt-and-
      // braces double rule.
      //
      // **`inline-flex`, not `flex`.** A block-level flex box took the link out
      // of the line it shares with the "v" and the date, and the first cut of
      // this fix printed "Vtestf" with the date pushed onto a row of its own.
      // The height has to grow without the link leaving the text flow.
      className="cm-row inline-flex min-h-11 items-center truncate text-sm font-semibold hover:underline"
    >
      {name}
    </Link>
  );
}
