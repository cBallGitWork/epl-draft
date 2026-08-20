import Image from "next/image";
import { type Club, type FootballPlayer, clubColours, crestUrl, isGoalkeeper } from "@epl/core";
import PlayerImage from "../../components/league/PlayerImage";

// The masthead of a page about one footballer.
//
// It had none. A profile carrying eleven blocks of numbers opened with his name
// in bold and a line of grey capitals, which is what a database row looks like —
// and this is the one page in the app where there is room to draw a man at a
// size worth looking at.
//
// The cut-out stands on his club's colour rather than on nothing. Everywhere
// else in the app it stands on grass and needs no ground (`conventions.md`), but
// there is no pitch here, and a transparent cut-out over the page background is
// a head floating in the dark. The colour is the same one his 32px mark in the
// pool sits on, so the two readings of him agree.

/** How wide he is drawn here, and what the optimizer may serve for it. One
 *  number for the same reason it is one number in `PlayerPortrait`: written out
 *  separately they drift, and a soft photograph is not something anyone thinks
 *  to blame a class name for. */
const WIDTH = 112;

export default function Portrait({
  player,
  club,
  position,
  squadNumber,
}: {
  player: FootballPlayer;
  club: Club | undefined;
  /** The league's letter for him, only to pick which of the two kits the
   *  fallback draws. A keeper in an outfield shirt is the kind of quiet
   *  wrongness that survives review. */
  position: string | null;
  /** Fantrax's, and a string because that is how they publish it — printed
   *  verbatim rather than parsed, on the rule that their vocabulary is theirs. */
  squadNumber: string | null;
}) {
  const colours = clubColours(club?.shortName ?? "");

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl"
      style={{ backgroundColor: colours.primary, width: WIDTH }}
    >
      {/* `played` is true because this page has no round in it. Drawn back means
          "he has not kicked off yet", which is a statement about a Saturday, and
          on a profile there is no Saturday to make it about. */}
      <PlayerImage
        player={player}
        club={club}
        keeper={isGoalkeeper(position)}
        played
        sizes={`${WIDTH}px`}
      />

      {/* His number, where a shirt would carry it. Absent for most of the pool —
          Fantrax and FPL both leave it null more often than not — and absent is
          simply no chip rather than a chip with a dash in it. */}
      {squadNumber === null ? null : (
        <span className="numeric absolute bottom-1 right-1 rounded bg-bg/70 px-1.5 text-2xs font-bold text-cream">
          {squadNumber}
        </span>
      )}

      {/* The crest sits on the portrait rather than beside the name: it is the
          same identifying fact as the colour behind him, and putting it in the
          heading would say his club twice in two registers. */}
      {club ? (
        <Image
          src={crestUrl(club)}
          alt=""
          width={22}
          height={22}
          className="absolute left-1 top-1 h-5 w-5 drop-shadow-[0_1px_2px_oklch(0_0_0/0.5)]"
        />
      ) : null}
    </div>
  );
}
