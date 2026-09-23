import Image from "next/image";
import Link from "next/link";
import type { Club } from "@epl/core";
import { clubColoursOf, crestUrl, inkOn } from "@epl/core";
import { CLUB } from "../../routes";

// CM's match header (`cm9900/21.jpg`): both clubs at once in their own colours, each with its own score at its own
// right edge — never mirrored, or the two boxes read as one shared scoreline — and one `v` between them before kick-off.

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

/** One club's half: crest, name and score. A club the snapshot lacks keeps its half, so the bar stays centred. */
function Side({ club, score }: { club: Club | undefined; score: number | null }) {
  const colours = clubColoursOf(club);
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
        // The whole coloured half is the target, not the 24px the words occupy.
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
