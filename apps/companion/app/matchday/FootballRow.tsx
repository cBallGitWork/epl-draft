import { type Club, type Fixture, crestUrl } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { londonTime } from "../londonTime";


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
// which is also the only half of the pair the vidiprinter's spelling joke and
// FPL's clock belong to.

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
      home={club(home, places)}
      away={club(away, places)}
      score={played ? { home: spelled(fixture.homeScore), away: spelled(fixture.awayScore) } : null}
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
      href={`/prem/match/${fixture.id}`}
    />
  );
}

/** One side of a football match. A club FPL has not named is the em dash, no
 *  crest and no place — a fixture we cannot read one end of is still a fixture. */
function club(entry: Club | undefined, places: Map<number, number>) {
  return entry === undefined
    ? { name: "—" }
    : {
        name: entry.name,
        short: entry.shortName,
        badge: crestUrl(entry),
        place: places.get(entry.id) ?? null,
      };
}

/** How many a side has to put past you before the vidiprinter says it twice.
 *
 *  Four — not a number of ours. It is the threshold Sky's teleprinter has used
 *  for decades, and the whole joke is that the machine stops trusting you to
 *  believe the digit.
 *
 *  **A deliberate copy of `matchday/desk/Rows`, not an extraction.** Second
 *  occurrence, and CODE_RULES §1 is explicit: *"Two occurrences: leave it
 *  duplicated. Two similar things are a coincidence, not a pattern."* The third
 *  earns a home, and this comment is what stops the two drifting apart in the
 *  meantime — they must agree, because the same match is on both screens.
 *
 *  **A football fact only.** There is no equivalent for a fantasy total: "a lot
 *  of points" has no custom behind it, and inventing a threshold would be us
 *  making the joke rather than quoting it. Which is why the draft row above does
 *  not call this. */
const SPELL_FROM = 4;

const WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

function spelled(goals: number | null) {
  if (goals === null) return null;
  const word = goals >= SPELL_FROM ? WORDS[goals] : undefined;
  return (
    <span>
      {goals}
      {word ? <span className="pl-0.5 text-3xs font-bold text-faint">({word})</span> : null}
    </span>
  );
}
