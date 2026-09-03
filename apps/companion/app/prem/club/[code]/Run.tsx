import Image from "next/image";
import Link from "next/link";
import type { Club, Fixture } from "@epl/core";
import { crestUrl } from "@epl/core";
import { londonDayAndDate, londonTime } from "../../../londonTime";
import { CLUB } from "../../PremNav";
import { MATCH } from "./match";

// One club's season, played and to come, in the order it runs.
//
// **The opponent once, never the fixture twice.** `cm9900/24.jpg`'s club fixture
// list is `Sat 5th Mar · Montpellier · H · French Cup 11th Rnd · 2-2` — a date,
// who they played, whether it was home, which competition, and the score. It
// does not print the club whose page you are on, because you are on it (Craig,
// 3 Sep 2026: "we dont [want] to put the same team over and over"). That is the
// whole difference from `prem/Match`, which draws BOTH sides because it lists a
// round rather than a campaign, and it is why this does not reuse it.
//
// **A live match is marked here.** `Match` prints a score the moment FPL has
// one, which is right on `/prem/results` and `/prem/fixtures` because both
// exclude a round in play — a club's whole season does not, and a running score
// with no tense reads as a final one.

export default function Run({
  fixtures,
  club,
  clubs,
}: {
  fixtures: readonly Fixture[];
  /** Whose season this is — the side that is NOT named on each row. */
  club: Club;
  clubs: Map<number, Club>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{club.name}&apos;s season, oldest first</caption>
        <tbody>
          {fixtures.map((fixture) => {
            const home = fixture.homeClubId === club.id;
            const opponent = clubs.get(home ? fixture.awayClubId : fixture.homeClubId);
            const played = fixture.homeScore !== null && fixture.awayScore !== null;
            // The club's own goals first, whichever end it was at — a column of
            // scores read down a season means nothing if half of them are the
            // other way round.
            const mine = home ? fixture.homeScore : fixture.awayScore;
            const theirs = home ? fixture.awayScore : fixture.homeScore;

            return (
              <tr key={fixture.id} className="cm-row border-b border-bg hover:bg-surface">
                {/* The date in the club's own colour (Craig, 3 Sep 2026:
                    "fixtures, needs the team colours for the date box").
                    `cm-index` is CM's index block and `ClubShell` has already
                    scoped `--cm-index` to this club, so the block is the club's
                    without this file knowing which club it is on — the same
                    mechanism the gameweek column uses two cells along. */}
                <td className="cm-index numeric whitespace-nowrap px-1.5 text-center text-3xs font-bold lg:text-2xs">
                  {fixture.kickoff === null ? "TBC" : londonDayAndDate(fixture.kickoff)}
                </td>
                <td className="numeric whitespace-nowrap px-1 text-3xs text-faint lg:text-2xs">
                  {fixture.kickoff === null ? "" : londonTime(fixture.kickoff)}
                </td>
                <td className="w-full max-w-0 px-1">
                  {opponent === undefined ? (
                    <span className="text-sm text-faint">{DASH}</span>
                  ) : (
                    <Link
                      href={`${CLUB}/${opponent.code}`}
                      className="flex min-h-11 items-center gap-2 font-bold hover:underline lg:min-h-7"
                    >
                      <Image
                        src={crestUrl(opponent)}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[1.375rem] w-[1.375rem] shrink-0 object-contain"
                        aria-hidden
                        unoptimized
                      />
                      <span className="min-w-0 truncate text-sm lg:hidden">
                        {opponent.shortName}
                      </span>
                      <span className="hidden min-w-0 truncate text-sm lg:inline">
                        {opponent.name}
                      </span>
                    </Link>
                  )}
                </td>
                {/* Home or away, which is what lets the opponent be named once. */}
                <td className="px-1 text-center text-2xs font-bold text-muted">
                  {home ? "H" : "A"}
                </td>
                {/* The competition. One value today and the column is the point:
                    FPL publishes the league and nothing else, so a cup tie has
                    nowhere to come from yet — see the note under the list. */}
                <td className="hidden whitespace-nowrap px-1.5 text-2xs text-faint lg:table-cell">
                  {COMPETITION}
                </td>
                <td className="numeric w-14 whitespace-nowrap px-1.5 text-center text-sm font-bold">
                  {fixture.status === "live" ? (
                    <span className="text-live">{mine}–{theirs}</span>
                  ) : played ? (
                    <Link href={`${MATCH}/${fixture.id}`} className="hover:underline">
                      {mine}–{theirs}
                    </Link>
                  ) : (
                    <span className="text-faint">{DASH}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** What FPL's fixture list is a list OF. Named rather than inlined so the day a
 *  second competition arrives, the literal is already in one place. */
const COMPETITION = "Premier League";

const DASH = "—";
