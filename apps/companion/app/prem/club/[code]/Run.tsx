import type { ReactNode } from "react";
import ScrollBoard from "../../../components/league/ScrollBoard";
import Link from "@/app/components/shell/Link";
import type { Club, CupTie, Fixture, RunEntry } from "@epl/core";
import { COMPETITION_NAME, cupName, londonDayAndDate, londonTime, DASH } from "@epl/core";
import { clubHref } from "../../routes";
import { BOARD, DESK_ONLY, FIGURE, MINOR_CAPS, ROW_HOVER, ROW_NAME } from "@/app/desk";
import { ROW_LINK } from "../../../components/league/TableCells";
import Absent from "@/app/components/shell/Absent";
import ClubLabel from "@/app/components/football/ClubLabel";
import { matchHref } from "../../match/[id]/matchRoutes";
import { hasScore } from "../../score";

// One club's season, league and cups, in the order it runs: a date, the opponent once, H/A, the competition, the score.
// A live score keeps its ink: a running score with no tense reads as a final one.

interface Cells {
  key: string;
  kickoff: string | null;
  opponent: ReactNode;
  venue: "H" | "A" | "N";
  competition: ReactNode;
  score: ReactNode;
}

export default function Run({
  entries,
  club,
  clubs,
  byCode,
}: {
  entries: readonly RunEntry[];
  /** Whose season this is — the side that is NOT named on each row. */
  club: Club;
  clubs: Map<number, Club>;
  /** FPL's clubs by code, for a cup tie between two of them. */
  byCode: Map<number, Club>;
}) {
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <caption className="sr-only">{club.name}&apos;s season, oldest first</caption>
        <tbody>
          {entries.map((entry) => {
            const row = entry.kind === "league" ? leagueCells(entry.fixture, club, clubs) : cupCells(entry.tie, byCode);
            return (
              <tr key={row.key} className={`cm-row ${ROW_HOVER}`}>
                {/* The date in the club's own colour: `ClubShell` scopes `--cm-index` to this club. */}
                <td className="cm-index numeric whitespace-nowrap px-1.5 text-center">
                  {row.kickoff === null ? "TBC" : londonDayAndDate(row.kickoff)}
                </td>
                <td className="numeric whitespace-nowrap px-1 text-3xs text-faint lg:text-2xs">
                  {row.kickoff === null ? "" : londonTime(row.kickoff)}
                </td>
                <td className="w-full max-w-0 px-1">{row.opponent}</td>
                <td className="px-1 text-center text-2xs font-bold text-muted">{row.venue}</td>
                <td className={`${DESK_ONLY} whitespace-nowrap px-1.5 text-2xs text-faint`}>{row.competition}</td>
                <td className={`${FIGURE} w-14 whitespace-nowrap`}>{row.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollBoard>
  );
}

/** A league fixture: the opponent and the score both open a page. */
function leagueCells(fixture: Fixture, club: Club, clubs: Map<number, Club>): Cells {
  const home = fixture.homeClubId === club.id;
  const opponent = clubs.get(home ? fixture.awayClubId : fixture.homeClubId);
  const played = hasScore(fixture);
  // The club's own goals first, whichever end it was at.
  const mine = home ? fixture.homeScore : fixture.awayScore;
  const theirs = home ? fixture.awayScore : fixture.homeScore;
  return {
    key: `league-${fixture.id}`,
    kickoff: fixture.kickoff,
    opponent:
      opponent === undefined ? (
        <span className="text-sm text-faint">{DASH}</span>
      ) : (
        <Link href={clubHref(opponent.code)} className={ROW_LINK}>
          <ClubLabel club={opponent} crest={{ px: CREST_PX, className: `${CREST} object-contain` }} />
        </Link>
      ),
    venue: home ? "H" : "A",
    competition: COMPETITION_NAME,
    score: (
      <Link
        href={matchHref(fixture.id, "overview")}
        className="cm-row flex min-h-11 items-center justify-center hover:underline"
      >
        {fixture.status === "live" ? (
          <span className="text-live">{mine}–{theirs}</span>
        ) : played ? (
          `${mine}–${theirs}`
        ) : (
          <Absent />
        )}
      </Link>
    ),
  };
}

/** A cup or European tie: no match page behind it, and on a phone its competition under the opponent. */
function cupCells(tie: CupTie, byCode: Map<number, Club>): Cells {
  const competition = cupName(tie.competition);
  const opponent = tie.opponentCode === null ? undefined : byCode.get(tie.opponentCode);
  const marker = <span className={`${MINOR_CAPS} min-w-0 truncate text-faint lg:hidden`}>{competition ?? DASH}</span>;
  return {
    key: `cup-${tie.competition}-${tie.kickoff}-${tie.opponentCode ?? tie.opponentName}`,
    kickoff: tie.kickoff,
    opponent:
      opponent === undefined ? (
        // No crest to draw, so its room is kept and the names stay in one column.
        <span className="cm-row flex min-h-11 items-center gap-2">
          <span className={CREST} aria-hidden />
          <span className="flex min-w-0 flex-col">
            <span className={`min-w-0 truncate ${ROW_NAME}`}>{tie.opponentName ?? DASH}</span>
            {marker}
          </span>
        </span>
      ) : (
        // On a phone the crest stands beside both lines, the name over the competition.
        <Link
          href={clubHref(opponent.code)}
          className="cm-row grid min-h-11 grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2 hover:underline lg:flex lg:gap-2"
        >
          <ClubLabel club={opponent} crest={{ px: CREST_PX, className: `${CREST} row-span-2 object-contain` }} />
          {marker}
        </Link>
      ),
    venue: tie.neutral ? "N" : tie.home ? "H" : "A",
    competition: competition ?? <Absent />,
    score: tie.score === null ? <Absent /> : `${tie.score.for}–${tie.score.against}`,
  };
}

/** The crest beside a fixture in this run: 22px at both widths; `_PX` is what `next/image` fetches. */
const CREST = "h-[1.375rem] w-[1.375rem] shrink-0";
const CREST_PX = 22;
