import type { Contribution } from "@epl/core";
import { chipsFor } from "./Chips";
import { LABEL } from "@/app/desk";

// What the football says, under a drop-down (Craig, 21 Sep 2026: "dropdown
// arrow for the full match stats").
//
// **It is the half the breakdown above it cannot say.** That table is our
// league's scoring categories, so it can only ever name things this league pays
// for — and bps, expected goals and FPL's defensive contribution are measurements
// nobody is paid for. Closed, this is the line the card already carried: his
// minutes and the two chips that decided his afternoon. Open, it is the rest.
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
        <span className={`shrink-0 ${LABEL}`}>FPL records</span>
        <span className="numeric text-2xs text-muted">{done.minutes}&apos;</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {chipsFor(done).map((chip) => (
            <span
              key={chip.label}
              className={`numeric px-1 text-[0.625rem] font-bold leading-[1.4] ${chip.className}`}
            >
              {chip.label}
            </span>
          ))}
        </span>
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
            <span className="numeric shrink-0 pr-1.5 text-sm font-bold">{row.value ?? "—"}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** His afternoon as stated rows.
 *
 *  **Minutes always, the countables only when they happened.** A list that reads
 *  `Goals 0 · Assists 0 · Saves 0 · Penalties saved 0` down nine rows is nine
 *  rows saying nothing, on a card whose whole argument is that it carries only
 *  what its question needs. The four measured figures stay whatever they read,
 *  because a nought there is a measurement rather than an absence of one — and
 *  they are absent entirely until he has played, which is FPL's own distinction
 *  and the reason `Contribution.measured` is nullable. */
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
    { label: "Expected goals", value: measured === null ? null : measured.expectedGoals.toFixed(2) },
    {
      label: "Expected assists",
      value: measured === null ? null : measured.expectedAssists.toFixed(2),
    },
  );
  return rows;
}
