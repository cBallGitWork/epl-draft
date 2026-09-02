"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  // **Null is the squad's own order** (Craig, 2 Sep: sort by tapping, default
  // squad order). The read arrives in roster order — keepers first, then out by
  // depth — which is the order the Squad tab prints, so the two screens agree
  // until a reader asks for something else. A default sort would have them
  // disagree from the first render.
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);

  const columns =
    view === "fantasy"
      ? PLAYER_CATEGORIES
      : PLAYER_CATEGORIES.filter((category) => category.group === view);

  const rows = useMemo(() => {
    if (sort === null) return [...lines];
    const value = (line: PlayerStatLine) =>
      sort.key === "pts"
        ? totalOf(line)
        : figure(line, sort.key, PLAYER_CATEGORIES.find((c) => c.key === sort.key)?.also);
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
  }, [lines, sort]);

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
          className="cm-bevel min-h-11 min-w-0 flex-1 px-2 text-sm font-semibold lg:min-h-9 lg:max-w-52"
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
      <div className="cm-scroll overflow-x-auto">
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
              <tr key={line.fantraxId} className="border-b border-bg">
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
                    className="cm-row flex min-h-11 items-center px-1.5 text-info hover:underline lg:min-h-0"
                  >
                    {line.name}
                  </Link>
                </td>
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

/** A column head that sorts, drawn PRESSED when it is the one in force.
 *
 *  That is the desk's whole grammar for a control that is also a state
 *  (`DESIGN.md` §2): raised is something you press, pressed is the same thing
 *  held down — the sorted column and the view you are on. So the affordance and
 *  the state are one object rather than a head with a caret bolted beside it,
 *  which is how Championship Manager marks its own sorted column. */
function SortHead({
  label,
  title,
  sorted,
  descending,
  onSort,
}: {
  label: string;
  title: string;
  sorted: boolean;
  descending: boolean;
  onSort: () => void;
}) {
  return (
    // `aria-sort` belongs on the cell and not on the control inside it — the
    // role that carries it is `columnheader`, which is the `<th>`.
    <th
      scope="col"
      className="p-0 font-bold"
      title={title}
      aria-sort={sorted ? (descending ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={onSort}
        className={`flex h-6 w-full items-center justify-end px-1.5 ${
          sorted ? "cm-bevel-pressed text-accent" : "cm-bevel"
        }`}
      >
        {label}
      </button>
    </th>
  );
}
