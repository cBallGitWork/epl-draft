import Image from "next/image";
import Link from "next/link";
import { type Club, type Fixture, crestUrl } from "@epl/core";
import { londonDayAndTime } from "../londonTime";
import { MATCH } from "./club/[code]/match";
import { SCORE_CREST, SCORE_CREST_PX } from "@/app/desk";

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
//
// **The scoreline is a link, and it was not one until 4 Sep 2026.** This file's
// own docblock and `docs/ui/prem.md` both said every score in the section opened
// a match; neither was true, and the two links that actually reached
// `/prem/match/[id]` were a club's fixture run and a player's match log. The
// section's own two round lists — the pages a reader lands on from the rail —
// were the ones that could not.
//
// **A tappable score is a CONTROL** and takes the control floor — 44 under a
// thumb, 36 on the desk (DESIGN §6). It cost nothing here, which is worth saying
// because it cost something everywhere else: this row was already `min-h-11
// lg:min-h-9` before it was a link, so the whole change is the `div` becoming an
// anchor. `players/[fantraxId]/MatchLog` records the same ruling where the bill
// was real — one linked cell there holds a whole table off `.cm-row`'s 28.

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
    <Link
      href={`${MATCH}/${fixture.id}`}
      className="flex min-h-11 items-center gap-2 px-2 py-1.5 hover:bg-raised lg:min-h-9"
    >
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
    </Link>
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
        <span aria-hidden className={SCORE_CREST} />
      ) : (
        <Image
          src={crestUrl(club)}
          alt=""
          width={SCORE_CREST_PX}
          height={SCORE_CREST_PX}
          className={`${SCORE_CREST} object-contain`}
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
