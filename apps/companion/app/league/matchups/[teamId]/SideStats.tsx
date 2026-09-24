import type { CSSProperties } from "react";
import Image from "next/image";
import { type LeagueTeam, type LineupDetail, type ScoringCategory, type SquadPlayerDetail, crestUrl, inkOn, playerName, teamColours, DASH } from "@epl/core";
import type { SubMark } from "../../../components/football/SubMarker";
import Section from "../../../components/shell/Section";
import PositionTile, { TILE_WIDTH } from "../../../components/league/PositionTile";
import { ROW_LINK } from "../../../components/league/TableCells";
import { MUTE, SortHead } from "../../../components/league/TableHeads";
import { BOARD, EDGE_FADE, HEAD_CELL, ROW_FIGURE, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";
import { MaybeCard } from "../../../prem/match/[id]/PlayerCardButton";
import { MATCH_ROW } from "../../../prem/match/[id]/matchRow";
import { figureOf, sideRows, type Counts } from "./sideRows";
import { DEFAULT_SIDE_SORT } from "./views";

// One manager's fifteen in the match page's club board (`prem/match/[id]/ClubStats`): his colours on the
// position tiles, each man's club crest, Fantrax's points, then what he did in each of the league's categories.

export default function SideStats({
  team,
  sheet,
  columns,
  counts,
  subs,
  sort,
  hrefFor,
}: {
  team: LeagueTeam;
  sheet: LineupDetail;
  columns: readonly ScoringCategory[];
  counts: Counts;
  subs: Readonly<Record<string, SubMark>>;
  sort: { head: string; descending: boolean };
  /** The same board ordered by one column, with that column's default direction. */
  hrefFor: (head: string) => string;
}) {
  const { eleven, bench } = sideRows(sheet, counts, sort);
  const heads = [{ code: DEFAULT_SIDE_SORT, name: "Fantrax points" }, ...columns];
  const row = (player: SquadPlayerDetail, reserve: boolean) => (
    <SideRow
      key={player.rostered.slot.fantraxId}
      player={player}
      heads={heads}
      counts={counts}
      sub={subs[player.rostered.slot.fantraxId]}
      reserve={reserve}
    />
  );

  return (
    <Section>
      <div className="relative">
        <span aria-hidden className={EDGE_FADE} />
        <div className={`${SCROLL} cm-scroll cm-index-scoped bg-surface`} style={managerIndex(team)}>
          <table className={BOARD}>
            <thead>
              <tr>
                <th className={`${HEAD_CELL} ${PIN_TILE} ${TILE_WIDTH} bg-surface`}>
                  <span className={MUTE}>Fantrax position</span>
                </th>
                <th className={`${HEAD_CELL} ${PIN_NAME} ${NAME_WIDTH}`}>
                  <span className={MUTE}>Player</span>
                </th>
                {heads.map((head) => (
                  <SortHead
                    key={head.code}
                    width=""
                    title={head.name}
                    href={hrefFor(head.code)}
                    label={head.code}
                    sorted={head.code === sort.head ? (sort.descending ? "descending" : "ascending") : undefined}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {eleven.map((player) => row(player, false))}
              {bench.length === 0 ? null : (
                <>
                  <tr>
                    <th
                      scope="rowgroup"
                      colSpan={heads.length + 2}
                      className="cm-bevel h-6 px-1.5 text-left text-2xs font-bold uppercase"
                    >
                      Bench · not counted
                    </th>
                  </tr>
                  {bench.map((player) => row(player, true))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

function SideRow({
  player,
  heads,
  counts,
  sub,
  reserve,
}: {
  player: SquadPlayerDetail;
  heads: readonly ScoringCategory[];
  counts: Counts;
  sub: SubMark | undefined;
  reserve: boolean;
}) {
  const { rostered, club } = player;
  return (
    <tr className={`${ROW_RULE} ${reserve ? "cm-out" : ""}`} {...MATCH_ROW}>
      <PositionTile positions={rostered.slot.position ? [rostered.slot.position] : []} cell className={PIN_TILE} />
      <td className={`p-0 ${PIN_NAME} ${NAME_WIDTH}`}>
        <MaybeCard player={player} className={`${ROW_LINK} ${PHONE_ROW} w-full gap-1.5 px-1.5 text-left`}>
          <span className="grid size-5 shrink-0 place-items-center">
            {club ? <Image src={crestUrl(club)} alt="" width={20} height={20} className="size-5 object-contain" /> : null}
          </span>
          <span className={`min-w-0 truncate ${ROW_NAME}`}>{playerName(rostered)}</span>
          {sub === undefined ? null : (
            <span className="numeric ml-auto hidden shrink-0 whitespace-nowrap pl-2 text-xs font-bold text-mid lg:inline lg:text-sm">
              {sub.off ? `sub off ${sub.minute}'` : `sub on ${sub.minute}'`}
            </span>
          )}
        </MaybeCard>
      </td>
      {heads.map((head) => {
        const value = figureOf(player, head.code, counts);
        const points = head.code === DEFAULT_SIDE_SORT;
        return (
          <td key={head.code} className={`${FIGURE_CELL} ${points && value !== null && !reserve ? "font-bold text-info" : ""}`}>
            {value === null ? <span className="text-faint">{DASH}</span> : value}
          </td>
        );
      })}
    </tr>
  );
}

/** CM's index block in the manager's colours, with the ink that reads on them (`cm-index-scoped` keeps the contrast). */
function managerIndex(team: LeagueTeam): CSSProperties {
  const colours = teamColours(team.teamId);
  return { "--cm-index": colours.primary, "--cm-index-ink": inkOn(colours) } as CSSProperties;
}

// The match page's club board's cells, copied rather than shared: two boards so far (`ClubStats` is the other).
const FIGURE_CELL = `numeric px-1.5 text-center ${ROW_FIGURE}`;
const PHONE_ROW = "max-lg:min-h-9";
const PIN_TILE = "sticky left-0 z-10";
const PIN_NAME = "sticky left-10 z-10 border-r border-line bg-surface lg:left-14";
const NAME_WIDTH = "w-32 lg:w-72";
