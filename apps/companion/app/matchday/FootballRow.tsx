import { type Club, type Fixture, type FootballPlayer, crestUrl } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import { londonTime } from "../londonTime";
import { SMALL_CAPS } from "@/app/desk";

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
  yours,
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** His players in this match — printed as a COUNT and never as a tint.
   *
   *  `MatchList` found this and the first build of this file ignored it: with
   *  fifteen players across ten fixtures, eight of the ten rows come out accented
   *  and every row marked is no row marked. The number is also what ranks one
   *  match above another, which a wash cannot do. */
  yours?: FootballPlayer[];
  /** Whether the snapshot is fresh enough to speak in the present tense. */
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = fixture.homeScore !== null && fixture.awayScore !== null;
  const live = now && fixture.status === "live";

  return (
    <ScoreRow
      home={club(home)}
      away={club(away)}
      score={played ? { home: spelled(fixture.homeScore), away: spelled(fixture.awayScore) } : null}
      pending={fixture.kickoff === null ? "TBC" : londonTime(fixture.kickoff)}
      tail={
        <>
          {/* The state, in the vidiprinter's own place. `--color-live` is a
              match in play and nothing else (DESIGN §3), so it is the one thing
              on the row that moves and the only thing wearing that red. */}
          {live ? (
            <span className={`${SMALL_CAPS} numeric text-live`}>{fixture.minutes}&prime;</span>
          ) : fixture.status === "finished" ? (
            <span className={`${SMALL_CAPS} text-faint`}>FT</span>
          ) : null}
          {/* Counted rather than tinted, which is `MatchList`'s own finding: a
              bare wash saturates once fifteen players span ten fixtures, and
              every row marked is no row marked.
              **And the word stays with the number.** A lone accent figure makes
              COLOUR the sole carrier of "yours", which PRODUCT.md forbids — it
              was hidden below `lg` for 34px of width and read as a mystery 1 on
              the one screen this app is for. The football row's two names are
              three letters each under a thumb, so the width was there. */}
          {yours && yours.length > 0 ? (
            <span className="text-3xs font-bold uppercase text-accent lg:text-2xs">
              <span className="numeric">{yours.length}</span> yours
            </span>
          ) : null}
        </>
      }
      href={`/prem/match/${fixture.id}`}
    />
  );
}

/** One side of a football match. A club FPL has not named is the em dash and no
 *  crest — a fixture we cannot read one end of is still a fixture. */
function club(entry: Club | undefined) {
  return entry === undefined
    ? { name: "—" }
    : { name: entry.name, short: entry.shortName, badge: crestUrl(entry) };
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
