import type { CSSProperties } from "react";
import {
  type Club,
  type DoubtBand,
  type FootballPlayer,
  type Opposition,
  availabilityOf,
  clubColours,
  doubtBand,
  fixtureLabel,
  kickedOff,
  plateOn,
} from "@epl/core";
import EmptySlot from "./EmptySlot";
import PlayerShirt from "./PlayerShirt";
import { NAME_SIZE, PITCH_BAND } from "./PitchRows";

// One player on Championship Manager's pitch: a shirt, a name, and what he is
// worth. The marker half of the `CmGround` pair.
//
// **A kit where this had a cut-out head in a coloured disc** (Craig, 10 Sep
// 2026). Two decisions collapsed into one here and it is worth saying which,
// because both were argued at length in this file and both are now reversed:
//
// · The photograph is gone. Not because it 404s — it answers for about six
//   players in seven — but because the ladder behind it guarantees a line of
//   eleven contains a face, a shirt and a set of initials at once. `PlayerShirt`
//   carries the counting.
// · The disc is gone with it, and so are the `fill`, `outline` and `ink` props
//   that carried the fantasy team's colours onto the grass on 2 Sep. A shirt is
//   110x145 and cannot live in a circle, and Craig's call on the replacement was
//   the kit alone: eleven kits already tell a reader who these men are, and the
//   manager's own colours keep the two places `teamColours.ts` allots them — his
//   title bar, and each side of a head-to-head.
//
// **The name stays, unlike CM's.** The game gets away with bare numbers because
// its squad list stands beside the pitch carrying the same numbers; ours is a
// toggle, so a nameless pitch would be eleven strangers. White on the grass with
// no plate under it: the turf is CM's dark green and white measures 11.58:1 on
// it, and a row of black bars is what made this read as cards on grass rather
// than as a team.
//
// **And no number anywhere** (Craig, 10 Sep 2026: "ditch the number actually").
// One rode on the chest for an afternoon, on the reading that eleven identical
// kits need one to tell them apart; the plate below carries the name at the
// card's full width instead, and every board that LISTS these men still keeps
// the number in the blue index block, which is where CM keeps it.

/** The three grounds, written out.
 *
 *  **A record and not `var(--color-doubt-${band})`**, which is the Tailwind v4
 *  trap DESIGN.md records: v4 drops a theme variable whose name never appears
 *  literally in scanned source, and the interpolated form shipped five
 *  colourless fixture chips once already. A composed token name is a token that
 *  is not there. */
const DOUBT_GROUND: Record<DoubtBand, string> = {
  out: "var(--color-doubt-out)",
  major: "var(--color-doubt-major)",
  slight: "var(--color-doubt-slight)",
};

export default function PitchMarker({
  player,
  label,
  name,
  keeper,
  club,
  opposition,
  points,
  show = "points",
  band,
}: {
  /** The footballer, or null for a slot with nobody behind it.
   *
   *  **Read only to tell an empty slot from a filled one**, and never for the
   *  picture: the kit comes off the CLUB. It stopped being the thing drawn on
   *  10 Sep 2026, when the cut-out did.
   *
   *  **A footballer and not a roster slot.** This took a `RosteredPlayer` until
   *  3 Sep 2026, which is the league layer's own shape and carries a Fantrax id
   *  — so the grass was unreachable for anything that is not a fantasy squad,
   *  and a Premier League club's predicted eleven has no such id and never will.
   *  The callers translate their own vocabulary on the way in, which is where a
   *  layer's words belong. */
  player: FootballPlayer | null;
  /** What the card says when there is neither a man nor a club behind the slot:
   *  a position, a "?". The caller's word, already translated. */
  label: string;
  /** His name as it should read on the grass — the caller's spelling, because
   *  the two layers disagree about it: a fantasy slot the bridge never settled
   *  still has a name to print, and a footballer has his own. */
  name: string;
  /** Whether he keeps goal, which picks the kit `PlayerShirt` draws. A boolean
   *  rather than a letter to test, so neither layer's spelling reaches here. */
  keeper: boolean;
  club: Club | undefined;
  opposition?: Opposition[];
  /** What our league scores him this period. Undefined is no table at all,
   *  null a table that does not name him. */
  points?: number | null;
  /** What the line under his name carries. */
  show?: "points" | "fixture";
  /** A line of the caller's own, which wins over `show`.
   *
   *  For a plate that is neither a score nor a fixture: a club's predicted
   *  eleven puts our league's position there, which is what a fantasy manager
   *  reading a real club's team wants to know. Without it this fell through to
   *  the club's own short name on every card — eleven identical labels saying
   *  nothing. */
  band?: string;
}) {
  const started = kickedOff(opposition);
  // **Nobody at all, which is not the same as nobody FPL has heard of.** A kit
  // is chosen by club code and needs no footballer, so the only slot this cannot
  // draw is one with neither a man nor a club behind it — a fantasy roster line
  // the bridge never settled. A match's team sheet naming somebody the bootstrap
  // has not got is the opposite case: we know exactly which shirt he wore.
  const nobody = player === null && club === undefined;

  // What goes under the name, already resolved, so the band can ask whether
  // there is anything to draw before it takes up a row's worth of height.
  // **`v` in front of it** (Craig, 21 Sep 2026: "pitch view, needs a 'vs' in
  // front of the team name too"). It does not reverse his 2 Sep site-wide rule —
  // a fixture is still `BRE (H)` and never `v BRE` or `@BRE` — because the `v`
  // here is doing different work: under a shirt, three letters on their own read
  // as the club the man plays FOR, which is the club whose kit he is wearing
  // twenty pixels above. The `v` says the line is about somebody else. A list
  // row needs none because its column is headed "Opponent".
  //
  // Only on a real fixture. The fallback is his own club and is exactly the case
  // the `v` would make into a lie.
  const against = fixtureLabel(opposition);
  const line =
    band ??
    (show === "fixture"
      ? (against === null ? (club?.shortName ?? "—") : `v ${against}`)
      : started
        ? String(points ?? "—")
        : (club?.shortName ?? "—"));

  // **The band takes the OPPONENT's colour** (Craig, 10 Sep 2026: "fixture but
  // its just the team colour"). You read Chelsea's blue before you read the
  // three letters on it, which is work no other treatment of this line was
  // doing — it replaced FPL's difficulty colour, so the pitch now says WHO
  // rather than HOW HARD.
  //
  // **Only when the line really is one club's fixture.** A double gameweek names
  // two opponents and has no single colour to take; a band the caller filled
  // with something else — our league's position on a club's predicted eleven —
  // is not a fixture at all. Both fall back to the plain plate rather than
  // borrowing a colour that would be claiming something untrue.
  const single = band === undefined && show === "fixture" && opposition?.length === 1
    ? opposition[0]
    : undefined;
  // **How likely he is to miss, on the name plate** (Craig, 21 Sep 2026: "we
  // need to show that players are a doubt/out better ... red 100% out, orange
  // for a major doubt, yellow for slight doubt"). FPL colours the same bar on
  // its own team screen and the reading is instant across eleven cards, where a
  // letter in a box is not — the box is the LIST's answer and it survives there.
  //
  // `--cm-face` rather than a background of its own: the bevel derives its light
  // and dark corners from that one variable, so the plate stays Championship
  // Manager's plate and only its colour moves. Its ink is `--color-bg` and all
  // three grounds carry it — 5.45:1, 7.09:1, 9.50:1.
  const doubt = doubtBand(availabilityOf(player));
  // **`plateOn` and not a background beside an `inkOn` call**, because its whole
  // reason is that the two are one decision: a ground without the ink that
  // survives it is the half that makes a pale club unreadable. Spurs and Hull
  // are exactly that case here.
  const plate = single === undefined ? undefined : plateOn(clubColours(single.club.shortName));

  return (
    // **An opaque card, and it is a reversal.** This drew its name and its line
    // as white type straight on the grass, on the 31 Aug reading that "a row of
    // black bars is what made this read as cards on grass rather than as a
    // team". Craig put two other sites beside it on 10 Sep and both box the
    // shirt; his call, and DESIGN §2 was always on the box's side — nothing else
    // on the desk prints on the bare ground, and this was the one exception.
    //
    // **A WASH and not a plate** (Craig, 10 Sep 2026: "MORE Transparent, you
    // made it darker"). It went to `raised` and then to the solid desk ground on
    // my misreading of "more opaque", which is the opposite of what he asked
    // for. 45% of the blue-black lets the mow bands through, so the card still
    // reads as something standing ON grass rather than a tile covering it.
    //
    // **And no border and no padding of its own.** Those cost 6px of a 58px card
    // on a phone, on top of the bevel's 4 — a sixth of the card spent on chrome
    // before a letter is drawn. The wash is what separates the card from the
    // field; a keyline round it was saying the same thing a second time and
    // charging the narrowest screen for it.
    <div className="flex w-full flex-col gap-px bg-bg/45">
      {nobody ? (
        /* Built to the same shape as a man who resolved, so it stands the same
           height in the line — a hole in the row reads as a formation nobody
           picked. */
        <EmptySlot label={label} />
      ) : (
        <span className="block px-1 pt-0.5">
          <PlayerShirt club={club} keeper={keeper} name={name} kickedOff={started} />
        </span>
      )}

      {/* **CM's own bevelled plate, in CM's own face.** `cm-bevel` carries the
          light-and-dark corners, the chrome family and the dark ink that reads
          on the grey face, so this is the game's plate rather than a rectangle
          that resembles one.

          **The plates run to the card's edge and the SHIRT is the thing inset.**
          The name is the only identifier left on a pitch of eleven identical
          kits — the match team sheet is exactly that — so every pixel of it is
          spent on letters. The bevel already takes 4px of a 77px card in border
          alone; a card padding either side of that was taking another 8, which
          is `MOSQUE…` instead of `MOSQUERA`. The shirt can afford the inset
          because a kit reads at any width and a truncated name does not. */}
      <span
        className={`cm-bevel uppercase ${PITCH_BAND} ${NAME_SIZE}`}
        style={
          doubt === null
            ? undefined
            : ({ "--cm-face": DOUBT_GROUND[doubt] } as CSSProperties)
        }
      >
        <span className="w-full truncate">{name}</span>
      </span>

      {/* Absent rather than empty: a caller with nothing to say here — the match
          team sheet, whose board underneath says all of it — would otherwise get
          a coloured strip with no words in it. */}
      {line === "" ? null : (
        <span
          // **A FIGURE gets a bigger step than a label** (Craig, 11 Sep 2026:
          // "scores too hard to read"). This band carries two different kinds of
          // thing and was setting both at `text-3xs` — nine pixels, which
          // DESIGN §8 records as the FLOOR on a pitch rather than a size to
          // reach for. A fixture is three letters and a bracket and reads fine
          // down there; a score is the number a manager opened the screen for
          // and was the smallest thing on the card.
          //
          // `PitchPlayer` had already learned this and its own docblock says so
          // — "one figure size for both claims, on the scale. They were two
          // clamps bottoming at 7px and 9px, which made the number a manager
          // came for the smallest thing on a live pitch" — and it sits at
          // `text-xs`. This is the same lesson arriving at the other card, which
          // is what `ROW_FIGURE` went through in tables a week earlier.
          className={`numeric ${show === "points" && band === undefined ? "text-xs" : "text-3xs"} ${PITCH_BAND}`}
          style={
            plate === undefined
              ? { background: "var(--color-bg)", color: "var(--color-cream)" }
              : ({ background: plate.background, color: plate.ink } as CSSProperties)
          }
        >
          <span className="w-full truncate">{line}</span>
        </span>
      )}
    </div>
  );
}
