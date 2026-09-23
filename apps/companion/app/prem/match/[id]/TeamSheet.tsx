import type { Club, PlManMatch, PlTeamSheet, PlayerOwner, SquadPlayerDetail } from "@epl/core";
import { TILE_WIDTH } from "../../../components/league/PositionTile";
import { clubIndex } from "../../../components/football/clubIndex";
import { BOARD, PANEL_FLUSH, phoneShows } from "@/app/desk";
import { Head, HeadRow, MUTE, PLATE } from "../../../components/league/TableHeads";
import type { Match } from "./match";
import SheetRow from "./SheetRow";
import { joinOf, ordered, type Join } from "./sheetJoin";
import type { LeagueOpinion } from "../../leagueOpinions";

// Championship Manager's team sheet, `cm9900/16.jpg`, both sides at once — stacked under a thumb, paired on a desk.

interface SheetProps {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  /** Who went off hurt, by FPL code — the commentary is the only place that says so. */
  injured: ReadonlyMap<number, number>;
  /** Our league's view of each man, by FPL code: his eligibility and his Fantrax id. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** Each man's player card, by FPL code. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  /** The one club a phone shows; a desk shows both. */
  phoneSide: "home" | "away";
}

export default function TeamSheet({ match, sheets, phoneSide, ...rest }: SheetProps) {
  const join = joinOf(match);
  // `min-w-0` down the chain, or a nowrap plate sets a floor that overflows 390.
  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-2">
      <Side club={match.home} sheet={sheets.home} join={join} phonePicked={phoneSide === "home"} {...rest} />
      <Side club={match.away} sheet={sheets.away} join={join} phonePicked={phoneSide === "away"} {...rest} />
    </div>
  );
}

function Side({
  club,
  sheet,
  events,
  owners,
  join,
  injured,
  league,
  cards,
  phonePicked,
}: Omit<SheetProps, "match" | "sheets" | "phoneSide"> & {
  club: Club | undefined;
  sheet: PlTeamSheet;
  join: Join;
  phonePicked: boolean;
}) {
  const rows = ordered(sheet, events);
  const bench = rows.findIndex((row) => row.bench);

  return (
    // The club's colour on every index block; `cm-index-scoped` keeps the contrast `desk.css` measured.
    <section
      className={`${PANEL_FLUSH} cm-index-scoped min-w-0 ${phoneShows(phonePicked)}`}
      style={clubIndex(club)}
    >
      {/* `table-fixed` so the name truncates; the widths go on the HEAD row, which is the one a fixed table reads. */}
      <table className={`${BOARD} table-fixed`}>
        <thead>
          <HeadRow>
            {/* Only the figure is headed (Craig, 23 Sep 2026: *"remove them all except for PTS"*). */}
            <Head width={TILE_WIDTH}>
              <span className={MUTE}>Fantrax position</span>
            </Head>
            <Head width="w-3">
              <span className={MUTE}>Card</span>
            </Head>
            <Head width="">
              <span className={MUTE}>Player and manager</span>
            </Head>
            <Head width="w-9 lg:w-16">
              <span className={MUTE}>Goals and cards</span>
            </Head>
            {/* FPL's own points for this fixture, so `Pts` and never Fantrax's `FPts`. */}
            <Head width="w-10 lg:w-12" title="FPL's own points for this fixture">
              <span className={`${PLATE} px-0`}>Pts</span>
            </Head>
          </HeadRow>
        </thead>
        <tbody>
          {rows.map((row, at) => (
            <SheetRow
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              owner={row.man.code === null ? undefined : owners.get(row.man.code)}
              positions={row.man.code === null ? [] : (league.get(row.man.code)?.positions ?? [])}
              join={join}
              card={row.man.code === null ? undefined : cards.get(row.man.code)}
              hurt={row.man.code !== null && injured.has(row.man.code)}
              opensBench={at === bench}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}
