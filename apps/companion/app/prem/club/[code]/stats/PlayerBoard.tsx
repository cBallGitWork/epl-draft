"use client";

import { useMemo, useState } from "react";
import NameLink from "../NameLink";
import { fullFootballerName, type FootballPlayer } from "@epl/core";
import { SELECT } from "../../../../components/shell/ButtonLink";
import { VIEWS, reading } from "./measures";
import { FIGURE_CELL, MINOR_LABEL, PANEL_FLUSH, PINNED_BESIDE_TILE, PINNED_TILE, ROW_HOVER, ROW_NAME } from "@/app/desk";
import { HeadRow, LeadHeads, SortHead, sortedAs } from "../../../../components/league/TableHeads";
import PositionTile from "../../../../components/league/PositionTile";
import ScrollBoard from "../../../../components/league/ScrollBoard";
import { SIDE_SHARES, standoutCuts, standoutInk } from "../../../../components/league/standout";
import StateBox from "../../../../components/football/StateBox";
import PlayerName from "../../../../components/shell/PlayerName";
import { doubtRow } from "../../../../components/football/doubtRow";

// A club's season, player by player: our position in the tile, standouts lit, doubts washed.
// Client only because sorting is a tap here: a shared query string would have to carry the club too.

export interface Row {
  player: FootballPlayer;
  /** What our league files him at; empty when Fantrax has no opinion or would not answer. */
  positions: readonly string[];
  /** His own page, or null when our league does not list him. */
  href: string | null;
}

export default function PlayerBoard({ rows }: { rows: readonly Row[] }) {
  const [view, setView] = useState(VIEWS[0]?.key ?? "attack");
  // Null keeps the page's order, keeper first by our league's position, rather than a default sort.
  const [sort, setSort] = useState<{ key: keyof FootballPlayer["season"]; descending: boolean } | null>(
    null,
  );

  const measures = VIEWS.find((entry) => entry.key === view)?.measures ?? [];
  // Each column's standouts among the men who have played, as a match board lights them.
  const played = rows.filter((row) => row.player.season.minutes > 0).length;
  const cuts = new Map(
    measures.map((measure) => [
      measure.key,
      standoutCuts(rows.map((row) => row.player.season[measure.key]), SIDE_SHARES, { of: played }),
    ]),
  );

  const ordered = useMemo(() => {
    if (sort === null) return [...rows];
    return [...rows].sort((a, b) => {
      const [x, y] = [a.player.season[sort.key], b.player.season[sort.key]];
      return sort.descending ? y - x : x - y;
    });
  }, [rows, sort]);

  /** Tapping a head sorts by it, most first; tapping the sorted one turns it round. */
  const sortBy = (key: keyof FootballPlayer["season"]) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );

  return (
    <section className={PANEL_FLUSH}>
      {/* CM's grey bevelled control, on its own strip above the table, which is
          where the game puts it (`21.jpg`, `25.jpg`). */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <label className={`${MINOR_LABEL}`} htmlFor="club-stat-view">
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

      <ScrollBoard className="bg-surface">
        <table className="w-full border-collapse whitespace-nowrap">
          <caption className="sr-only">Every player, by {view}</caption>
          <thead>
            <HeadRow>
              <LeadHeads tile={PINNED_TILE} name={PINNED_BESIDE_TILE} />
              {measures.map((measure) => (
                <SortHead
                  key={measure.key}
                  label={measure.head}
                  title={measure.label}
                  sorted={sortedAs(sort?.key === measure.key, sort?.descending ?? true)}
                  onSort={() => sortBy(measure.key)}
                />
              ))}
            </HeadRow>
          </thead>
          <tbody>
            {ordered.map(({ player, positions, href }) => (
              <tr key={player.id} className={`cm-row ${ROW_HOVER} ${doubtRow(player)}`}>
                <PositionTile positions={positions} cell className={PINNED_TILE} />
                <td className={`px-1.5 ${ROW_NAME} ${PINNED_BESIDE_TILE} text-ink ${doubtRow(player)}`}>
                  <NameLink href={href} className="cm-row flex min-h-11 w-36 items-center gap-2 lg:w-auto">
                    <span className="truncate"><PlayerName name={player.fullName} short={fullFootballerName(player)} /></span>
                    <StateBox player={player} />
                  </NameLink>
                </td>
                {measures.map((measure) => {
                  const value = player.season[measure.key];
                  const ink = standoutInk(value, cuts.get(measure.key), measure.worse ? "low" : "high");
                  return (
                    <td key={measure.key} className={`${FIGURE_CELL} ${ink || (value === 0 ? "text-muted" : "text-ink")}`}>
                      {reading(measure, value)}
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

