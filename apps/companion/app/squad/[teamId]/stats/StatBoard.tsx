"use client";

import { useState } from "react";
import { PLAYER_CATEGORIES, type PlayerStatLine } from "@epl/core";
import { positionsFromList } from "../../../positions";

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

/** The views, and what each one answers.
 *
 *  **Fantasy leads** because it is the question this league is actually playing:
 *  what our scoring paid each man. The other three are the raw counts behind it,
 *  grouped the way `league/categories.ts` already groups a team's — the same
 *  four kinds of thing a squad does, minus appearances, which has no per-player
 *  column in this read. */
const VIEWS = [
  { key: "fantasy", label: "Fantasy points" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

/** Fantrax spells the same defensive fact `GA` for a keeper and `GAO` for an
 *  outfielder, so a category may name a second column to try. Read as a
 *  fallback, never summed: a man is in exactly one half of the read, so at most
 *  one of the two is ever on his row. */
function figure(line: PlayerStatLine, key: string, also: string | undefined) {
  return line.stats[key] ?? (also === undefined ? null : line.stats[also] ?? null);
}

/** His total, as our league scores it — the sum of every category on his row.
 *
 *  **Not the pool's `FPts`.** That column prices a man at his DEFAULT position
 *  and never at the slot his manager filed him in (CLAUDE.md, and 48 of 607 are
 *  eligible at two) — Saka is paid at forward rates there and at midfield rates
 *  by the league. A total added from the counts is ours rather than Fantrax's,
 *  so DESIGN §7 requires it be labelled as ours: the column is headed `Pts` and
 *  never `FPts`, which is Fantrax's own name for a different number. */
function totalOf(line: PlayerStatLine): number | null {
  const figures = PLAYER_CATEGORIES.map((category) =>
    figure(line, category.key, category.also),
  ).filter((value): value is number => value !== null);
  return figures.length === 0 ? null : figures.reduce((sum, value) => sum + value, 0);
}

export default function StatBoard({ lines }: { lines: readonly PlayerStatLine[] }) {
  const [view, setView] = useState<ViewKey>("fantasy");

  const columns =
    view === "fantasy"
      ? PLAYER_CATEGORIES
      : PLAYER_CATEGORIES.filter((category) => category.group === view);

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
          className="cm-bevel min-h-11 min-w-0 flex-1 px-2 text-sm font-semibold lg:min-h-9 lg:max-w-52"
        >
          {VIEWS.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap">
          <thead>
            <tr className="text-3xs uppercase">
              <th scope="col" className="p-0 font-bold">
                <span className="cm-bevel flex h-6 items-center justify-end px-1.5">#</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className="cm-bevel flex h-6 items-center px-1.5">Player</span>
              </th>
              {/* Position is a column here for the reason it is one on the squad
                  list: a man eligible at two cannot be filed under one letter. */}
              <th scope="col" className="p-0 text-left font-bold">
                <span className="cm-bevel flex h-6 items-center px-1.5">Pos</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className="cm-bevel flex h-6 items-center px-1.5">Club</span>
              </th>
              {columns.map((category) => (
                <th
                  key={category.key}
                  scope="col"
                  // The category's full name, since the header is an
                  // abbreviation Fantrax chose and not one a reader knows.
                  title={category.label}
                  className="p-0 font-bold"
                >
                  <span className="cm-bevel flex h-6 items-center justify-end px-1.5">
                    {category.key}
                  </span>
                </th>
              ))}
              {view === "fantasy" ? (
                <th scope="col" className="p-0 font-bold" title="Our total of his scoring categories">
                  <span className="cm-bevel flex h-6 items-center justify-end px-1.5">Pts</span>
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {lines.map((line, index) => (
              <tr key={line.fantraxId} className="border-b border-bg">
                <td className="cm-index numeric px-1.5 py-1 text-right text-3xs font-bold">
                  {index + 1}
                </td>
                {/* Cyan, because the palette spends it on a person and this is
                    the only column here that is one. */}
                <td className="px-1.5 py-1 text-2xs text-info">{line.name}</td>
                <td className="px-1.5 py-1 text-3xs font-bold text-mid">
                  {positionsFromList(line.position) ?? "—"}
                </td>
                <td className="px-1.5 py-1 text-2xs text-muted">{line.clubShort ?? "—"}</td>
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
    </section>
  );
}
