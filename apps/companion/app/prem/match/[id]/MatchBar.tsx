import Image from "next/image";
import Link from "next/link";
import type { Club } from "@epl/core";
import { clubColours, crestUrl, inkOn } from "@epl/core";
import { CLUB } from "../../PremNav";

// Championship Manager's match header: both sides at once, each on its own
// colour, with its own score in a plate at its own right-hand edge.
//
// **The two CLUBS' OWN colours, which is the reference's rule and not a
// blue/red convention.** `cm9900/21.jpg` is Everton blue against Arsenal red and
// `16.jpg` is the same blue against Torquay WHITE — so a pale side is a case the
// game has rather than an edge we invented, and `inkOn` keeps it readable.
//
// **Neither plate is mirrored, and the first build got that wrong.**
// `cm0102/06.jpg` (Paris-SG 6 | Monaco 6) and the Newcastle-Chelsea overview
// both set each side name-left with its score box at the RIGHT end of its own
// plate. Mirroring the away half put the two boxes together in the middle, which
// reads as one scoreline shared between the clubs rather than as each club's own
// score (Craig, 4 Sep 2026: *"the scores go on the right hand side of each team
// row, currently its centered"*).
//
// **One `v` before kick-off, not two.** Giving each plate a box and filling both
// with the same letter printed `V V` (Craig: *"theres two V's 'VV' just one"*).
// A score is a fact about one side; "not played" is a fact about the fixture, so
// it belongs between them and is drawn once.
//
// Not `PageHeader` and not `PlateShell`: both hold ONE plate, and `PlateShell`'s
// docblock pre-refuses a config object for a second.

export default function MatchBar({
  home,
  away,
  homeScore,
  awayScore,
}: {
  home: Club | undefined;
  away: Club | undefined;
  /** Null on both for a match with no score yet, which draws the single `v`. */
  homeScore: number | null;
  awayScore: number | null;
}) {
  const played = homeScore !== null && awayScore !== null;

  return (
    <header className="flex items-stretch">
      <Side club={home} score={played ? homeScore : null} />
      {played ? null : (
        <span className="cm-bevel numeric flex min-h-16 w-8 shrink-0 items-center justify-center text-lg font-bold uppercase lg:min-h-24 lg:w-12 lg:text-3xl">
          v
        </span>
      )}
      <Side club={away} score={played ? awayScore : null} />
    </header>
  );
}

/** One club's half of the bar: crest, name, and its own score at the right.
 *
 *  A club the snapshot does not carry keeps its half rather than collapsing it —
 *  a header that lost a side would put the middle off centre and read as a
 *  different screen. */
function Side({ club, score }: { club: Club | undefined; score: number | null }) {
  const colours = clubColours(club?.shortName ?? "");
  const ink = inkOn(colours);

  return (
    <div
      className="flex min-h-16 min-w-0 flex-1 items-center lg:min-h-24"
      style={{ background: colours.primary }}
    >
      {club === undefined ? (
        <span className="min-w-0 flex-1 px-2 text-center text-sm font-bold" style={{ color: ink }}>
          —
        </span>
      ) : (
        // `self-stretch` so the target is the whole coloured half and not the
        // 24px the words happen to occupy. `tapfit` measured that on the first
        // build: a link sized by its own inline content is a link nobody can hit,
        // and this one is the width of a title bar.
        <Link
          href={`${CLUB}/${club.code}`}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch px-2"
        >
          <Image
            src={crestUrl(club)}
            alt=""
            width={CREST_PX}
            height={CREST_PX}
            className="h-6 w-6 shrink-0 object-contain lg:h-9 lg:w-9"
            aria-hidden
            unoptimized
          />
          {/* The short form under a thumb: two names, two crests and two score
              boxes do not fit 326px, which is the trade `prem/Match` makes one
              row down. */}
          <span
            className="cm-title min-w-0 flex-1 truncate font-chrome text-lg font-bold uppercase lg:hidden"
            style={{ color: ink }}
          >
            {club.shortName}
          </span>
          <span
            className="cm-title hidden min-w-0 flex-1 truncate font-chrome text-3xl font-bold uppercase lg:block"
            style={{ color: ink }}
          >
            {club.name}
          </span>
        </Link>
      )}

      {/* CM's score box, at this club's own right edge. `cm-bevel` rather than a
          flat white block: it is the same raised plate the tab strip and the
          column heads are cut from, and a match header is not the place to
          invent a second one. */}
      {score === null ? null : (
        <span className="cm-bevel numeric flex min-h-16 w-10 shrink-0 items-center justify-center text-xl font-bold lg:min-h-24 lg:w-16 lg:text-4xl">
          {score}
        </span>
      )}
    </div>
  );
}

/** Fetched at the desk's size so the crest is not soft when it doubles.
 *  `TeamBadge`'s pair, for its reason: a source fetched smaller than it is drawn
 *  is a blur nobody thinks to blame the CSS for. */
const CREST_PX = 36;
