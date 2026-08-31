import Column from "./Column";

// A table as newsprint sets one: a ruled head, hairline rows, and figures in
// the tabular face — the shape a back page has printed since long before any
// of this. Both the tables the paper carries feed it, because a table is the
// same object whichever competition it is about.
//
// **It never adds anything up that its caller did not.** The draft table is
// Fantrax's own arithmetic, verbatim, and the Premier League's is computed
// from finished fixtures under the competition's own fixed rules
// (`football/table.ts`). The distinction is stated in the caller's heading,
// not smoothed over here.

export interface PaperTableRow {
  key: string;
  /** Printed as given: rank is the caller's, never this component's index —
   *  a table that numbered its own rows would silently disagree with the
   *  authority it is quoting the moment two clubs are level. */
  rank: number;
  name: string;
  played: number | null;
  /** The middle column: goal difference on the football table, W-D-L on the
   *  draft one. Absence prints as a dash. */
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
  // A column of dashes is not a column. The scorers chart has no "played" to
  // print, so the cell goes rather than standing empty ten times over.
  const played = rows.some((row) => row.played !== null);

  return (
    <Column title={title} aside={aside}>
      {rows.map((row) => (
        <div
          key={row.key}
          // Not a link and not a tap target: this is a printed table, and the
          // real ones — sortable, tappable, with the badges — are on the
          // League and Players tabs where a manager goes to use them.
          className="flex items-baseline gap-2 py-1 text-xs"
        >
          <span className="numeric w-5 shrink-0 text-right text-faint">{row.rank}</span>
          <span className={`min-w-0 flex-1 truncate ${row.yours ? "font-bold text-accent" : "text-ink"}`}>
            {row.name}
          </span>
          {played ? (
            <span className="numeric w-6 shrink-0 text-right text-muted">{row.played ?? "—"}</span>
          ) : null}
          {/* Not `.numeric`: this cell is a record on a table and a manager's
              name on a chart, and letterspacing rules follow the content. */}
          <span
            className={`w-20 shrink-0 truncate text-right text-muted ${played ? "numeric w-12" : ""}`}
          >
            {row.detail ?? "—"}
          </span>
          <span className="numeric w-7 shrink-0 text-right font-semibold text-ink">
            {row.points ?? "—"}
          </span>
        </div>
      ))}
    </Column>
  );
}
