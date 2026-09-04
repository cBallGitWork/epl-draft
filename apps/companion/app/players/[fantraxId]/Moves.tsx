import Section from "../../components/shell/Section";
import { ROW_RULE } from "@/app/desk";
import type { PlayerMove } from "./dossier";

// Every move this league has made with him: claimed, dropped, traded.
//
// **This is what Championship Manager's Transfer tab is for.** The game lists a
// player's moves between clubs; ours lists his between managers, which is the
// same question a draft league asks. The draft pick above says how he arrived and
// this says what has happened since.
//
// Fantrax's own date string, verbatim — "Wed Aug 12, 2026, 9:14AM". It carries no
// offset, so making an instant of it would mean assuming a timezone on data we do
// not control, and every other reader of this feed prints it the same way.
//
// A pending move is drawn quiet and labelled. Fantrax distinguishes executed from
// proposed and the default filter hides the proposals; carrying the flag is what
// stops a reader mistaking one for the other.

/** Fantrax's own words for what happened, in ours. Their vocabulary is theirs and
 *  this is a label at the point of drawing, never a value anything compares. */
const KIND: Record<string, string> = {
  claim: "Claimed",
  drop: "Dropped",
  trade: "Traded",
};

export default function Moves({ moves }: { moves: readonly PlayerMove[] }) {
  if (moves.length === 0) {
    // A man nobody has moved. True of most of the pool most weeks, and it is an
    // answer rather than a read that failed.
    return (
      <Section title="Business" aside="This league">
        <p className="text-sm text-muted">No claim, drop or trade involving him.</p>
      </Section>
    );
  }

  return (
    <Section title="Business" aside="This league">
      <ul className="flex flex-col">
        {moves.map(({ transaction, fromName, toName }) => (
          <li
            key={`${transaction.setId}-${transaction.kind}-${transaction.processedAt ?? ""}`}
            className={`flex min-h-7 flex-wrap items-baseline gap-x-2 py-1 ${ROW_RULE} ${
              transaction.executed ? "" : "text-faint"
            }`}
          >
            <span className="text-sm font-bold">
              {KIND[transaction.kind] ?? transaction.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted">
              {/* Null on either side is not a gap: nobody owns a free agent, and
                  a dropped man goes to the pool rather than to a manager. */}
              {fromName === null ? null : <>from {fromName} </>}
              {toName === null ? null : <>to {toName}</>}
            </span>
            {transaction.executed ? null : (
              <span className="text-2xs uppercase text-faint">Pending</span>
            )}
            <span className="numeric text-2xs text-faint">{transaction.processedAt ?? "—"}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
