import Column from "./Column";
import { DASH } from "@epl/core";

// A table as newsprint sets one: a ruled head, hairline rows, figures in the tabular
// face. It never adds anything up that its caller did not.

export interface PaperTableRow {
  key: string;
  /** Printed as given: rank is the caller's, never this component's index —
   *  a table that numbered its own rows would silently disagree with the
   *  authority it is quoting the moment two clubs are level. */
  rank: number;
  name: string;
  played: number | null;
  /** The middle column: goal difference on the football table, the owner on the scorers chart. */
  detail: string | null;
  points: number | null;
  /** The reader's own team, marked the way "yours" is marked everywhere. */
  yours?: boolean;
}

export default function PaperTable({
  title,
  aside,
  rows,
}: {
  title: string;
  /** Provenance, in the head where a reader meets the numbers. */
  aside?: string;
  rows: readonly PaperTableRow[];
}) {
  if (rows.length === 0) return null;
  // A column of dashes is not a column: a figure no row carries is not printed.
  const played = rows.some((row) => row.played !== null);
  const detail = rows.some((row) => row.detail !== null);

  return (
    <Column title={title} aside={aside}>
      {rows.map((row) => (
        <div
          key={row.key}
          // Not a link and not a tap target: this is a printed table, and the sortable,
          // tappable ones are on the League and Players tabs.
          className="flex items-baseline gap-2 py-1 text-xs"
        >
          <span className="numeric w-5 shrink-0 text-center text-faint">{row.rank}</span>
          <span className={`min-w-0 flex-1 truncate ${row.yours ? "font-bold text-accent" : "text-ink"}`}>
            {row.name}
          </span>
          {played ? (
            <span className="numeric w-6 shrink-0 text-center text-muted">{row.played ?? DASH}</span>
          ) : null}
          {/* Not `.numeric` on the chart: there this cell is a manager's name. One width only, as `w-20` beat `w-12`. */}
          {detail ? (
            <span
              className={`shrink-0 truncate text-muted ${played ? "numeric w-12 text-center" : "w-20"}`}
            >
              {row.detail ?? DASH}
            </span>
          ) : null}
          <span className="numeric w-7 shrink-0 text-center font-semibold text-ink">
            {row.points ?? DASH}
          </span>
        </div>
      ))}
    </Column>
  );
}
