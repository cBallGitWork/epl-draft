"use client";

import { useEffect, useState } from "react";
import { type Opposition, type PlayerMatchStats, DASH, attackingStats, contribution, fullMatchStats } from "@epl/core";
import { readMatchParts, type MatchRead } from "../../matchParts";
import { BLOCK_PLATE, FACT_LABEL, LABEL } from "@/app/desk";

// What he did in the match or gameweek shown, under a drop-down: FPL's counts, Opta's for what FPL does not
// split, and only what this league scores at his slot; then Opta's attacking figures, priced or not.

const UNREAD: MatchRead = { parts: null, scored: null };

export default function FullMatchStats({
  stats,
  opta,
  position,
  opposition,
}: {
  stats: readonly PlayerMatchStats[];
  opta: string | null;
  /** His roster slot, or his positions as "M/F". */
  position: string | null;
  opposition: readonly Opposition[] | undefined;
}) {
  const [read, setRead] = useState<MatchRead | null>(null);
  // Read again when a match starts, not on every poll that hands over the same fixtures afresh.
  const startedKey = JSON.stringify(
    (opposition ?? []).flatMap(({ fixture }) =>
      fixture.status === "upcoming" || fixture.gameweek === null ? [] : [{ gameweek: fixture.gameweek, code: fixture.code }],
    ),
  );
  useEffect(() => {
    let open = true;
    const fixtures = JSON.parse(startedKey) as { gameweek: number; code: number }[];
    readMatchParts({ opta, fixtures, position }).then(
      (answer) => open && setRead(answer),
      () => open && setRead(UNREAD),
    );
    return () => {
      open = false;
    };
  }, [opta, position, startedKey]);

  const rows = read === null ? [] : fullMatchStats(contribution(stats), read.parts, read.scored);
  const attacking = read === null ? [] : attackingStats(read.parts, position);
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

      <Figures rows={rows.map((row) => ({ key: row.key, label: row.label, figure: row.value ?? DASH }))} />

      {attacking.length === 0 ? null : (
        <>
          <h3 className={BLOCK_PLATE}>Attacking</h3>
          <Figures
            rows={attacking.map((row) => ({
              key: row.key,
              label: row.label,
              figure: row.of === null ? row.value : `${row.value}/${row.of}`,
            }))}
          />
        </>
      )}
    </details>
  );
}

/** Label and figure in two columns, read down the left column, then the right. */
function Figures({ rows }: { rows: { key: string; label: string; figure: number | string }[] }) {
  return (
    <dl className="cm-rows columns-2 gap-0 border-t border-line [column-rule:1px_solid_var(--color-bg)]">
      {rows.map((row) => (
        <div key={row.key} className="flex min-h-8 break-inside-avoid items-center gap-2 px-2">
          <dt className={FACT_LABEL}>{row.label}</dt>
          <dd className="numeric shrink-0 text-sm font-bold">{row.figure}</dd>
        </div>
      ))}
    </dl>
  );
}
