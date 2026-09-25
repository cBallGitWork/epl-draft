import Image from "next/image";
import { type Club, type FootballPlayer, clubColoursOf, crestUrl, isGoalkeeper } from "@epl/core";
import PlayerImage from "../../components/league/PlayerImage";

// The masthead of a page about one footballer: the cut-out on his club's colour, crest top-left.
// A banner across a phone; on a desk a column as tall as the grid beside it, filled to the edge
// (Craig, 25 Sep 2026: "not using all the thumbnail so its cut off mid box").

/** What the optimizer may serve: the whole phone's width, or the desk column's. */
const SIZES = "(min-width: 1024px) 13rem, 100vw";

export default function Portrait({
  player,
  club,
  position,
}: {
  player: FootballPlayer;
  club: Club | undefined;
  /** The league's letter for him, only to pick which of the two kits the
   *  fallback draws. A keeper in an outfield shirt is the kind of quiet
   *  wrongness that survives review. */
  position: string | null;
}) {
  const colours = clubColoursOf(club);

  return (
    <div
      className="relative shrink-0 overflow-hidden [--pitch-figure:1.8] max-lg:[&_img]:object-contain max-lg:[&_img]:object-bottom lg:w-52 lg:[&_.pitch-figure]:h-full"
      style={{ backgroundColor: colours.primary }}
    >
      {/* `kickedOff`: a profile has no Saturday, so he is never drawn back. */}
      <PlayerImage
        player={player}
        club={club}
        keeper={isGoalkeeper(position)}
        kickedOff
        large
        sizes={SIZES}
      />

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
