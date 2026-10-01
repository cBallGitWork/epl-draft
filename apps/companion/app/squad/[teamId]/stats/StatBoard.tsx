"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type FootballPlayer, type PlayerStatLine, DASH, crestForShortName, toFplClubCode } from "@epl/core";
import { VIEWS, type ViewKey, measuresFor, readingOf } from "./statViews";
import { playerHref } from "../../../players/routes";
import { positionsFromList } from "../../../positions";
import { SELECT } from "../../../components/shell/ButtonLink";
import BoardKey from "../../../components/league/BoardKey";
import PositionTile from "../../../components/league/PositionTile";
import ScrollBoard from "../../../components/league/ScrollBoard";
import StateBox from "../../../components/football/StateBox";
import { doubtRow } from "../../../components/football/doubtRow";
import { HeadRow, LeadHeads, SortHead, sortedAs } from "../../../components/league/TableHeads";
import { ROW_LINK } from "../../../components/league/TableCells";
import { byFigure } from "../../../components/league/order";
import { SIDE_SHARES, standoutCuts, standoutInk } from "../../../components/league/standout";
import { BOARD, BOARD_FIGURE, MINOR_LABEL, PANEL_FLUSH, PINNED_BESIDE_TILE, PINNED_TILE, ROW_HOVER, ROW_NAME } from "@/app/desk";

// One squad's season on the house board, as a club's stat board draws it: our position in the index tile, the crest
// before the pinned name, a view picked above, a tap on a head to sort, and each column's standouts lit in ink.

/** The name column starts where the tile ends. */
const LEAD = `${PINNED_BESIDE_TILE}`;

export default function StatBoard({
  lines,
  footballers,
  names,
  scored,
}: {
  lines: readonly PlayerStatLine[];
  /** Every column the league's stat read carries, which is the categories it scores. */
  scored: readonly string[];
  /** The footballer behind each Fantrax id; absent where the bridge has not settled him, which reads as dashes. */
  footballers: Record<string, FootballPlayer>;
  /** The roster's spelling of each name, by id: Fantrax's stat rows say "Schade, Kevin". */
  names: Record<string, string>;
}) {
  const [view, setView] = useState<ViewKey>("fantasy");
  // Null is the squad's own order, the one the Squad tab prints.
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);

  const measures = measuresFor(view, new Set(scored));
  const cuts = new Map(
    measures.map((measure) => [
      measure.key,
      standoutCuts(lines.map((line) => measure.read(line, footballers[line.fantraxId]?.season)), SIDE_SHARES, { of: lines.length }),
    ]),
  );

  const rows = useMemo(() => {
    if (sort === null) return [...lines];
    const read = (line: PlayerStatLine) => readingOf(line, footballers[line.fantraxId]?.season, sort.key);
    return [...lines].sort((a, b) => byFigure(read(a), read(b), sort.descending));
  }, [lines, sort, footballers]);

  /** Opens descending, since "most" is the first question even of cards; a second tap turns it round. */
  const sortBy = (key: string) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );

  return (
    <section className={PANEL_FLUSH}>
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <label className={`${MINOR_LABEL}`} htmlFor="stat-view">
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

      <ScrollBoard className="bg-surface">
        <table className={`${BOARD} whitespace-nowrap`}>
          <thead>
            <HeadRow>
              <LeadHeads tile={PINNED_TILE} name={LEAD} />
              {measures.map((measure) => (
                <SortHead
                  key={measure.key}
                  label={measure.head}
                  title={measure.label}
                  align="right"
                  sorted={sortedAs(sort?.key === measure.key, sort?.descending ?? true)}
                  onSort={() => sortBy(measure.key)}
                />
              ))}
            </HeadRow>
          </thead>

          <tbody>
            {rows.map((line) => {
              const footballer = footballers[line.fantraxId] ?? null;
              const crest = line.clubShort ? crestForShortName(toFplClubCode(line.clubShort)) : null;
              return (
                <tr key={line.fantraxId} className={`cm-row ${ROW_HOVER} ${doubtRow(footballer)}`}>
                  <PositionTile positions={positionsFromList(line.position)} cell className={PINNED_TILE} />
                  <td className={`px-1.5 ${ROW_NAME} ${LEAD} text-ink ${doubtRow(footballer)}`}>
                    <Link href={playerHref(line.fantraxId)} className={`${ROW_LINK} w-36 lg:w-auto`}>
                      <span className="grid size-6 shrink-0 place-items-center">
                        {crest ? <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
                      </span>
                      <span className="truncate">{names[line.fantraxId] ?? line.name}</span>
                      <StateBox player={footballer} />
                    </Link>
                  </td>
                  {measures.map((measure) => {
                    const value = measure.read(line, footballer?.season);
                    // A dash where he has no reading; a played nought is a figure like any other, in ink.
                    const ink =
                      value === null
                        ? "text-faint"
                        : standoutInk(value, cuts.get(measure.key), measure.worse ? "low" : "high") || "text-ink";
                    return (
                      <td key={measure.key} className={`${BOARD_FIGURE} ${ink}`}>
                        {value === null ? DASH : measure.decimals ? value.toFixed(2) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollBoard>

      <BoardKey entries={measures.map((measure) => ({ label: measure.head, title: measure.label }))} />
    </section>
  );
}
