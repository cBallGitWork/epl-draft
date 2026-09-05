import { isFplKeeper } from "@epl/core";
import type { Club, FootballPlayer, FplLine, FplPick, Opposition } from "@epl/core";
import PitchDisc from "../components/league/PitchDisc";
import PitchRows from "../components/league/PitchRows";

// Your FPL XI on the grass — the same grass as everywhere else.
//
// **It was on the wrong ground and it had its own cell** (Craig, 5 Sep 2026:
// "using the wrong pitch, we use a different pitch elsewhere"). `PitchRows`
// draws two: `CmGround`, the flat 68x105m diagram every other pitch in the app
// asks for with `flat`, and `PitchFrame`, the photographed trapezoid with
// hoardings and a goal. This file passed neither flag, so it fell through to the
// trapezoid — the one ground nothing else uses — and drew a `Sticker` of its own
// beside it.
//
// The sticker's own docblock justified the copy on the grounds that `PitchPlayer`
// "takes a `RosteredPlayer`, which is a Fantrax roster slot joined to a
// footballer, and an FPL pick is neither". That stopped being true on 3 Sep, when
// the disc was changed to take a plain `FootballPlayer` for exactly this reason
// (`PitchDisc`'s own docblock records it), and a Premier League club's predicted
// eleven has gone through it since. So the second occurrence is gone rather than
// kept.
//
// **`inColumn` as well as `flat`**, which `prem/club/[code]/Eleven` records the
// cost of: bleeding is right for a pitch that is the widest thing on a screen,
// and full-bleed made this one 1,132 wide and 1,192 tall — 552px past the fold at
// 1440, of which 622 was empty grass under the keeper. The ratio is on `.pitch`
// and multiplies whatever width it is given, so the width is the only lever.
//
// **Every number here is FPL's, already multiplied.** A captain's 18 is what he
// contributed, not what he scored, which is the number a manager is looking for.

export default function FplPitch({
  rows,
  players,
  clubs,
  opposition,
}: {
  rows: FplLine[];
  players: Map<number, FootballPlayer>;
  clubs: Map<number, Club>;
  /** Each club's fixtures this round, so the disc can tell for itself whether a
   *  man's club has kicked off. It draws him back until it has, and prints his
   *  club rather than a nought — `played.ts`'s predicate is still what the round
   *  total and the bench need, but the grass no longer asks it. */
  opposition: Map<number, Opposition[]>;
}) {
  return (
    // **Bounded by the FOLD, because nothing else bounds it.** `.pitch`'s ratio
    // turns whatever width it is given into a height, and this is the one pitch
    // in the app with no second column beside it — `/squad` and the head-to-head
    // are narrow because a fifteen-row list is next to them, which is why they
    // fit and this did not. `inColumn` only takes back the two gutters.
    //
    // So the caller caps its own width at the height it has: `--pitch-page` is
    // already "what the page spends on everything that is not grass", and
    // `--pitch-ratio` is the same number the aspect-ratio uses, so the two cannot
    // disagree at a breakpoint. Under a thumb the cap lands wider than the screen
    // and does nothing, which is right — the phone already fit.
    //
    // A wrapper rather than a fourth flag on `PitchRows`: one caller needs this,
    // and a shared mechanism for one caller is what CODE_RULES §1 forbids.
    <div className="pitch-fpl mx-auto w-full max-w-[calc((100svh-var(--pitch-page))*var(--pitch-ratio))]">
      <PitchRows rows={rows} keyOf={(pick: FplPick) => String(pick.code)} flat inColumn>
        {(pick) => {
          const player = players.get(pick.code) ?? null;
          return (
            <Pick
              pick={pick}
              player={player}
              club={player === null ? undefined : clubs.get(player.clubId)}
              opposition={player === null ? undefined : opposition.get(player.clubId)}
            />
          );
        }}
      </PitchRows>
    </div>
  );
}

/** One pick: the shared disc, with the armband over it.
 *
 *  **The armband is drawn HERE and not by `PitchDisc`.** It is the one fact on
 *  this pitch that no other pitch has — our league has no captain — so a prop for
 *  it would be a mechanism with one caller, which CODE_RULES §1 forbids by name.
 *  The disc's own root is already `relative`, and this wrapper is the caller's,
 *  so the badge sits over the head without either side knowing about the other.
 *
 *  No club colours on the fill. Eleven picks are eleven different clubs, and
 *  `PitchDisc` records eleven palettes on one pitch as already tried and
 *  rejected — the chrome default is what a pitch with no single team gets. */
function Pick({
  pick,
  player,
  club,
  opposition,
}: {
  pick: FplPick;
  player: FootballPlayer | null;
  club: Club | undefined;
  opposition: Opposition[] | undefined;
}) {
  return (
    <span className="relative block w-full">
      <PitchDisc
        player={player}
        // A pick FPL names and the bootstrap does not — signed since, or an
        // academy name. The disc says so rather than dropping him.
        label="?"
        name={player?.name ?? "—"}
        keeper={isFplKeeper(pick.line)}
        club={club}
        opposition={opposition}
        points={pick.points}
      />
      {/* FPL names both a captain and a vice, and which one actually doubled is
          decided after the fact — so the vice is drawn whether or not there is a
          captain to outrank him. */}
      {pick.isCaptain || pick.isViceCaptain ? (
        <span
          aria-hidden
          className={`absolute left-0.5 top-0.5 z-base grid h-4 w-4 place-items-center rounded-full text-[0.5rem] font-bold ${
            pick.isCaptain ? "bg-info text-bg" : "bg-black/60 text-cream"
          }`}
        >
          {pick.isCaptain ? "C" : "V"}
        </span>
      ) : null}
    </span>
  );
}
