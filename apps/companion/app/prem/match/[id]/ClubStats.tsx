import type { CSSProperties } from "react";
import { clubColours, inkOn, loggedPlayers, DASH } from "@epl/core";
import type { Club, PlManMatch, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import type { LeagueOpinion } from "../../club/[code]/club";
import Section from "../../../components/shell/Section";
import PositionTile from "../../../components/league/PositionTile";
import { ROW_LINK } from "../../../components/league/TableCells";
import { MUTE, SortHead } from "../../../components/league/TableHeads";
import { BOARD, HEAD_CELL, ROW_FIGURE, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";
import { MaybeCard } from "./PlayerCardButton";
import SubNote from "./SubNote";
import { COLUMNS, STANDOUT, sorted, standoutCut, type StatLine, type StatSort } from "./statColumns";
import { statsHref } from "./statsSort";
import { ordered, type Named } from "./sheetJoin";
import { sheetName, type Match } from "./match";

// One club's men and what each did — CM 01/02's `Roma Stats` foot screen, ranked by fantasy points.

interface Row extends StatLine {
  named: Named;
}

/** Each ranked column's two cuts: yellow from `good`, orange from `best`. */
type Cuts = ReadonlyMap<string, { good: number | null; best: number | null }>;

export default function ClubStats({
  match,
  side,
  club,
  sheet,
  events,
  injured,
  league,
  men,
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
  men: ReadonlyMap<number, SquadPlayerDetail>;
  sort: StatSort;
  descending: boolean;
}) {
  const logged = loggedPlayers(match.logged);
  const lines = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  // Ties keep the sheet's order, with the bench's men who got on above the ones who sat.
  const sheetOrder = ordered(sheet, events);
  const cameOn = (row: Named) => row.did?.onAt != null;
  const named = [
    ...sheetOrder.filter((row) => !row.bench),
    ...sheetOrder.filter((row) => row.bench && cameOn(row)),
    ...sheetOrder.filter((row) => row.bench && !cameOn(row)),
  ].map((row): Row => {
    const id = row.man.code === null ? undefined : match.byCode.get(row.man.code)?.id;
    return {
      named: row,
      line: id === undefined ? undefined : lines.get(id),
      stats: id === undefined ? undefined : match.figures.get(id),
      logged: row.man.code === null ? undefined : logged.get(row.man.code),
    };
  });
  const rows = sorted(named, sort, descending);
  const colours = clubColours(club?.shortName ?? "");
  const played = named.filter((row) => !row.named.bench || cameOn(row.named));
  const cuts: Cuts = new Map(
    COLUMNS.filter((column) => "rank" in column).map((column) => {
      const values = played.map((row) => column.of(row));
      return [
        column.head,
        {
          good: standoutCut(values, played.length, STANDOUT.good),
          best: standoutCut(values, played.length, STANDOUT.best),
        },
      ];
    }),
  );

  return (
    <Section>
      {/* Opaque, so the pinned name hides the figures scrolling under it; CM's bar says there is more to the right,
          and on a phone a fade at the right edge says so before the bar is in view (Craig, 23 Sep 2026). */}
      <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-surface lg:hidden" />
      <div
        className={`${SCROLL} cm-scroll cm-index-scoped bg-surface`}
        style={{ "--cm-index": colours.primary, "--cm-index-ink": inkOn(colours) } as CSSProperties}
      >
        <table className={BOARD}>
          <thead>
            <tr>
              {/* No plate over the tile and the name — CM's own board heads only its figures. */}
              <th className={`${HEAD_CELL} ${PIN_TILE} bg-surface`}>
                <span className={MUTE}>Fantrax position</span>
              </th>
              <th className={`${HEAD_CELL} ${PIN_NAME} ${NAME_WIDTH}`}>
                <span className={MUTE}>Player</span>
              </th>
              {COLUMNS.map((column) => (
                <SortHead
                  key={column.head}
                  width=""
                  title={column.title}
                  href={statsHref(match.fixture.id, side, column.head, sort, descending)}
                  label={column.head}
                  sorted={column.head === sort ? (descending ? "descending" : "ascending") : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, at) => (
              <StatRow
                key={`${row.named.man.code ?? row.named.man.name}-${at}`}
                row={row}
                match={match}
                card={row.named.man.code === null ? undefined : men.get(row.named.man.code)}
                cuts={cuts}
                positions={row.named.man.code === null ? [] : (league.get(row.named.man.code)?.positions ?? [])}
                hurt={row.named.man.code !== null && injured.has(row.named.man.code)}
              />
            ))}
          </tbody>
        </table>
      </div>
      </div>
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
  cuts: Cuts;
  positions: readonly string[];
  hurt: boolean;
}) {
  const { man, did, bench } = row.named;
  const played = !bench || did?.onAt != null;
  // Grey is "not on the pitch at the whistle", the team sheet's own rule.
  const finished = played && did?.offAt == null;
  const name = (
    <>
      <span className={`min-w-0 truncate ${ROW_NAME}`}>
        <span className="lg:hidden">{sheetName(man, match.byCode)}</span>
        <span className="hidden lg:inline">{man.name}</span>
      </span>
      {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
      <SubNote did={did} hurt={hurt} className="hidden lg:inline" />
    </>
  );

  return (
    <tr className={`${ROW_RULE} ${finished ? "" : "cm-out"}`} data-tap-exception="match-row">
      <PositionTile positions={positions} cell className={PIN_TILE} />
      <td className={`p-0 ${PIN_NAME} ${NAME_WIDTH}`}>
        {/* His card, not his page — every name on a match screen opens the same card (Craig, 23 Sep 2026). */}
        <MaybeCard player={card} className={`${ROW_LINK} ${PHONE_ROW} w-full gap-1.5 px-1.5 text-left`}>
          {name}
        </MaybeCard>
      </td>
      {COLUMNS.map((column) => {
        const value = column.of(row);
        const dp = "dp" in column ? column.dp : 0;
        const ink =
          !played || value === null
            ? ""
            : "rank" in column
              ? lit(value, cuts.get(column.head), column.rank)
              : "derived" in column
                ? "font-bold text-info"
                : "";
        return (
          <td key={column.head} className={`${FIGURE_CELL} ${ink}`}>
            {value === null || !played ? <span className="text-faint">{DASH}</span> : value.toFixed(dp)}
          </td>
        );
      })}
    </tr>
  );
}

/** CM's inks for a standout: orange for the column's best, yellow for the rest, red at the bad end (DESIGN §3). */
function lit(
  value: number,
  cut: { good: number | null; best: number | null } | undefined,
  rank: "high" | "low",
): string {
  if (cut?.good == null || value < cut.good) return "";
  if (rank === "low") return "cm-lit-bad font-bold text-bad";
  return cut.best !== null && value >= cut.best
    ? "cm-lit-best font-bold text-peak"
    : "cm-lit-good font-bold text-accent";
}

/** Centred under its head, the way CM sets a column. */
const FIGURE_CELL = `numeric px-1.5 text-center ${ROW_FIGURE}`;

/** 36px under a thumb, not 44 — PRODUCT's recorded exception for the match screens. */
const PHONE_ROW = "max-lg:min-h-9";

/** The tile and the name both stay put while the measures scroll under them at 390. The tile is
 *  held at its full width, or the name's fixed offset leaves a hole between them. */
const PIN_TILE = "sticky left-0 z-10 w-10 min-w-10 lg:w-14 lg:min-w-14";
const PIN_NAME = "sticky left-10 z-10 border-r border-line bg-surface lg:left-14";

/** About four measures in view beside the name at 390; the sub note joins it on a desk. */
const NAME_WIDTH = "w-32 lg:w-72";
