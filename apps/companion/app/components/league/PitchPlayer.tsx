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
import PlayerShirt, { KIT_RATIO } from "./PlayerShirt";
import { positionLabel } from "../../positions";
import { unresolvedShort } from "../../unresolved";
import { NAME_SIZE, PITCH_BAND } from "./PitchRows";

// One player as he stands on the pitch: his club's kit, his name on a plate, and
// under it whatever there is to say — his fixture until he kicks off, his
// minutes and what he has done once he has.
//
// It used to be a 1994/95 Merlin sticker: white card, black keyline, the head on
// a flat studio green. That gave way to a bare cut-out — nothing behind it at
// all — and the cut-out gave way to the kit on 10 Sep 2026. `PlayerShirt` carries
// why, and the short version is that the photograph's fallback ladder guarantees
// a line of eleven drawn as three different kinds of object.
//
// This is the planner's card and the one pitch a manager can still CHANGE, which
// is why it keeps its plates where `PitchMarker` prints on the grass: a tap
// target wants an edge.

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
      <div className="@container flex w-full flex-col" style={KIT_RATIO}>
        <div className="pitch-figure grid w-full place-items-center border border-dashed border-white/35 bg-black/25">
          <span className="numeric text-2xs font-bold text-white/70">
            {positionLabel(rostered.slot.position) ?? "?"}
          </span>
        </div>
        <span className={`bg-cream font-display text-3xs uppercase text-bg ${PITCH_BAND}`}>
          <span className="w-full truncate">{rostered.slot.fantraxId}</span>
        </span>
        <span className={`bg-cream/90 text-3xs text-bg/70 ${PITCH_BAND}`}>
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
    <div className="@container flex w-full flex-col" style={KIT_RATIO}>
      {/* Drawn back until he kicks off, and only the shirt is. It replaced the
          count of players still to play that used to sit on the head-to-head
          tabs: the same fact, said where it names the men rather than totting
          them up. Dimming the whole card said it too, and took the fixture
          colour and the name with it — the two things a waiting player still
          needs. */}
      <PlayerShirt
        club={club}
        keeper={isGoalkeeper(rostered.slot.position)}
        name={player.name}
        kickedOff={started}
      />

      {/* Light plate, dark ink. It was the other way round and the names were the
          hardest thing on the screen to read: white type at nine pixels, on a
          translucent black that let the grass through it, over a pitch. FPL
          print theirs on white for the same reason.

          The type does not move, so a crowded line truncates. That was going to
          be his SQUAD NUMBER instead — a number a reader can read beats the
          front of a name he cannot — and FPL's `squad_number` is a key that is
          present on all 622 elements and null on every one of them. So the
          graceful end of the rule is the ellipsis, and "Dewsbury-H…" at eleven
          pixels is worth more than "Dewsbury-Hall" at seven.

          **And it stayed the ellipsis.** A number rode on the chest of the OTHER
          pitch card for one afternoon on 10 Sep 2026 and came off again ("ditch
          the number actually"), so no pitch in the app draws one and this
          paragraph describes every card rather than an exception. */}
      <span
        className={`bg-cream font-display uppercase tracking-[-0.01em] text-bg ${PITCH_BAND} ${NAME_SIZE}`}
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
        <span className="flex h-[var(--pitch-band)] items-center gap-px overflow-hidden bg-bg px-0.5">
          <span className="flex min-w-0 gap-px overflow-hidden">
            {chips.map((chip, at) => (
              <span
                key={chip.label}
                // The scale's last step, and it stays there. The second chip
                // goes when the card is too narrow to hold it — a line of seven
                // squeezes cells to about 43px, where two chips and the number
                // overlap. Dropping the lower-ranked chip is a decision; setting
                // both of them at six pixels so they fit is not.
                className={`numeric px-0.5 text-3xs font-bold leading-none ${
                  chip.className
                } ${at === 1 ? "@max-[3.4rem]:hidden" : ""}`}
              >
                {chip.label}
              </span>
            ))}
          </span>
          <span
            // One figure size for both claims, on the scale. They were two
            // clamps bottoming at 7px and 9px, which made the number a manager
            // came for the smallest thing on a live pitch.
            className={`numeric shrink-0 text-xs font-bold leading-none text-cream ${
              chips.length > 0 ? "ml-auto" : "mx-auto"
            }`}
          >
            {points === undefined ? `${t.minutes}'` : (points ?? "—")}
          </span>
        </span>
      ) : (
        /* His fixture, at full strength while he waits on it. The FDR colour is
           the whole message and dimming it with him left a grey box. */
        <span className="flex h-[var(--pitch-band)] items-stretch overflow-hidden bg-cream/90 px-0.5">
          <FixtureChip opposition={opposition} blank={club?.shortName ?? "—"} />
        </span>
      )}
    </div>
  );
}
