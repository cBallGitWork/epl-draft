import ScrollBoard from "../../../components/league/ScrollBoard";
import Link from "next/link";
import type { FootballPlayer } from "@epl/core";
import { availabilityOf, positionDepth, DASH } from "@epl/core";
import { Head, HeadRow, NameHead, PLATE } from "../../../components/league/TableHeads";
import PositionTile, { TILE_WIDTH } from "../../../components/league/PositionTile";
import StateBox from "../../../components/football/StateBox";
import { doubtRow } from "../../../components/football/doubtRow";
import { PLAYER } from "../../routes";
import type { LeagueOpinion } from "../../leagueOpinions";
import { BOARD, DESK_ONLY, FIGURE, ROW_NAME, ROW_HOVER } from "@/app/desk";

// Every man on the club's books, as Championship Manager files a squad.
//
// **Ordered by the position OUR league files him at** (Craig, 3 Sep 2026:
// "needs to be ordered by fantasy position"). That is `positionDepth` in the
// join layer — keeper, defence, midfield, attack — which is the order every
// football list uses and the order `cm9900/25.jpg` runs down its slot strip. A
// man our league has no opinion about sorts last rather than into goal, on
// `positionDepth`'s own rule: an unknown position should look wrong, not wrong
// in a way that reads as correct.
//
// **No owner FIGURE, ever.** `SeasonTotals` carries the bound with it
// (`football/types.ts`): FPL's counts may not stand beside a Fantrax figure. The
// owner column is a NAME, not a number — it says who holds him, which is a fact
// about our league and not a second count of a Premier League goal.

export default function SquadTable({
  players,
  league,
}: {
  /** Already ordered by the page. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  /** Our league's opinion by FPL code, empty when Fantrax would not say. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** The sister repo's, by the same key. Empty when it has never exported. */
}) {
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <caption className="sr-only">
          The club&apos;s squad, ordered by the position our league files each man at
        </caption>
        <thead>
          <HeadRow>
            {/* What our Fantrax league fields him as, in CM's index block (Craig, 23 Sep
                2026: "Put the Fantrax position into those tiles, and then remove
                the position columns"). It replaced the shirt number here. */}
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
                  <Link
                    href={`${PLAYER}/${player.code}`}
                    className="cm-row flex min-h-11 items-center gap-2 font-bold hover:underline"
                  >
                    {/* First name and surname (Craig, 3 Sep 2026). FPL's `name` is
                        its own web short form — "Raya", "J.Timber" — which is
                        right on a pitch card 46px wide and wrong in a column
                        with room for a person. `fullName` is `first_name
                        second_name` from the bootstrap. */}
                    <span className={`min-w-0 truncate ${ROW_NAME}`}>{player.fullName}</span>
                    <StateBox player={player} />
                  </Link>
                </td>
                {/* The owner's name, or what our league says instead: "WW" on
                    waivers, "FA" a free agent. Fantrax's own letters, carried
                    rather than translated — the vocabulary is theirs, and an
                    undrafted league marks everybody WW. */}
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

/** How our league would file a man, as a number the squad list sorts on.
 *
 *  Exported because the ORDER is the page's decision and the vocabulary is this
 *  file's neighbour: `positionsLabel` already sorts the letters back to front,
 *  so the first of them is the one he is filed under.
 *
 *  A man our league has no opinion about sorts after everybody it does, which is
 *  what `positionDepth` does with a letter it has never seen. */
export function fantasyDepth(opinion: LeagueOpinion | undefined): number {
  const first = [...(opinion?.positions ?? [])].sort(
    (a, b) => positionDepth(a) - positionDepth(b),
  )[0];
  return first === undefined ? Number.MAX_SAFE_INTEGER : positionDepth(first);
}

