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
//
// **He no longer carries his shirt number.** It moved into the title bar, where
// Championship Manager puts it: `3. Michael Ball (Everton)` (`cm9900/11.jpg`).
// A number on the portrait AND in the heading is the club said twice, which is
// the fault the crest comment below already names.

/** How wide he is drawn here, and what the optimizer may serve for it. One
 *  number for the same reason it is one number in `PlayerPortrait`: written out
 *  separately they drift, and a soft photograph is not something anyone thinks
 *  to blame a class name for.
 *
 *  **176, up from 112, and the source is what changed.** This file used to be
 *  bounded by `portraits.ts`'s recorded ceiling of 220x280 — 112 CSS px is 224
 *  device px on a 2x phone, which was the whole of it. The Premier League also
 *  publishes 500x500 under the same prefix and nothing here knew (probed 4 Sep
 *  2026), so 176 is now 352 device px against a 500px source with room to
 *  spare. */
const WIDTH = 176;

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
  const colours = clubColours(club?.shortName ?? "");

  return (
    <div
      className="relative shrink-0 overflow-hidden "
      style={{ backgroundColor: colours.primary, width: WIDTH }}
    >
      {/* `kickedOff` is true because this page has no round in it. Drawn back
          means "he has not kicked off yet", which is a statement about a
          Saturday, and on a profile there is no Saturday to make it about. */}
      <PlayerImage
        player={player}
        club={club}
        keeper={isGoalkeeper(position)}
        kickedOff
        large
        sizes={`${WIDTH}px`}
      />

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
