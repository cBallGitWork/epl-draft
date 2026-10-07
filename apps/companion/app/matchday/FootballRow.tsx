import { type Club, type Fixture, londonTime } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { matchHref } from "../prem/match/[id]/matchRoutes";
import { hasScore } from "../prem/score";

/** The state beside the score, inside the score cell: a sixth track would clip `TOT` at 390. */
const CLOCK = "text-sm font-bold uppercase lg:text-base";

/** One Premier League match as a Championship Manager results row, linking to its match page by
 *  the per-season id `/prem/match/[id]` takes. */
export default function FootballRow({
  fixture,
  clubs,
  places,
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Each club's place in the real table, by club id; empty before a ball is kicked, not twenty sides in 1st. */
  places: Map<number, number>;
  /** Whether the snapshot is fresh enough to speak in the present tense. */
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = hasScore(fixture);
  const live = now && fixture.status === "live";

  return (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      pending={fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
      // Right of the figures (Craig, 5 Sep 2026); `--color-live` means a match in play and nothing else (DESIGN §3).
      clock={
        // A step up with the score it sits beside (Craig, 21 Sep 2026): the
        // minute is the other half of what a live row says.
        live ? (
          <span className={`${CLOCK} numeric text-live`}>{fixture.minutes}&prime;</span>
        ) : fixture.status === "finished" ? (
          <span className={`${CLOCK} text-faint`}>FT</span>
        ) : null
      }
      href={matchHref(fixture.id, "overview")}
    />
  );
}
