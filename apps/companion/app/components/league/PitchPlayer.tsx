import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  contribution,
  isGoalkeeper,
  isResolved,
  kickedOff,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import { chipsFor } from "./Chips";
import PlayerImage from "./PlayerImage";
import { positionLabel } from "../../positions";
import { unresolvedShort } from "../../unresolved";
import { NAME_SIZE } from "./PitchRows";

// One player as he stands on the pitch: a cut-out, his name on a dark plate, and
// under it whatever there is to say — his fixture until he kicks off, his
// minutes and what he has done once he has.
//
// It used to be a 1994/95 Merlin sticker: white card, black keyline, the head on
// a flat studio green. Handsome on its own and wrong at fifteen-up, because
// every one of those is a border and a background between the reader and the
// only two things he came for, the face and the fixture. What replaced it is
// what the cut-outs were always asking for — nothing behind them at all.

export default function PitchPlayer({
  rostered,
  club,
  opposition,
  points,
}: {
  rostered: RosteredPlayer;
  /** His club, already looked up. This draws one kit and one crest; handing it
   *  every club in the league so it can find them made two callers do the same
   *  lookup and a third do it twice. */
  club: Club | undefined;
  /** His club's match this round. The strip prints it while there is nothing to
   *  report, which is most of every week. */
  opposition?: Opposition[];
  /** What our league scores him for this period, from Fantrax. Three states:
   *  undefined is no table for this team at all, null is a table that does not
   *  name him, and a number is his. Absent, the strip falls back to his minutes
   *  — a different claim, and told apart by the apostrophe on it. */
  points?: number | null;
}) {
  // A slot the bridge could not settle is still a slot the manager holds, and the
  // three reasons are three different things to do about it — so it says which.
  if (!isResolved(rostered)) {
    return (
      // Built from the same three bands as a player who resolved, so it stands
      // the same height in the line. It used to be one box of its own
      // proportions, which left a hole in the row wherever the bridge had not
      // settled somebody.
      <div className="@container flex w-full flex-col">
        <div className="grid aspect-[1.32] w-full place-items-center rounded-t-[3px] border border-dashed border-white/35 bg-black/25">
          <span className="numeric text-2xs font-bold text-white/70">
            {positionLabel(rostered.slot.position) ?? "?"}
          </span>
        </div>
        <span className="flex h-[var(--pitch-band)] w-full items-center justify-center overflow-hidden bg-cream px-0.5 text-center font-display text-[0.5rem] font-bold uppercase leading-none text-bg">
          <span className="w-full truncate">{rostered.slot.fantraxId}</span>
        </span>
        <span className="flex h-3.5 w-full items-center justify-center overflow-hidden rounded-b-[3px] bg-cream/90 px-0.5 text-center text-[0.5rem] font-bold leading-none text-bg/70">
          <span className="w-full truncate">{unresolvedShort(rostered.unresolved)}</span>
        </span>
      </div>
    );
  }

  const { player, stats } = rostered;
  const t = contribution(stats);
  // His fixture until his match starts, his score after it — asked of the
  // fixture, never of the stat line. FPL carries a stat line for everybody from
  // the round's first whistle.
  const started = kickedOff(opposition);
  // Two is what fits beside the number at this width.
  const chips = chipsFor(t).slice(0, 2);

  return (
    <div className="@container flex w-full flex-col">
      {/* Drawn back until he kicks off, and only the photograph is. It replaced
          the count of players still to play that used to sit on the
          head-to-head tabs: the same fact, said where it names the men rather
          than totting them up. Dimming the whole card said it too, and took the
          fixture colour and the name with it — the two things a waiting player
          still needs. */}
      <PlayerImage
        player={player}
        club={club}
        keeper={isGoalkeeper(rostered.slot.position)}
        kickedOff={started}
      />

      {/* Light plate, dark ink. It was the other way round and the names were the
          hardest thing on the screen to read: white type at nine pixels, on a
          translucent black that let the grass through it, over a pitch. FPL
          print theirs on white for the same reason. */}
      <span
        className={`flex h-[var(--pitch-band)] w-full items-center justify-center overflow-hidden bg-cream px-0.5 text-center font-display font-bold uppercase leading-none tracking-[-0.01em] text-bg ${NAME_SIZE}`}
      >
        <span className="w-full truncate">{player.name}</span>
      </span>

      {/* One band, two things it can be saying, and the same height either way
          — a line whose cards stand at different heights stops reading as a
          line. */}
      {started ? (
        /* What he is worth, on a ground of its own. It was a number beside two
           chips on the same cream as the name above it, at eight or nine
           pixels: the smallest thing on a live pitch and the one a manager came
           for. Dark ink on cream cannot be made loud without shouting over the
           name, so the band flips instead, and the chips' colours read better
           against it than they did fighting the plate.

           Points if we have them, his minutes if we do not — one team's table
           either arrives or it does not, so a side never mixes the two, and the
           apostrophe tells the two claims apart.

           `shrink-0` on the number is load-bearing: without it the chips win
           the squeeze and the number is what gets cut, which is how 90 minutes
           came to be printed as "9". A clipped chip is untidy; a clipped number
           is wrong. */
        <span className="flex h-3.5 items-center gap-px overflow-hidden rounded-b-[3px] bg-bg px-0.5">
          <span className="flex min-w-0 gap-px overflow-hidden">
            {chips.map((chip, at) => (
              <span
                key={chip.label}
                // Sized in container units, like the name above it and for the
                // same reason: a line of seven gives up width rather than
                // wrapping, and type set in pixels does not come with it.
                // The second one goes when the card is too narrow to hold it —
                // a line of seven squeezes cells to about 43px, where two chips
                // and the number overlap. Dropping the lower-ranked chip is a
                // decision; letting them collide is not.
                className={`numeric rounded-[2px] px-0.5 text-[clamp(6px,12cqw,9px)] font-bold leading-none ${
                  chip.className
                } ${at === 1 ? "@max-[3.4rem]:hidden" : ""}`}
              >
                {chip.label}
              </span>
            ))}
          </span>
          <span
            className={`numeric shrink-0 font-bold leading-none text-cream ${
              points === undefined
                ? "text-[clamp(7px,12cqw,9px)]"
                : "text-[clamp(9px,16cqw,13px)]"
            } ${chips.length > 0 ? "ml-auto" : "mx-auto"}`}
          >
            {points === undefined ? `${t.minutes}'` : (points ?? "—")}
          </span>
        </span>
      ) : (
        /* His fixture, at full strength while he waits on it. The FDR colour is
           the whole message and dimming it with him left a grey box. */
        <span className="flex h-3.5 items-stretch overflow-hidden rounded-b-[3px] bg-cream/90 px-0.5">
          <FixtureChip opposition={opposition} blank={club?.shortName ?? "—"} />
        </span>
      )}
    </div>
  );
}
