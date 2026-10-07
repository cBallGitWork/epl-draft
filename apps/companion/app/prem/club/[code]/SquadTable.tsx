import ScrollBoard from "../../../components/league/ScrollBoard";
import type { FootballPlayer } from "@epl/core";
import { availabilityOf, byPositionDepth, fullFootballerName, positionDepth, DASH } from "@epl/core";
import PlayerName from "../../../components/shell/PlayerName";
import { Head, HeadRow, NameHead, PLATE } from "../../../components/league/TableHeads";
import PositionTile, { TILE_WIDTH } from "../../../components/league/PositionTile";
import StateBox from "../../../components/football/StateBox";
import { doubtRow } from "../../../components/football/doubtRow";
import { poolHref } from "../../poolHref";
import NameLink from "./NameLink";
import type { LeagueOpinion } from "../../leagueOpinions";
import { BOARD, DESK_ONLY, FIGURE, ROW_NAME, ROW_HOVER } from "@/app/desk";

// Every man on the club's books, ordered by the position our league files him at (Craig, 3 Sep 2026).
// The owner column is a name, never a figure: FPL's counts may not stand beside a Fantrax figure.

export default function SquadTable({
  players,
  league,
}: {
  /** Already ordered by the page. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  /** Our league's opinion by FPL code, empty when Fantrax would not say. */
  league: ReadonlyMap<number, LeagueOpinion>;
}) {
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <caption className="sr-only">
          The club&apos;s squad, ordered by the position our league files each man at
        </caption>
        <thead>
          <HeadRow>
            {/* Our Fantrax position in CM's index block, in place of a position column (Craig, 23 Sep 2026). */}
            <Head width={TILE_WIDTH} title="What our Fantrax league will field him as — not a fact about the footballer">
              <span className={PLATE}>Pos</span>
            </Head>
            <NameHead label="Player" />
            <Head width="w-20 lg:w-32" title="Who holds him in our league">
              <span className={PLATE}>Owner</span>
            </Head>
            <Head width="w-12 lg:w-20" title="Minutes played">
              <span className={PLATE}>Min</span>
            </Head>
            <Head width="hidden w-9 lg:table-cell lg:w-16" title="Starts">
              <span className={PLATE}>St</span>
            </Head>
            <Head width="hidden w-8 lg:table-cell lg:w-16" title="Goals">
              <span className={PLATE}>G</span>
            </Head>
            <Head width="hidden w-8 lg:table-cell lg:w-16" title="Assists">
              <span className={PLATE}>A</span>
            </Head>
          </HeadRow>
        </thead>
        <tbody>
          {players.map((player) => {
            // `cm-out` greys the row as a colour rule, which `desk.css` pairs with the doubt wash.
            const dim = availabilityOf(player).out ? "cm-out" : "";
            const opinion = league.get(player.code);

            return (
              <tr key={player.id} className={`${ROW_HOVER} ${dim} ${doubtRow(player)}`}>
                {/* A plate owns its ink, so an unavailable man's tile keeps it; the rest of the row greys. */}
                <PositionTile positions={opinion?.positions ?? []} cell />
                <td className="w-full max-w-0 pl-2">
                  <NameLink
                    href={poolHref(league, player.code)}
                    className="cm-row flex min-h-11 items-center gap-2 font-bold"
                  >
                    {/* Full name (Craig, 3 Sep 2026): FPL's `name` is its web short form, "J.Timber". */}
                    <span className={`min-w-0 truncate ${ROW_NAME}`}><PlayerName name={player.fullName} short={fullFootballerName(player)} /></span>
                    <StateBox player={player} />
                  </NameLink>
                </td>
                {/* The owner, or Fantrax's own letters: "WW" on waivers, "FA" a free agent. */}
                <td className="px-1.5 text-center text-2xs text-ink">
                  <span className="block truncate">{owner(opinion) ?? DASH}</span>
                </td>
                <td className={`${FIGURE} text-ink`}>{player.season.minutes}</td>
                <td className={`${FIGURE} ${DESK_ONLY} text-ink`}>
                  {player.season.starts}
                </td>
                <td className={`${FIGURE} ${DESK_ONLY} text-mid`}>
                  {player.season.goals}
                </td>
                <td className={`${FIGURE} ${DESK_ONLY} text-mid`}>
                  {player.season.assists}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollBoard>
  );
}

/** Who holds him, or the state our league puts him in instead. */
function owner(opinion: LeagueOpinion | undefined): string | null {
  if (opinion === undefined) return null;
  return opinion.owner ?? (opinion.status || null);
}

/** Our league's position for a man as a sort key; a man it has no opinion about sorts last. */
export function fantasyDepth(opinion: LeagueOpinion | undefined): number {
  const first = [...(opinion?.positions ?? [])].sort(byPositionDepth)[0];
  return first === undefined ? Number.MAX_SAFE_INTEGER : positionDepth(first);
}

