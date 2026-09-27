"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FootballPlayer } from "@epl/core";
import { SELECT } from "../../../../components/shell/ButtonLink";
import { VIEWS, reading } from "./measures";
import {
  BOARD_FIGURE,
  HEAD_CELL,
  PANEL_FLUSH,
  PINNED_NAME,
  PINNED_TILE,
  ROW_NAME,
  ROW_HOVER,
  MINOR_CAPS,
} from "@/app/desk";
import { MUTE, SortArrow, HeadRow } from "../../../../components/league/TableHeads";
import PositionTile, { TILE_WIDTH } from "../../../../components/league/PositionTile";
import ScrollBoard from "../../../../components/league/ScrollBoard";
import { standoutCuts, standoutInk } from "../../../../components/league/standout";
import StateBox from "../../../../components/football/StateBox";
import { doubtRow } from "../../../../components/football/doubtRow";

// A club's season, player by player, on the house board: our position in the index tile, the
// name pinned beside it, standouts lit, doubts washed. It replaced a leaders board: sorted by
// goals, the first row IS the top scorer.
//
// Client only because sorting is a tap here rather than a link. That is the
// difference from `/league` and `/prem`, whose sort survives being shared
// because a whole page is one table; this is a tab inside a club, and a query
// string on it would have to carry the club too.

export interface Row {
  player: FootballPlayer;
  /** What our league files him at; empty when Fantrax has no opinion or would not answer. */
  positions: readonly string[];
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
  // Each column's standouts among the men who have played, as a match board lights them.
  const played = rows.filter((row) => row.player.season.minutes > 0).length;
  const cuts = new Map(
    measures.map((measure) => [
      measure.key,
      standoutCuts(rows.map((row) => row.player.season[measure.key]), SHARES, { of: played }),
    ]),
  );

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
        <label className={`${MINOR_CAPS} text-faint`} htmlFor="club-stat-view">
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

      <ScrollBoard>
        <table className="w-full border-collapse whitespace-nowrap">
          <caption className="sr-only">Every player, by {view}</caption>
          <thead>
            <HeadRow>
              <th scope="col" className={`${HEAD_CELL} ${PINNED_TILE} ${TILE_WIDTH} bg-surface`}>
                <span className={MUTE}>Fantrax position</span>
              </th>
              <th scope="col" className={`${HEAD_CELL} ${PINNED_NAME} left-10 lg:left-14`}>
                <span className={MUTE}>Player</span>
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
                      <SortArrow down={sort.descending} className="pl-0.5" />
                    ) : null}
                  </button>
                </th>
              ))}
            </HeadRow>
          </thead>
          <tbody>
            {ordered.map(({ player, positions }) => (
              <tr key={player.id} className={`cm-row ${ROW_HOVER} ${doubtRow(player)}`}>
                <PositionTile positions={positions} cell className={PINNED_TILE} />
                <td className={`px-1.5 ${ROW_NAME} ${PINNED_NAME} left-10 text-ink lg:left-14 ${doubtRow(player)}`}>
                  <Link href={`/prem/player/${player.code}`} className="cm-row flex min-h-11 w-36 items-center gap-2 hover:underline lg:w-auto">
                    <span className="truncate">{player.fullName}</span>
                    <StateBox player={player} />
                  </Link>
                </td>
                {measures.map((measure) => {
                  const value = player.season[measure.key];
                  const ink = standoutInk(value, cuts.get(measure.key), measure.worse ? "low" : "high");
                  return (
                    <td key={measure.key} className={`${BOARD_FIGURE} ${ink || (value === 0 ? "text-muted" : "text-ink")}`}>
                      {reading(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </section>
  );
}

/** A column's orange for its best tenth and yellow for its top fifth, as a match board lights them. */
const SHARES = { good: 0.2, best: 0.1 };
