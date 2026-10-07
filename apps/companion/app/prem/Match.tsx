import { type Club, type Fixture, londonDayAndTime } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { SMALL_CAPS } from "@/app/desk";
import { matchHref } from "./match/[id]/matchRoutes";
import { hasScore } from "./score";

// One Premier League match as Championship Manager's results row (Craig, 5 Sep 2026).
// Not `MatchList`: that expands off per-player stats only the round in view carries.

export default function Match({
  fixture,
  clubs,
  places,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Each club's place, by club id (CM's blue block); empty before a ball is kicked. */
  places: Map<number, number>;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = hasScore(fixture);

  return (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      // FPL leaves `kickoff_time` null until television picks the match; never guess a date (DESIGN §7).
      pending={fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff)}
      clock={
        fixture.status === "finished" ? (
          <span className={`${SMALL_CAPS} text-faint`}>FT</span>
        ) : null
      }
      href={matchHref(fixture.id, "overview")}
    />
  );
}
