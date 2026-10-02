import type { Contribution } from "@epl/core";
import { LABEL } from "@/app/desk";
import { DASH, fixed } from "@epl/core";

// What the football says, under a drop-down (Craig, 21 Sep 2026: "dropdown
// arrow for the full match stats").
//
// **It is the half the breakdown above it cannot say.** That table holds our
// league's scoring categories, and bps, expected goals and FPL's defensive
// contribution are measurements nobody is paid for.
//
// **Shut, it is the heading and the arrow and nothing else** (Craig, same day:
// "Not fpl records, FULL MATCH STATS (ditch the number and labels)") — a summary
// that previews the panel under it is the panel twice.
//
// The chevron and its `group-open` rotation are `football/MatchList`'s, copied
// rather than extracted: two occurrences is a coincidence (§1), and the count is
// recorded here so the third does not have to re-derive it.

/** One measured figure, and the rows are declared rather than written out so a
 *  nought can be dropped in one place. */
interface Row {
  label: string;
  value: string | null;
}

export default function FplRecords({ done }: { done: Contribution }) {
  const rows = recordsOf(done);

  return (
    <details className="group cm-panel">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 [&::-webkit-details-marker]:hidden">
        <span className={`min-w-0 flex-1 ${LABEL}`}>Full match stats</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <ul className="cm-rows flex flex-col border-t border-line">
        {rows.map((row) => (
          <li key={row.label} className="flex min-h-8 items-center gap-2 px-2">
            <span className="min-w-0 flex-1 truncate text-sm text-muted">{row.label}</span>
            {/* Absence is a dash and never a nought (DESIGN §7): the expected
                family is not measured until he has been on a pitch. */}
            <span className="numeric shrink-0 pr-1.5 text-sm font-bold">{row.value ?? DASH}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** His afternoon as stated rows.
 *
 *  **Minutes always, the countables only when they happened**: `Goals 0 ·
 *  Assists 0 · Saves 0` down nine rows is nine rows saying nothing.
 *
 *  The four measured figures stay whatever they read — a nought there is a
 *  measurement and not an absence — and they are absent entirely until he has
 *  played, which is why `Contribution.measured` is nullable. */
function recordsOf(done: Contribution): Row[] {
  const rows: Row[] = [{ label: "Minutes", value: String(done.minutes) }];
  const countable: [string, number][] = [
    ["Goals", done.goals],
    ["Assists", done.assists],
    ["Saves", done.saves],
    ["Penalties saved", done.penaltiesSaved],
    ["Penalties missed", done.penaltiesMissed],
    ["Yellow cards", done.yellowCards],
    ["Red cards", done.redCards],
  ];
  for (const [label, count] of countable) {
    if (count > 0) rows.push({ label, value: String(count) });
  }
  if (done.cleanSheet) rows.push({ label: "Clean sheet", value: "Yes" });

  const measured = done.measured;
  rows.push(
    { label: "Bonus points system", value: measured === null ? null : String(measured.bps) },
    {
      label: "Defensive contribution",
      value: measured === null ? null : String(measured.defensiveContribution),
    },
    { label: "Expected goals", value: measured === null ? null : fixed(measured.expectedGoals, "expected") },
    {
      label: "Expected assists",
      value: measured === null ? null : fixed(measured.expectedAssists, "expected"),
    },
  );
  return rows;
}
