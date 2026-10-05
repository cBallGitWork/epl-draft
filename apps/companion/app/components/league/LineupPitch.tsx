import type { SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import BenchStrip from "./BenchStrip";
import EmptySlot from "./EmptySlot";
import { KIT_RATIO } from "./PlayerShirt";
import SquadMarker from "./SquadMarker";
import type { PitchRow } from "./PitchRows";
import PitchRows, { widestLine } from "./PitchRows";
import { withOpenings } from "./openings";
import { leaguePositionLabel } from "../../positions";

// The XI on the grass and the bench under it, one target per player: tap him to
// pick him, tap him again for everywhere else he can go.
//
// Each card used to carry a badge in its corner opening the full list. Fifteen
// of them is fifteen permanent accent dots over the only thing on the screen
// worth looking at, to offer a move most taps are not after — and the second tap
// was already spare, because tapping the picked man again only deselected him.
//
// A bench and not fifteen on the pitch, which is what a rival's squad gets. The
// difference is the whole point of this screen: on your own team the
// active/reserve split is the decision being made, so it has to be the thing you
// are looking at.

/** How a player may be tapped right now.
 *
 *  `blocked` is the state that makes a quick swap legible: with somebody picked,
 *  everyone he cannot legally change places with goes dim, so the answer to "who
 *  can come off for him" is the set of players still lit rather than a list to
 *  read.
 *
 *  **Named for the tap and not for the man.** It was `Availability`, which is
 *  what `@epl/core` calls a footballer's fitness — two types one import apart,
 *  one about whether he is injured and one about whether you may press him. */
export type PickState = "picked" | "swappable" | "blocked" | "idle";

function Player({
  player,
  pick,
  onPick,
}: {
  player: SquadPlayerDetail;
  pick: PickState;
  onPick: () => void;
}) {
  const name = playerName(player.rostered);
  const picked = pick === "picked";
  const dim = pick === "blocked";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={dim}
      aria-pressed={picked}
      // What the tap will do, which is three different things depending on where
      // the screen already is. A ring is legible to everybody else; a screen
      // reader gets the sentence.
      aria-label={
        picked
          ? `Everywhere ${name} can go`
          : pick === "swappable"
            ? `Swap with ${name}`
            : name
      }
      className={`block w-full transition-opacity ${
        picked ? "ring-2 ring-accent" : ""
      } ${pick === "swappable" ? "ring-1 ring-accent/60" : ""} ${dim ? "opacity-30" : ""}`}
    >
      {/* **The fixture, not his own club.** A planner is a pre-deadline screen by
          construction — it is the round you can still change — so the line under
          the name is who his club plays, in that opponent's own colour, which is
          what `squad/[teamId]`'s locked eleven already asks for. `show="points"`
          falls back to his OWN short name before kickoff, and eleven cards each
          naming the club printed on the shirt above them say nothing. */}
      <SquadMarker player={player} show="fixture" />
    </button>
  );
}

/** A free place in a line the picked man can move into, the kit's shape; a tap puts him there. */
function Opening({ position, onPlace }: { position: string; onPlace: () => void }) {
  const label = leaguePositionLabel(position);
  return (
    <button type="button" onClick={onPlace} aria-label={`Move to ${label}`} style={KIT_RATIO} className="block min-h-11 w-full px-1 pt-0.5">
      <EmptySlot label={label} />
    </button>
  );
}

export default function LineupPitch({
  rows,
  bench,
  pickStateOf,
  onPick,
  openings,
  onPlace,
  inColumn = false,
}: {
  rows: PitchRow<SquadPlayerDetail>[];
  bench: SquadPlayerDetail[];
  /** Fill a column rather than bleeding through the page's gutters — what the
   *  desk does, where the list stands beside the grass inside one panel. */
  inColumn?: boolean;
  pickStateOf: (player: SquadPlayerDetail) => PickState;
  onPick: (player: SquadPlayerDetail) => void;
  /** The positions the picked man can move into with nobody coming off. */
  openings: string[];
  onPlace: (position: string) => void;
}) {
  const lines = withOpenings(rows, openings);
  // One number for the grass and the strip — see `TeamSheet`.
  const widest = widestLine([...lines, { players: bench }]);

  const cell = (player: SquadPlayerDetail) => (
    <Player player={player} pick={pickStateOf(player)} onPick={() => onPick(player)} />
  );

  return (
    // `pitch-with-bench`: the strip below the grass is this page's, so the
    // card's height budget has to know about it. See `pitch.css`.
    //
    // Second occurrence of this expression, so it is copied rather than named
    // (CODE_RULES §1). A third pitch with nothing beside it earns a recipe.
    <div className="pitch-with-bench flex flex-col">
      {/* **The same card a rival's eleven draws** (Craig, 21 Sep 2026: "pitch
          view using old crap UI ... USE THIS code for pitch view ui (and get it
          shared)"). The planner had a sticker of its own — a cream name plate, a
          fixture chip in FPL's difficulty colours and two contribution chips
          beside the score — against `PitchMarker`'s bevelled plate and the
          opponent's own colour. Two cards for the same man on two tabs, and this
          was the one nobody else had been maintaining. `SquadMarker` is the
          translation both now share. */}
      <PitchRows
        rows={lines}
        keyOf={(at) => (typeof at === "string" ? `open-${at}` : at.rostered.slot.fantraxId)}
        widest={widest}
        inColumn={inColumn}
      >
        {(at) => (typeof at === "string" ? <Opening position={at} onPlace={() => onPlace(at)} /> : cell(at))}
      </PitchRows>

      <BenchStrip bench={bench} rows={lines.length} widest={widest} inColumn={inColumn}>
        {cell}
      </BenchStrip>
    </div>
  );
}
