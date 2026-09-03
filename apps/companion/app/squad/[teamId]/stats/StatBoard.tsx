"use client";

import { SELECT } from "../../../components/shell/ButtonLink";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PLAYER_CATEGORIES, type PlayerStatLine, type SeasonTotals } from "@epl/core";
import { UNDERLYING, VIEWS, type ViewKey, figure, totalOf } from "./statViews";
import SortHead from "./SortHead";
import { positionsFromList } from "../../../positions";
import { HEAD_PLATE, HEAD_PLATE_END, ROW_RULE, SCROLL } from "@/app/desk";

// One squad's season, in Championship Manager's own stat-screen grammar.
//
// `cm9900/21.jpg` is the density target and the argument for the shape: thirteen
// abbreviated columns, printed noughts rather than blanks, the figures in yellow
// and the names in cyan. It is the densest table in the reference library and it
// is what a manager reads after a round.
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

  const columns =
    view === "fantasy"
      ? PLAYER_CATEGORIES
      : view === "underlying"
        ? []
        : PLAYER_CATEGORIES.filter((category) => category.group === view);

  const rows = useMemo(() => {
    if (sort === null) return [...lines];
    const value = (line: PlayerStatLine) => {
      if (sort.key === "pts") return totalOf(line);
      const fpl = UNDERLYING.find((column) => column.key === sort.key);
      if (fpl) return underlying[line.fantraxId]?.[fpl.key] ?? null;
      return figure(line, sort.key, PLAYER_CATEGORIES.find((c) => c.key === sort.key)?.also);
    };
    return [...lines].sort((a, b) => {
      // **Absence sorts last whichever way the column runs.** A man with no
      // figure has not scored nought — he has no reading — and floating him to
      // the top of an ascending sort would answer "who conceded fewest" with
      // eleven players who have not played.
      const [x, y] = [value(a), value(b)];
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
    <section className="cm-panel flex flex-col">
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
                <span className={HEAD_PLATE_END}>#</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className={HEAD_PLATE}>Player</span>
              </th>
              {/* Position is a column here for the reason it is one on the squad
                  list: a man eligible at two cannot be filed under one letter. */}
              <th scope="col" className="p-0 text-left font-bold">
                <span className={HEAD_PLATE}>Pos</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className={HEAD_PLATE}>Club</span>
              </th>
              {view === "underlying"
                ? UNDERLYING.map((column) => (
                    <SortHead
                      key={column.key}
                      label={column.head}
                      title={column.label}
                      sorted={sort?.key === column.key}
                      descending={sort?.descending ?? true}
                      onSort={() => sortBy(column.key)}
                    />
                  ))
                : null}
              {columns.map((category) => (
                <SortHead
                  key={category.key}
                  label={category.key}
                  title={category.label}
                  sorted={sort?.key === category.key}
                  descending={sort?.descending ?? true}
                  onSort={() => sortBy(category.key)}
                />
              ))}
              {view === "fantasy" ? (
                <SortHead
                  label="Pts"
                  title="Our total of his scoring categories"
                  sorted={sort?.key === "pts"}
                  descending={sort?.descending ?? true}
                  onSort={() => sortBy("pts")}
                />
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.map((line, index) => (
              <tr key={line.fantraxId} className={ROW_RULE}>
                <td className="cm-index numeric px-1.5 py-1 text-right text-3xs font-bold">
                  {index + 1}
                </td>
                {/* Cyan, because the palette spends it on a person and this is
                    the only column here that is one. */}
                {/* His name opens his page (Craig, 2 Sep: "tapping a player
                    brings up card too"). A link and not the squad list's dialog:
                    that card takes a `SquadPlayerDetail` — a roster slot joined
                    to a footballer and a fixture — and this table holds a flat
                    pool line, which is a different shape from a different
                    endpoint. The profile is where the whole of him is anyway. */}
                <td className="p-0 text-2xs">
                  <Link
                    href={`/players/${line.fantraxId}`}
                    // **`min-h-11` on a phone and `.cm-row` above it**, which is
                    // the documented pair — but written as a breakpoint rather
                    // than as one class. `.cm-row` alone left the link 14px and
                    // `tapfit` found fifteen of them under the floor; `min-h-11`
                    // alone applied at both widths and stood every row of the
                    // table at 90px, which is the opposite of a CM stat screen
                    // (`21.jpg` fits thirteen columns and twelve players on an
                    // 800x600 canvas). The floor is a rule about a THUMB, so it
                    // belongs where there is one.
                    className="cm-row flex min-h-11 items-center px-1.5 text-info hover:underline lg:min-h-7"
                  >
                    {names[line.fantraxId] ?? line.name}
                  </Link>
                </td>
                <td className="px-1.5 py-1 text-3xs font-bold text-mid">
                  {positionsFromList(line.position) ?? "—"}
                </td>
                <td className="px-1.5 py-1 text-2xs text-muted">{line.clubShort ?? "—"}</td>
                {view === "underlying"
                  ? UNDERLYING.map((column) => {
                      const totals = underlying[line.fantraxId];
                      const value = totals?.[column.key];
                      return (
                        <td
                          key={column.key}
                          className={`numeric px-1.5 py-1 text-right text-2xs ${
                            value ? "text-mid" : "text-faint"
                          }`}
                        >
                          {/* A slot the bridge has not settled has no
                              footballer behind it and so no season — a dash,
                              which is absence, against the nought that means he
                              played and did none of it. */}
                          {value === undefined
                            ? "—"
                            : "decimals" in column && column.decimals
                              ? value.toFixed(2)
                              : value}
                        </td>
                      );
                    })
                  : null}
                {columns.map((category) => {
                  const value = figure(line, category.key, category.also);
                  return (
                    <td
                      key={category.key}
                      // **A nought is a nought** (Craig, 2 Sep: "if zero, just
                      // put zero not a dash"), and `21.jpg` is with him — its
                      // thirteen columns are full of printed `0`s. A striker who
                      // has played and not scored HAS a figure and it is nought;
                      // the dash is for a column he cannot have one in at all,
                      // which is what `null` means here.
                      //
                      // Drawn quiet rather than amber so the figures that matter
                      // still carry the column, which is how CM does it too.
                      className={`numeric px-1.5 py-1 text-right text-2xs ${
                        value ? "text-mid" : "text-faint"
                      }`}
                    >
                      {value ?? "—"}
                    </td>
                  );
                })}
                {view === "fantasy" ? (
                  <td className="numeric px-1.5 py-1 text-right text-2xs font-bold text-accent">
                    {totalOf(line) ?? "—"}
                  </td>
                ) : null}
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
        {(view === "underlying"
          ? UNDERLYING.map((column) => [column.head, column.label] as const)
          : columns.map((category) => [category.key, category.label] as const)
        ).map(([head, label]) => (
          <span key={head} className="flex items-baseline gap-1">
            <dt className="font-bold text-mid">{head}</dt>
            <dd className="text-faint">{label}</dd>
          </span>
        ))}
        {view === "fantasy" ? (
          <span className="flex items-baseline gap-1">
            <dt className="font-bold text-accent">Pts</dt>
            <dd className="text-faint">Our total of his scoring categories</dd>
          </span>
        ) : null}
      </dl>
    </section>
  );
}
