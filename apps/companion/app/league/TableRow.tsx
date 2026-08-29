import Link from "next/link";
import type { StandingsRow } from "@epl/core";
import TeamBadge from "../components/league/TeamBadge";
import { yoursBorder } from "../mine";

// One team's line in the table.
//
// **Two lines rather than one, and the arithmetic decided it.** A phone gives
// the row about 342px inside its padding. Rank, badge, the record, games back,
// the win fraction, fantasy points and the league's points come to 286 of that
// before a single letter of a team name — and to more than all of it on the one
// row that also carries the YOURS chip. The columns Fantrax publishes do not fit
// beside a name on a phone, so the name keeps the line and the figures take
// their own.
//
// Nothing is hidden at a small width to make it fit, which is the rule
// `/players` set (DESIGN §9): a table that drops columns on a phone is a
// different table, and this league is read on phones.

export default function TableRow({
  row,
  badge,
  mine,
}: {
  row: StandingsRow;
  badge: string | undefined;
  mine: boolean;
}) {
  return (
    <Link
      href={`/squad/${row.teamId}`}
      // Your own row takes the raised ground as well as the accent edge. On
      // sixteen near-identical rows a 4px bar at the margin is easy to scroll
      // straight past, and this is the one row a manager opened the page to
      // find.
      className={`elev flex min-h-14 flex-col justify-center gap-1 rounded-xl border px-3 py-2 hover:bg-raised ${
        mine ? "bg-raised" : "bg-surface"
      } ${yoursBorder(mine)}`}
    >
      <span className="flex items-center gap-2">
        {/* Rank and points are the two numbers a table is read for, and both
            were quieter than the team name until 29 Aug: the rank small and
            faint, the points bold at body size. They are the figures now, at
            either end of the line the name is on — the figures below decide
            neither. */}
        <span className="numeric w-6 text-lg font-bold leading-none text-muted">{row.rank}</span>
        <TeamBadge team={{ teamId: row.teamId, name: row.teamName }} url={badge} />
        <span className={`min-w-0 flex-1 truncate text-sm ${mine ? "font-bold text-ink" : "font-semibold"}`}>
          {row.teamName}
        </span>
        {/* Labelled, not just accented — the border says nothing to anyone who
            cannot see it. On `bg-bg` rather than `bg-raised`: the row it sits on
            is now raised, and a chip the same colour as its ground is not a
            chip. */}
        {mine ? (
          <span className="rounded bg-bg px-1.5 py-0.5 text-2xs font-bold uppercase tracking-widest text-accent">
            You
          </span>
        ) : null}
        <span className="numeric w-8 text-right text-lg font-bold leading-none">{row.points}</span>
      </span>

      {/* Every figure carries its own word, because this strip has no column
          heads over it to do the job (DESIGN §7). The record leads because it is
          the one a league table is normally read with. */}
      <span className="flex items-center gap-2 pl-8 text-3xs leading-none text-faint">
        <span className="numeric text-2xs text-muted">
          {row.won}-{row.drawn}-{row.lost}
        </span>
        <Figure label="GB" value={row.gamesBack === null ? null : String(row.gamesBack)} />
        <Figure label="Win%" value={winFraction(row.winPercentage)} />
        <Figure label="FP" value={String(row.pointsFor)} />
      </span>
    </Link>
  );
}

/** One labelled figure. A dash for a number Fantrax did not give us — never a
 *  nought, which would be a claim about a team that has played nobody. */
function Figure({ label, value }: { label: string; value: string | null }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-bold uppercase tracking-widest">{label}</span>
      <span className="numeric text-2xs text-muted">{value ?? "—"}</span>
    </span>
  );
}

/** Fantrax's own rendering of their own fraction: `1.000`, `.500`, `.000`.
 *
 *  Three decimals with the leading nought dropped, which is how their table sets
 *  it and how the column headed `Win%` is meant to be read. It is NOT a
 *  percentage — the value for a side that has won every game is 1 — so printing
 *  it as one would put the leader on 1% and the table's best row last. */
function winFraction(value: number | null): string | null {
  return value === null ? null : value.toFixed(3).replace(/^0/, "");
}
