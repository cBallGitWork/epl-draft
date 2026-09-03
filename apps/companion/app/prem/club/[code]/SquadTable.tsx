import Link from "next/link";
import type { ClubColours, FootballPlayer } from "@epl/core";
import { availabilityOf, positionDepth } from "@epl/core";
import { Head, HeadRow, NameHead, PLATE } from "../../../components/league/TableHeads";
import PlayerPortrait from "../../../components/football/PlayerPortrait";
import StateBox from "../../../components/football/StateBox";
import { positionsLabel } from "../../../positions";
import { PLAYER } from "../../PremNav";
import type { LeagueOpinion } from "./club";

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

const DASH = "—";

export default function SquadTable({
  players,
  colours,
  league,
}: {
  /** Already ordered by the page. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  colours: ClubColours;
  /** Our league's opinion by FPL code, empty when Fantrax would not say. */
  league: ReadonlyMap<number, LeagueOpinion>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          The club&apos;s squad, ordered by the position our league files each man at
        </caption>
        <thead>
          <HeadRow>
            {/* Squad number. CM's own left-hand slot (`cm9900/19.jpg` runs the
                shirt numbers down its tactics list) and empty here: FPL
                publishes `squad_number` as a key on every element and null as a
                value on all of them, counted 29 Aug. It fills from the intel
                feed, which carries it for 527 of 625. */}
            <Head width="w-8 lg:w-14" title="Squad number — arrives with the intel feed">
              <span className={PLATE}>#</span>
            </Head>
            <NameHead label="Player" />
            {/* Fantrax's, and headed as Fantrax's. DESIGN's provenance rule is
                the whole reason this is its own column rather than merged with
                the real-life position. */}
            <Head
              width="w-12 lg:w-20"
              title="What our Fantrax league will field him as — not a fact about the footballer"
            >
              <span className={PLATE}>Pos</span>
            </Head>
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
            const availability = availabilityOf(player);
            // Greyed rather than hidden, which is CM's answer for a man who
            // cannot play (`cm9900/25.jpg`): a squad list that omits the injured
            // cannot be checked against a team sheet.
            //
            // **Cell by cell, and NOT `.cm-out` on the row.** That class is
            // `.cm-out, .cm-out *`, so it repaints the state badge too — and the
            // badge is `--color-bad` behind `--color-bg`, so forcing its ink to
            // `--color-faint` put "Inj" at 1.04:1, which `sweep` caught six
            // times on Man City. The one thing that must survive the greying is
            // the box saying WHY the row is grey.
            const dim = availability.out ? "text-faint" : "";
            const opinion = league.get(player.code);

            return (
              <tr key={player.id} className="border-b border-bg hover:bg-surface">
                <td className={`${SLOT} ${dim}`}>{DASH}</td>
                <td className="w-full max-w-0 pl-2">
                  <Link
                    href={`${PLAYER}/${player.code}`}
                    className="cm-row flex min-h-11 items-center gap-2 font-bold hover:underline"
                  >
                    <PlayerPortrait
                      player={{ code: player.code, name: player.name }}
                      colours={colours}
                    />
                    <span className={`min-w-0 truncate ${dim}`}>{player.name}</span>
                    <StateBox player={player} />
                  </Link>
                </td>
                <td className={`${FIGURE} ${dim || "text-muted"}`}>
                  {positionsLabel(opinion?.positions ?? []) ?? DASH}
                </td>
                {/* The owner's name, or what our league says instead: "WW" on
                    waivers, "FA" a free agent. Fantrax's own letters, carried
                    rather than translated — the vocabulary is theirs, and an
                    undrafted league marks everybody WW. */}
                <td className={`px-1.5 text-center text-2xs ${dim || "text-info"}`}>
                  <span className="block truncate">{owner(opinion) ?? DASH}</span>
                </td>
                <td className={`${FIGURE} ${dim || "text-ink"}`}>{player.season.minutes}</td>
                <td className={`${FIGURE} hidden lg:table-cell ${dim || "text-ink"}`}>
                  {player.season.starts}
                </td>
                <td className={`${FIGURE} hidden lg:table-cell ${dim || "text-mid"}`}>
                  {player.season.goals}
                </td>
                <td className={`${FIGURE} hidden lg:table-cell ${dim || "text-mid"}`}>
                  {player.season.assists}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

/** The position slot, quiet until it has a number in it. */
const SLOT = "numeric px-1.5 text-center text-2xs text-faint";

/** One figure cell, at the row's own size. */
const FIGURE = "numeric px-1.5 text-center text-2xs font-bold lg:text-sm";
