import type { ClubColours, FootballPlayer } from "@epl/core";
import { availabilityOf } from "@epl/core";
import { Head, HeadRow, NameHead, PLATE } from "../../../components/league/TableHeads";
import PlayerPortrait from "../../../components/football/PlayerPortrait";
import StateBox from "../../../components/football/StateBox";
import { positionsLabel } from "../../../positions";

// Every man on the club's books, as Championship Manager files a squad.
//
// **A table, which is `cm9900/12.jpg`, rather than `25.jpg`'s two columns.**
// The two-column list is built around the slot plate down the left of each name
// — `GK` `DR` `DC` `SB5` — and a list with no real positions in it has nothing
// to put there. A table has figure columns that earn the width instead. The two
// columns come back with the depth chart, when a down-then-across split means
// something.
//
// **No owner column and no fantasy figure, ever.** `SeasonTotals` carries the
// bound with it (`football/types.ts`): FPL's counts may not stand beside a
// Fantrax figure. This section is FPL's, `docs/ui/prem.md` records that
// "anything about who owns whom" belongs to the fantasy register, and a
// `season.goals` next to an FPts is the defect a reviewer is looking for.

const DASH = "—";

export default function SquadTable({
  players,
  colours,
  fantrax,
}: {
  /** Already in the order the page chose. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  colours: ClubColours;
  /** Our league's eligibility by FPL code, empty when Fantrax would not say. */
  fantrax: ReadonlyMap<number, string[]>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          The club&apos;s squad, ordered by minutes played this season
        </caption>
        <thead>
          <HeadRow>
            {/* Real-life position. Empty until the intel feed lands, and headed
                anyway: a column that appears later moves every figure beside
                it, and a reader who can see the slot can see what is coming. */}
            <Head width="hidden w-10 lg:table-cell lg:w-16" title="Position — arrives with the intel feed">
              <span className={PLATE}>Pos</span>
            </Head>
            <NameHead label="Player" />
            {/* Fantrax's, and headed as Fantrax's. DESIGN's provenance rule is
                the whole reason there are two columns rather than one. */}
            <Head
              width="w-14 lg:w-24"
              title="What our Fantrax league is willing to field him as — not a fact about the footballer"
            >
              <span className={PLATE}>Elig</span>
            </Head>
            <Head width="w-12 lg:w-20" title="Minutes played">
              <span className={PLATE}>Min</span>
            </Head>
            <Head width="hidden w-9 lg:table-cell lg:w-16" title="Starts">
              <span className={PLATE}>St</span>
            </Head>
            <Head width="w-8 lg:w-16" title="Goals">
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
              // Greyed rather than hidden, which is CM's own answer for a man
              // who cannot play (`cm9900/25.jpg`): a squad list that omits the
              // injured cannot be checked against a team sheet.
              //
              // **Cell by cell, and NOT `.cm-out` on the row.** That class is
              // `.cm-out, .cm-out *`, so it repaints the state badge too — and
              // the badge is `--color-bad` behind `--color-bg`, so forcing its
              // ink to `--color-faint` put "Inj" at **1.04:1**, which `sweep`
              // caught six times on Man City. The one thing that must survive
              // the greying is the box saying WHY the row is grey.
              const dim = availability.out ? "text-faint" : "";
              return (
              <tr key={player.id} className="border-b border-bg hover:bg-surface">
                <td className={`${SLOT} hidden lg:table-cell`}>{DASH}</td>
                <td className="w-full max-w-0 pl-2">
                  <span className="cm-row flex min-h-11 items-center gap-2 font-bold">
                    <PlayerPortrait
                      player={{ code: player.code, name: player.name }}
                      colours={colours}
                    />
                    <span className={`min-w-0 truncate ${dim}`}>{player.name}</span>
                    <StateBox player={player} />
                  </span>
                </td>
                <td className={`${FIGURE} ${dim || "text-muted"}`}>
                  {positionsLabel(fantrax.get(player.code) ?? []) ?? DASH}
                </td>
                <td className={`${FIGURE} ${dim || "text-ink"}`}>{player.season.minutes}</td>
                <td className={`${FIGURE} hidden lg:table-cell ${dim || "text-ink"}`}>{player.season.starts}</td>
                <td className={`${FIGURE} ${dim || "text-mid"}`}>{player.season.goals}</td>
                <td className={`${FIGURE} hidden lg:table-cell ${dim || "text-mid"}`}>{player.season.assists}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The position slot.
 *
 *  **Deliberately NOT `TableCells.IndexCell`.** `ClubShell` scopes `--cm-index`
 *  to the club's own colour, so an index block here is twenty rows of the club
 *  at full saturation — and CM's own slot plate (`cm9900/25.jpg`) earns that
 *  because it carries `GK` `DR` `DC`, where ours carries a dash. It becomes the
 *  plate when it has a position in it, and until then it is a quiet cell that
 *  holds the column open on the desk and stands down under a thumb, where 40px
 *  of dashes costs a name the room to be read. */
const SLOT = "numeric px-1.5 text-center text-2xs text-faint";

/** One figure cell, at the row's own size. */
const FIGURE = "numeric px-1.5 text-center text-2xs font-bold lg:text-sm";
