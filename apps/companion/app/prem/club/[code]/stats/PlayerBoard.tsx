"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FootballPlayer } from "@epl/core";
import { SELECT } from "../../../../components/shell/ButtonLink";
import { VIEWS, reading } from "./measures";
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
import { MUTE } from "../../../../components/league/TableHeads";
import { DASH } from "@epl/core";

// A club's season, player by player, in Championship Manager's stat-screen
// grammar.
//
// **The same shape as `squad/[teamId]/stats`** (Craig, 3 Sep 2026: "stats is
// nothing like other sections, revamp, is for the players"). That screen is the
// section's idiom and this one was a club summary instead: a real `<table>` in
// `cm-scroll overflow-x-auto` inside a `cm-panel`, `cm-index` down the left, the
// bevel on a block INSIDE each `<th>` rather than on the cell — these tables
// collapse their borders and a strip of bevelled cells loses its inner edges
// (desk.css).
//
// **It replaced a leaders board**, which named the top man in six measures. The
// board answers the same question better: sorted by goals, the first row IS the
// top scorer, and it says what the rest of the squad did as well. Two answers to
// one question is what CODE_RULES §2 calls bloat, so the leaders went.
//
// Client only because sorting is a tap here rather than a link. That is the
// difference from `/league` and `/prem`, whose sort survives being shared
// because a whole page is one table; this is a tab inside a club, and a query
// string on it would have to carry the club too.

export interface Row {
  player: FootballPlayer;
  /** What our league files him at, already labelled. Null when Fantrax has no
   *  opinion or would not answer. */
  position: string | null;
}

export default function PlayerBoard({ rows }: { rows: readonly Row[] }) {
  const [view, setView] = useState(VIEWS[0]?.key ?? "attack");
  // **Null is the squad's own order** — the one the Squad tab prints, keeper
  // first by the position our league files him at. A default sort would have the
  // two tabs disagree from the first render.
  const [sort, setSort] = useState<{ key: keyof FootballPlayer["season"]; descending: boolean } | null>(
    null,
  );

  const measures = VIEWS.find((entry) => entry.key === view)?.measures ?? [];

  const ordered = useMemo(() => {
    if (sort === null) return [...rows];
    return [...rows].sort((a, b) => {
      const [x, y] = [a.player.season[sort.key], b.player.season[sort.key]];
      return sort.descending ? y - x : x - y;
    });
  }, [rows, sort]);

  /** Tapping a head sorts by it; tapping the sorted one turns it round.
   *
   *  Opens DESCENDING because every column is a count of something that
   *  happened, and "most" is the question — even for goals conceded, where the
   *  first tap answers "who is shipping them" before the second answers "who is
   *  not". */
  const sortBy = (key: keyof FootballPlayer["season"]) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );

  return (
    <section className={PANEL_FLUSH}>
      {/* CM's grey bevelled control, on its own strip above the table, which is
          where the game puts it (`21.jpg`, `25.jpg`). */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <label className="text-3xs font-bold uppercase text-faint" htmlFor="club-stat-view">
          View
        </label>
        <select
          id="club-stat-view"
          value={view}
          onChange={(event) => setView(event.target.value)}
          className={`${SELECT} min-w-0 flex-1 lg:max-w-52`}
        >
          {VIEWS.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {/* `cm-scroll` is CM's own bevelled bar, and it is here to be SEEN: a
          table wider than its panel that hides its own scrollbar is a table
          whose remaining columns do not exist as far as a reader knows. */}
      <div className={`cm-scroll ${SCROLL}`}>
        <table className="w-full border-collapse whitespace-nowrap">
          <caption className="sr-only">Every player, by {view}</caption>
          <thead>
            <tr className="text-3xs uppercase">
              {/* CM runs `1st 2nd 3rd` down the left of every table it draws,
                  and `squad/[teamId]/stats` runs a plain count — a board is a
                  ranking once a head is tapped, and the number is what says so. */}
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
              {measures.map((measure) => (
                <th
                  key={measure.key}
                  scope="col"
                  className="p-0 font-bold"
                  title={measure.label}
                  // On the CELL and not on the button inside it: the role that
                  // carries `aria-sort` is `columnheader`, which is the `<th>`.
                  // Without it the pressed bevel says which column orders this
                  // board and nothing says it to a screen reader — the sibling
                  // implementation in `squad/[teamId]/stats/SortHead` has always
                  // had this, and the two boards look identical.
                  aria-sort={
                    sort?.key === measure.key
                      ? sort.descending
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => sortBy(measure.key)}
                    aria-label={`Sort by ${measure.label}`}
                    className={`flex h-6 w-full items-center justify-end px-1.5 ${
                      sort?.key === measure.key
                        ? "cm-bevel-pressed"
                        : "cm-bevel hover:brightness-110"
                    }`}
                  >
                    {measure.head}
                    {sort?.key === measure.key ? (
                      <span aria-hidden className="pl-0.5 text-[0.5rem] leading-none">
                        {sort.descending ? "▼" : "▲"}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ player, position }, at) => (
              <tr key={player.id} className={`cm-row ${ROW_RULE} hover:bg-surface`}>
                <td className="cm-index numeric px-1.5 text-right">{at + 1}</td>
                {/* White, which is what CM sets a name in on every screen it
                    draws — `12.jpg`, `16.jpg` and `21.jpg`, checked. This said
                    cyan and cited the same shots for it, off a reference row
                    that had read its own images wrong. */}
                <td className={`px-1.5 ${ROW_NAME} text-ink`}>
                  <Link
                    href={`/prem/player/${player.code}`}
                    // The floor, on `StatBoard`'s precedent — the sibling board
                    // this one is otherwise a copy of. A `<td>` cannot stretch
                    // its child, so the link carries it.
                    className="cm-row flex min-h-11 items-center hover:underline"
                  >
                    {player.fullName}
                  </Link>
                </td>
                <td className="px-1.5 text-2xs text-muted">{position ?? DASH}</td>
                {measures.map((measure) => (
                  <td
                    key={measure.key}
                    className={`${BOARD_FIGURE} font-bold text-mid`}
                  >
                    {reading(player.season[measure.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

