import { type Club, type Fixture, londonDayAndTime } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { MATCH } from "./routes";
import { SMALL_CAPS } from "@/app/desk";

// One Premier League match, as Championship Manager's results row.
//
// **`ScoreRow`, and this was the fifth spelling of it** (Craig, 5 Sep 2026:
// *"prem/results needs blue position tab on rows, same fixtures too"*). The row
// was extracted at four call sites — the Live tab's two, the schedule and
// Results — and this file kept its own: crests either side of a fixed centre
// column, no position block, its own crest size, its own `–` between the scores.
// Same object, sixth week, five drawings. It gains what the shared row already
// had: the blue block with each club's place in the table, the colon, the cyan,
// and the phone's short name against the desk's full one.
//
// **Deliberately not `components/football/MatchList`**, which is the round in
// view on `/matchday` and `/gw/[n]`: that one expands into who did what, off the
// per-player stats a snapshot carries for its own gameweek. This section lists
// every round of the season, and there is one live feed, not thirty-eight — a
// row that opened onto "Nothing to report." over a 3-0 win would be a confident
// wrong statement about a match that happened. So this says the one thing the
// season's fixture list actually knows, and the round in view keeps the screen
// that knows more.

export default function Match({
  fixture,
  clubs,
  places,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Where each club stands, by club id — CM's blue block. Empty before any
   *  football is played, which is a table with no ranking in it rather than
   *  twenty sides in first. */
  places: Map<number, number>;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      // `TBC` rather than a guessed date: FPL leaves `kickoff_time` null on a
      // match the television has not picked yet, and inventing one is the
      // confident wrong answer DESIGN §7 is about.
      pending={fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff)}
      clock={
        fixture.status === "finished" ? (
          <span className={`${SMALL_CAPS} text-faint`}>FT</span>
        ) : null
      }
      href={`${MATCH}/${fixture.id}`}
    />
  );
}

/** One club's half of the row. A club this snapshot does not carry is the em
 *  dash and no crest — `next/image` throws on an empty `src`, so a fixture
 *  naming one would have taken the whole list down. */
