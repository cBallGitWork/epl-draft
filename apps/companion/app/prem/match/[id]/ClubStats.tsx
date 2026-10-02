import { fixed, loggedPlayers, DASH } from "@epl/core";
import { clubIndex } from "../../../components/football/clubIndex";
import type { Club, PlManMatch, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import { fantraxPositions, type LeagueOpinion } from "../../leagueOpinions";
import Section from "../../../components/shell/Section";
import PositionTile from "../../../components/league/PositionTile";
import { ROW_LINK } from "../../../components/league/TableCells";
import { HeadRow, LeadHeads, sortedAs, SortHead } from "../../../components/league/TableHeads";
import { BOARD, FIGURE_CELL, PINNED_BESIDE_TILE, PINNED_TILE, ROW_NAME, ROW_RULE } from "@/app/desk";
import ScrollBoard from "../../../components/league/ScrollBoard";
import { MaybeCard } from "./PlayerCardButton";
import SubNote from "./SubNote";
import { COLUMNS, sorted, type StatLine, type StatSort } from "./statColumns";
import { SIDE_SHARES, standoutCuts, standoutInk, type StandoutCut } from "../../../components/league/standout";
import { statsHref } from "./statsSort";
import { appeared, cameOn, ordered, type Named } from "./sheetJoin";
import { sheetName, type Match } from "./match";
import { MATCH_ROW } from "./matchRow";

// One club's men and what each did — CM 01/02's `Roma Stats` foot screen, ranked by fantasy points.

interface Row extends StatLine {
  named: Named;
}

/** Each ranked column's two cuts, by head. */
type StandoutCuts = ReadonlyMap<string, StandoutCut>;

export default function ClubStats({
  match,
  side,
  club,
  sheet,
  events,
  injured,
  league,
  cards,
  sort,
  descending,
}: {
  match: Match;
  side: "home" | "away";
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  injured: ReadonlyMap<number, number>;
  /** Our league's view of each man, by FPL code: his eligibility and his Fantrax id. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** Each man's player card, by FPL code. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  sort: StatSort;
  descending: boolean;
}) {
  const logged = loggedPlayers(match.logged);
  const lines = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  // Ties keep the sheet's order, with the bench's men who got on above the ones who sat.
  const onSheet = ordered(sheet, events);
  const inSheetOrder = [
    ...onSheet.filter((row) => !row.bench),
    ...onSheet.filter((row) => row.bench && cameOn(row)),
    ...onSheet.filter((row) => row.bench && !cameOn(row)),
  ].map((row): Row => {
    const id = row.man.code === null ? undefined : match.byCode.get(row.man.code)?.id;
    return {
      named: row,
      line: id === undefined ? undefined : lines.get(id),
      stats: id === undefined ? undefined : match.figures.get(id),
      logged: row.man.code === null ? undefined : logged.get(row.man.code),
    };
  });
  const rows = sorted(inSheetOrder, sort, descending);
  const appearances = inSheetOrder.filter((row) => appeared(row.named));
  const cuts: StandoutCuts = new Map(
    COLUMNS.filter((column) => "rank" in column).map((column) => {
      const values = appearances.map((row) => column.of(row));
      return [column.head, standoutCuts(values, SIDE_SHARES, { of: appearances.length })];
    }),
  );

  return (
    <Section>
      <ScrollBoard className="cm-index-scoped bg-surface" style={clubIndex(club)}>
        <table className={BOARD}>
          <thead>
            <HeadRow>
              <LeadHeads tile={PINNED_TILE} name={`${PINNED_BESIDE_TILE} ${NAME_WIDTH}`} />
              {COLUMNS.map((column) => (
                <SortHead
                  key={column.head}
                  title={column.title}
                  href={statsHref(match.fixture.id, side, column.head, sort, descending)}
                  label={column.head}
                  sorted={sortedAs(column.head === sort, descending)}
                />
              ))}
            </HeadRow>
          </thead>
          <tbody>
            {rows.map((row, at) => (
              <StatRow
                key={`${row.named.man.code ?? row.named.man.name}-${at}`}
                row={row}
                match={match}
                card={row.named.man.code === null ? undefined : cards.get(row.named.man.code)}
                cuts={cuts}
                positions={fantraxPositions(league, row.named.man.code)}
                hurt={row.named.man.code !== null && injured.has(row.named.man.code)}
              />
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </Section>
  );
}

function StatRow({
  row,
  match,
  card,
  cuts,
  positions,
  hurt,
}: {
  row: Row;
  match: Match;
  card: SquadPlayerDetail | undefined;
  cuts: StandoutCuts;
  positions: readonly string[];
  hurt: boolean;
}) {
  const { man, did } = row.named;
  const played = appeared(row.named);
  // Grey is "not on the pitch at the whistle", the team sheet's own rule.
  const finished = played && did?.offAt == null;
  const name = (
    <>
      <span className={`min-w-0 truncate ${ROW_NAME}`}>
        <span className="lg:hidden">{sheetName(man, match.byCode)}</span>
        <span className="hidden lg:inline">{man.name}</span>
      </span>
      {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
      <SubNote onAt={did?.onAt} offAt={did?.offAt} hurt={hurt} className="hidden lg:inline" />
    </>
  );

  return (
    <tr className={`${ROW_RULE} ${finished ? "" : "cm-out"}`} {...MATCH_ROW}>
      <PositionTile positions={positions} cell className={PINNED_TILE} />
      <td className={`p-0 ${PINNED_BESIDE_TILE} ${NAME_WIDTH}`}>
        {/* His card, not his page — every name on a match screen opens the same card (Craig, 23 Sep 2026). */}
        <MaybeCard player={card} className={`${ROW_LINK} ${PHONE_ROW} w-full gap-1.5 px-1.5 text-left`}>
          {name}
        </MaybeCard>
      </td>
      {COLUMNS.map((column) => {
        const value = column.of(row);
        const kind = ("kind" in column ? column.kind : undefined) ?? "count";
        const ink =
          !played || value === null
            ? ""
            : "rank" in column
              ? standoutInk(value, cuts.get(column.head), column.rank)
              : "derived" in column
                ? "font-bold text-info"
                : "";
        return (
          <td key={column.head} className={`${FIGURE_CELL} ${ink}`}>
            {value === null || !played ? <span className="text-faint">{DASH}</span> : fixed(value, kind)}
          </td>
        );
      })}
    </tr>
  );
}

/** Centred under its head, the way CM sets a column. */

/** 36px under a thumb, not 44 — PRODUCT's recorded exception for the match screens. */
const PHONE_ROW = "max-lg:min-h-9";

/** About four measures in view beside the name at 390; the sub note joins it on a desk. */
const NAME_WIDTH = "w-32 lg:w-72";
