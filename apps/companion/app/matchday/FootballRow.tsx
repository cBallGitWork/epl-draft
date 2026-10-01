import { type Club, type Fixture, londonTime } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { matchHref } from "../prem/match/[id]/matchRoutes";

/** The state beside the score. **Bigger inside the cell rather than in a tail
 *  column of its own**, which is what the measurement bought (21 Sep 2026, at
 *  390): the score cell is 88px and its ink used 34, while the club label had
 *  27px of room and needed exactly 27 — so a sixth track would have clipped
 *  `TOT` to pay for a clock that already had the room. */
const CLOCK = "text-sm font-bold uppercase lg:text-base";

// One Premier League match as a Championship Manager results row.
//
// Split out of `Scores.tsx` on 5 Sep 2026 at CODE_RULES §4's 200-line mark. The
// seam is the right one: `Scores` decides which panels a Saturday has and in
// what order, and this decides what a football match looks like on a row —
// which is also the only half of the pair FPL's clock belongs to.

/** One Premier League match, and the row is the link to it.
 *
 *  Craig, 5 Sep: *"live page should link to the respective match pages."* The
 *  id and never the code — `code` is the season-stable join key the Premier
 *  League's own feed is matched on, and `/prem/match/[id]` takes the per-season
 *  id. */
export default function FootballRow({
  fixture,
  clubs,
  places,
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Where each club stands in the real table, by club id — CM's blue block
   *  (`cm9900/24.jpg`). Empty while no football has been played, which is a
   *  table with no ranking in it rather than twenty sides in 1st. */
  places: Map<number, number>;
  /** Whether the snapshot is fresh enough to speak in the present tense. */
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = fixture.homeScore !== null && fixture.awayScore !== null;
  const live = now && fixture.status === "live";

  return (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      pending={fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
      // The state, in the vidiprinter's own place — inside the score cell, right
      // of the figures (Craig, 5 Sep 2026). `--color-live` is a match in play
      // and nothing else (DESIGN §3), so it is the one thing on the row that
      // moves and the only thing wearing that red.
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
