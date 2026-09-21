import type { SquadPlayerDetail } from "@epl/core";
import type { PitchRow } from "./PitchRows";
import { playerName } from "@epl/core";
import PitchPlayer from "./PitchPlayer";
import PitchRows, { FAR_INSET, GAP_CLASS, cardBasis, rowBudget, widestLine } from "./PitchRows";
import { positionLabel } from "../../positions";

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
 *  read. */
export type Availability = "picked" | "swappable" | "blocked" | "idle";

function Player({
  player,
  availability,
  onPick,
}: {
  player: SquadPlayerDetail;
  availability: Availability;
  onPick: () => void;
}) {
  const name = playerName(player.rostered);
  const picked = availability === "picked";
  const dim = availability === "blocked";

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
          : availability === "swappable"
            ? `Swap with ${name}`
            : name
      }
      className={`block w-full transition-opacity ${
        picked ? "ring-2 ring-accent" : ""
      } ${availability === "swappable" ? "ring-1 ring-accent/60" : ""} ${dim ? "opacity-30" : ""}`}
    >
      <PitchPlayer
        rostered={player.rostered}
        club={player.club}
        opposition={player.opposition}
        points={player.points}
      />
    </button>
  );
}

export default function LineupPitch({
  rows,
  bench,
  availabilityOf,
  onPick,
  inColumn = false,
}: {
  rows: PitchRow<SquadPlayerDetail>[];
  bench: SquadPlayerDetail[];
  /** Fill a column rather than bleeding through the page's gutters — what the
   *  desk does, where the list stands beside the grass inside one panel. */
  inColumn?: boolean;
  availabilityOf: (player: SquadPlayerDetail) => Availability;
  onPick: (player: SquadPlayerDetail) => void;
}) {
  // One number for the grass and the strip — see `TeamSheet`.
  const widest = widestLine([...rows, { players: bench }]);

  const cell = (player: SquadPlayerDetail) => (
    <Player
      player={player}
      availability={availabilityOf(player)}
      onPick={() => onPick(player)}
    />
  );

  return (
    // `pitch-with-bench`: the strip below the grass is this page's, so the
    // card's height budget has to know about it. See `globals.css`.
    //
    // **And the width is capped at the fold**, for the reason `fpl/FplPitch`
    // carries in full: `.pitch`'s ratio turns whatever width it is given into a
    // height, and the planner is the other pitch with no second column beside it
    // — `pitchfit` measured it 1,213 wide and 1,464 tall at 1440, **564px past
    // the fold**, on the one screen a manager picks his side on. The cap reads
    // `--pitch-page`, which this element has just set to the bench's own budget,
    // so the two agree by construction.
    //
    // Second occurrence of this expression, so it is copied rather than named
    // (CODE_RULES §1). A third pitch with nothing beside it earns a recipe.
    <div className="pitch-with-bench flex flex-col">
      {/* **Flat, like every other eleven in the app** (Craig, 21 Sep 2026: "youre
          using an old crap pitch, use the flat 2d we use elsewhere"). He said the
          same of the FPL tab on 5 Sep and `PitchRows` has carried the rule since:
          a screen about ARRANGEMENT gets Championship Manager's diagram, and the
          photographed trapezoid is for a picture of a real pitch. The planner was
          the last trapezoid, on the claim that it is the one you can still
          change — which is a claim about what the cards DO and never about what
          the ground under them should look like. */}
      <PitchRows
        rows={rows}
        keyOf={(player) => player.rostered.slot.fantraxId}
        widest={widest}
        inColumn={inColumn}
      >
        {cell}
      </PitchRows>

      {/* Off the pitch, and off the grass. A bench on green of its own put four
          cut-outs on the same colour they were standing on ten pixels above,
          with nothing but a shade between the two — the players stopped being on
          a pitch and the bench stopped being a bench. Dark, against the app's
          own surfaces, is the separation the strip was asking for. */}
      {/* A manager with all fifteen active has no bench, and an empty strip is a
          bordered full-bleed bar saying nothing. `TeamSheet` already guards it. */}
      {bench.length === 0 ? null : (
        <section className="bleed border-t border-line bg-surface pb-3 pt-3">
          {/* The pitch's own inset — see `cardBasis`. */}
          <ul
            className={`flex justify-center ${GAP_CLASS}`}
            // The grass's own row count, so a reserve stands the same height as the
            // man he would replace — the strip is one row but it is not sized as one.
            style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows.length) }}
          >
            {bench.map((player) => (
              <li
                key={player.rostered.slot.fantraxId}
                className="min-w-0 shrink-0"
                style={{ flexBasis: cardBasis(widest) }}
              >
                <p className="pb-0.5 text-center font-display text-3xs font-bold uppercase text-faint">
                  {positionLabel(player.rostered.slot.position) ?? "—"}
                </p>
                {cell(player)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
