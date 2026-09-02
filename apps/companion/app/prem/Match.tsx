import Image from "next/image";
import { type Club, type Fixture, crestUrl } from "@epl/core";
import { londonDayAndTime } from "../londonTime";

// One match, as a scoreline.
//
// **Deliberately not `components/football/MatchList`**, which is the round in
// view on `/matchday` and `/gw/[n]`: that one expands into who did what, off the
// per-player stats a snapshot carries for its own gameweek. This section lists
// every round of the season, and there is one live feed, not thirty-eight — a
// row that opened onto "Nothing to report." over a 3-0 win would be a confident
// wrong statement about a match that happened. So this says the one thing the
// season's fixture list actually knows, and the round in view keeps the screen
// that knows more.
//
// A row and not a card: `.cm-rows` rules between them, which is what a list of
// readings has instead of a gap.

export default function Match({
  fixture,
  clubs,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <div className="flex min-h-11 items-center gap-2 px-2 py-1.5 lg:min-h-9">
      <Side club={home} />
      {/* The middle column is fixed so every scoreline in the list sits on one
          vertical line — a column of scores that wanders with the length of the
          club names beside it is a column you cannot read down. */}
      <span className="numeric w-20 shrink-0 text-center text-sm font-bold lg:w-24">
        {played ? (
          `${fixture.homeScore}–${fixture.awayScore}`
        ) : (
          <span className="text-2xs font-bold text-faint">{when(fixture)}</span>
        )}
      </span>
      <Side club={away} align="end" />
    </div>
  );
}

/** When it kicks off, or that nobody has said.
 *
 *  `TBC` rather than a guessed date: FPL leaves `kickoff_time` null on a match
 *  the television has not picked yet, and inventing one is the confident wrong
 *  answer DESIGN §7 is about. */
function when(fixture: Fixture): string {
  return fixture.kickoff === null ? "TBC" : londonDayAndTime(fixture.kickoff);
}

/** One club's half of the row. Reversed at the away end so the two crests sit
 *  either side of the score, which is how a fixture is printed everywhere. */
function Side({ club, align }: { club: Club | undefined; align?: "end" }) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {/* No crest rather than an empty `src`. `next/image` throws on `""`, so a
          fixture naming a club this snapshot does not carry would have taken
          the whole list down — and the gap is held open regardless, so the
          scorelines stay in one column either way. */}
      {club === undefined ? (
        <span aria-hidden className="h-[1.375rem] w-[1.375rem] shrink-0" />
      ) : (
        <Image
          src={crestUrl(club)}
          alt=""
          width={22}
          height={22}
          className="h-[1.375rem] w-[1.375rem] shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      )}
      {/* The three-letter label under a thumb and the name on the desk, as the
          table does it — two crests, a score and two names do not fit 326px. */}
      <span className="min-w-0 truncate text-sm font-bold lg:hidden">
        {club?.shortName ?? DASH}
      </span>
      <span className="hidden min-w-0 truncate text-sm font-bold lg:inline">
        {club?.name ?? DASH}
      </span>
    </span>
  );
}

/** A club this snapshot does not carry. Absence, never a guess. */
const DASH = "—";
