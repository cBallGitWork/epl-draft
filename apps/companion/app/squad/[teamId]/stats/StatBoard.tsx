"use client";

import { SELECT } from "../../../components/shell/ButtonLink";
import { useMemo, useState } from "react";
import Link from "next/link";
import { type PlayerStatLine, type SeasonTotals, DASH } from "@epl/core";
import { VIEWS, type ViewKey, measuresFor, readingOf } from "./statViews";
import SortHead from "./SortHead";
import { positionsFromList } from "../../../positions";
import { POOL } from "../../../players/routes";
import {
  BOARD_FIGURE,
  HEAD_CELL,
  HEAD_PLATE,
  HEAD_PLATE_END,
  PANEL_FLUSH,
  ROW_NAME,
  ROW_RULE,
  SCROLL,
} from "@/app/desk";
import { MUTE } from "../../../components/league/TableHeads";

// One squad's season, in Championship Manager's own stat-screen grammar.
//
// `cm9900/21.jpg` is the density target and the argument for the shape: thirteen
// abbreviated columns, printed noughts rather than blanks, the figures in yellow
// and the names in WHITE — this said cyan until 3 Sep 2026, off a reference row
// that had misread its own screenshots. It is the densest table in the reference
// library and it is what a manager reads after a round.
//
// **The groups are a filter, not one enormous table** (Craig, 2 Sep: "separate
// the two, add a grey filter dropdown at top — fantasy stats, attacking stats,
// defensive stats"). Two things drove it: eleven categories plus points is wider
// than any phone, and the questions are genuinely different — "what did my
// squad score" is not "who is taking my shots". The dropdown is CM's own grey
// bevelled control, which `21.jpg` and `25.jpg` both carry above the table.
//
// The table idiom below is `SeasonGrid`'s to the class: a real `<table>` in
// `overflow-x-auto` in a `cm-panel`, `cm-index` down the left, and the bevel on
// a block INSIDE each `<th>` rather than on the cell — these tables collapse
// their borders and a strip of bevelled cells loses its inner edges (desk.css).

export default function StatBoard({
  lines,
  underlying,
  names,
}: {
  lines: readonly PlayerStatLine[];
  /** FPL's season totals by Fantrax id, for the underlying view. Absent for a
   *  slot the bridge has not settled, which is ordinary — the pool carries
   *  academy names FPL has never listed — and reads as a row of dashes. */
  underlying: Record<string, SeasonTotals>;
  /** The roster's spelling of each name, by id. Fantrax's stat rows say
   *  "Schade, Kevin" and every other screen says "Kevin Schade". */
  names: Record<string, string>;
}) {
  const [view, setView] = useState<ViewKey>("fantasy");
  // **Null is the squad's own order** (Craig, 2 Sep: sort by tapping, default
  // squad order). The read arrives in roster order — keepers first, then out by
  // depth — which is the order the Squad tab prints, so the two screens agree
  // until a reader asks for something else. A default sort would have them
  // disagree from the first render.
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);

  // The columns on screen, which the head strip, the rows and the glossary all
  // read — one list, so a view cannot put a column in the table and leave it out
  // of the key.
  const measures = measuresFor(view);

  const rows = useMemo(() => {
    if (sort === null) return [...lines];
    return [...lines].sort((a, b) => {
      // **Absence sorts last whichever way the column runs.** A man with no
      // figure has not scored nought — he has no reading — and floating him to
      // the top of an ascending sort would answer "who conceded fewest" with
      // eleven players who have not played.
      const x = readingOf(a, underlying[a.fantraxId], sort.key);
      const y = readingOf(b, underlying[b.fantraxId], sort.key);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return sort.descending ? y - x : x - y;
    });
  }, [lines, sort, underlying]);

  /** Tapping a head sorts by it; tapping the sorted one turns it round.
   *
   *  Opens DESCENDING because every column here is a count of something a
   *  manager did, and "most" is the question — even for the low-is-good ones,
   *  where the first tap answers "who is costing me cards" before the second
   *  answers "who is clean". */
  const sortBy = (key: string) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );

  return (
    <section className={PANEL_FLUSH}>
      {/* CM's grey bevelled control, in the place the game puts it: on its own
          strip above the table, not inside the title bar (`21.jpg`, `25.jpg`). */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <label className="text-3xs font-bold uppercase text-faint" htmlFor="stat-view">
          View
        </label>
        <select
          id="stat-view"
          value={view}
          onChange={(event) => setView(event.target.value as ViewKey)}
          className={`${SELECT} min-w-0 flex-1 lg:max-w-52`}
        >
          {VIEWS.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {/* `cm-scroll` is CM's own bevelled bar with arrow buttons, and it is
          here to be SEEN (Craig, 2 Sep: "scroll bar at bottom to make it obvious
          we need to scroll"). A table wider than its panel that hides its own
          scrollbar is a table whose remaining columns do not exist as far as a
          reader knows. The pool board already wears it. */}
      <div className={`cm-scroll ${SCROLL}`}>
        <table className="w-full border-collapse whitespace-nowrap">
          <thead>
            <tr className="text-3xs uppercase">
              <th scope="col" className="p-0 font-bold">
                <span className={HEAD_PLATE_END}>
                  <span className={MUTE}>Rank</span>
                </span>
              </th>
              <th scope="col" className={HEAD_CELL}>
                <span className={HEAD_PLATE}>
                  <span className={MUTE}>Player</span>
                </span>
              </th>
              {/* Position is a column here for the reason it is one on the squad
                  list: a man eligible at two cannot be filed under one letter. */}
              <th scope="col" className={HEAD_CELL}>
                <span className={HEAD_PLATE}>Pos</span>
              </th>
              <th scope="col" className={HEAD_CELL}>
                <span className={HEAD_PLATE}>Club</span>
              </th>
              {measures.map((measure) => (
                <SortHead
                  key={measure.key}
                  label={measure.head}
                  title={measure.label}
                  sorted={sort?.key === measure.key}
                  descending={sort?.descending ?? true}
                  onSort={() => sortBy(measure.key)}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((line, index) => (
              <tr key={line.fantraxId} className={ROW_RULE}>
                <td className="cm-index numeric px-1.5 py-1 text-right">
                  {index + 1}
                </td>
                {/* White, which is what CM sets a name in on every screen it
                    draws (`12.jpg`, `16.jpg`, `21.jpg`). This comment said cyan
                    for a week while the code beside it said `text-ink`, off the
                    same misread reference row `PlayerBoard`'s twin has already
                    had corrected.

                    His name opens his page (Craig, 2 Sep: "tapping a player
                    brings up card too"). A link and not the squad list's dialog:
                    that card takes a `SquadPlayerDetail` — a roster slot joined
                    to a footballer and a fixture — and this table holds a flat
                    pool line, which is a different shape from a different
                    endpoint. The profile is where the whole of him is anyway. */}
                <td className="p-0">
                  <Link
                    href={`${POOL}/${line.fantraxId}`}
                    // **`min-h-11` on a phone and `.cm-row` above it**, which is
                    // the documented pair — but written as a breakpoint rather
                    // than as one class. `.cm-row` alone left the link 14px and
                    // `tapfit` found fifteen of them under the floor; `min-h-11`
                    // alone applied at both widths and stood every row of the
                    // table at 90px, which is the opposite of a CM stat screen
                    // (`21.jpg` fits thirteen columns and twelve players on an
                    // 800x600 canvas). The floor is a rule about a THUMB, so it
                    // belongs where there is one.
                    className={`cm-row flex min-h-11 items-center px-1.5 ${ROW_NAME} text-ink hover:underline`}
                  >
                    {names[line.fantraxId] ?? line.name}
                  </Link>
                </td>
                <td className="px-1.5 py-1 text-3xs font-bold text-mid">
                  {positionsFromList(line.position) ?? DASH}
                </td>
                <td className="px-1.5 py-1 text-2xs text-muted">{line.clubShort ?? DASH}</td>
                {measures.map((measure) => {
                  const value = measure.read(line, underlying[line.fantraxId]);
                  return (
                    <td
                      key={measure.key}
                      // **A nought is a nought** (Craig, 2 Sep: "if zero, just
                      // put zero not a dash"), and `21.jpg` is with him — its
                      // thirteen columns are full of printed `0`s. A striker who
                      // has played and not scored HAS a figure and it is nought;
                      // the dash is for a column he cannot have one in at all —
                      // a category he can never register, or a slot the bridge
                      // has not settled, which has no footballer behind it and
                      // so no FPL season.
                      //
                      // A figure is drawn quiet rather than amber so the ones
                      // that matter still carry the column, which is how CM does
                      // it too. The total is the exception and wears the accent,
                      // because it is what the board adds up to.
                      className={`${BOARD_FIGURE} py-1 ${
                        measure.loud
                          ? "font-bold text-accent"
                          : value
                            ? "text-mid"
                            : "text-faint"
                      }`}
                    >
                      {value === null ? DASH : measure.decimals ? value.toFixed(2) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* **The glossary, under the table** (Craig, 2 Sep: "maybe a glossary at
          the bottom for all the abbreviations? or the top?"). Under, because it
          is a reference rather than an introduction — a reader who knows `CBI`
          should not have to scroll past its definition to reach the numbers,
          and one who does not knows where the key of a table lives.
          `cm9900/21.jpg` runs thirteen abbreviated heads with no key at all,
          which works in a game whose manual you own and not on a phone.

          It names only the columns actually on screen, so switching the view
          changes the key with it. */}
      <dl className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-line px-2 py-1.5 text-3xs">
        {measures.map((measure) => (
          <span key={measure.key} className="flex items-baseline gap-1">
            <dt className={`font-bold ${measure.loud ? "text-accent" : "text-mid"}`}>
              {measure.head}
            </dt>
            <dd className="text-faint">{measure.label}</dd>
          </span>
        ))}
      </dl>
    </section>
  );
}
