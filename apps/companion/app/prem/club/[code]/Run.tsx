import Image from "next/image";
import Link from "next/link";
import type { Club, Fixture } from "@epl/core";
import { COMPETITION_NAME, crestUrl } from "@epl/core";
import { londonDayAndDate, londonTime } from "../../../londonTime";
import { CLUB, MATCH } from "../../routes";
import { BOARD, ROW_NAME, ROW_RULE, SCROLL } from "@/app/desk";


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
    <div className={SCROLL}>
      <table className={BOARD}>
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
              <tr key={fixture.id} className={`cm-row ${ROW_RULE} hover:bg-surface`}>
                {/* The date in the club's own colour (Craig, 3 Sep 2026:
                    "fixtures, needs the team colours for the date box").
                    `cm-index` is CM's index block and `ClubShell` has already
                    scoped `--cm-index` to this club, so the block is the club's
                    without this file knowing which club it is on — the same
                    mechanism the gameweek column uses two cells along. */}
                <td className="cm-index numeric whitespace-nowrap px-1.5 text-center">
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
                      className="cm-row flex min-h-11 items-center gap-2 hover:underline"
                    >
                      <Image
                        src={crestUrl(opponent)}
                        alt=""
                        width={CREST_PX}
                        height={CREST_PX}
                        className={`${CREST} object-contain`}
                        aria-hidden
                        unoptimized
                      />
                      <span className={`min-w-0 truncate lg:hidden ${ROW_NAME}`}>
                        {opponent.shortName}
                      </span>
                      <span className={`hidden min-w-0 truncate lg:inline ${ROW_NAME}`}>
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
                {/* **Every row is a link now, whatever state the match is in.**
                    It used to be the played ones only, which was right while the
                    match page said "this is what the fixture list knows" over a
                    scoreline — a preview and a live sheet had nothing behind
                    them. Both do now, and a fixture nobody can open is a fixture
                    with no way to see who is in it. The live cell keeps its ink:
                    a running score reads as a final one without it. */}
                <td className="numeric w-14 whitespace-nowrap px-1.5 text-center text-sm font-bold">
                  <Link
                    href={`${MATCH}/${fixture.id}`}
                    className="cm-row flex min-h-11 items-center justify-center hover:underline"
                  >
                    {fixture.status === "live" ? (
                      <span className="text-live">{mine}–{theirs}</span>
                    ) : played ? (
                      `${mine}–${theirs}`
                    ) : (
                      <span className="text-faint">{DASH}</span>
                    )}
                  </Link>
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
// The competition, said the one way this app says it. Craig, 5 Sep 2026:
// "league is known as FA Barclays Premiership throughout, full change on that."
// `config.ts` is where the name lives; a second spelling here is a second thing
// to be wrong when the sponsor changes.
const COMPETITION = COMPETITION_NAME;

/** The crest beside a fixture in this run: 22px, at both widths.
 *
 *  Lived in `desk.ts` as `SCORE_CREST` while four scoreline rows shared it.
 *  `shell/ScoreRow` absorbed three and draws its own; this is a club's fixture
 *  RUN rather than a scoreline, so it is now the only caller and the number
 *  belongs here (CODE_RULES §1: a recipe for one caller is not a recipe).
 *
 *  `_PX` is what `next/image` is told to FETCH and the class is what the page
 *  draws — `TeamBadge`'s own pair, for its reason: a source fetched smaller than
 *  it is drawn is a soft crest nobody thinks to blame the CSS for. */
const CREST = "h-[1.375rem] w-[1.375rem] shrink-0";
const CREST_PX = 22;

const DASH = "—";
