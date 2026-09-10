import type { FootballPlayer } from "@epl/core";
import { type Club, type Opposition, kickedOff } from "@epl/core";
import PlayerShirt from "./PlayerShirt";
import { fixtureLabel } from "@epl/core";

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
// **And the number is back on the two pitches that have one** — which is the
// shape CM drew all along, arrived at from the other end. See `PlayerShirt`.

export default function PitchMarker({
  player,
  label,
  name,
  keeper,
  club,
  number = null,
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
  /** His shirt number, on the two pitches where all eleven wear one kit. See
   *  `PlayerShirt`, which owns why it is null everywhere else. */
  number?: number | null;
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
  // has not got is the opposite case: we know exactly which shirt he wore, and
  // drawing a dashed box because his headshot is missing was a habit left over
  // from a pitch made of photographs.
  const nobody = player === null && club === undefined;

  return (
    <div className="relative flex w-full flex-col items-center">
      {nobody ? (
        /* Built to the same shape as a man who resolved, so it stands the same
           height in the line — a hole in the row reads as a formation nobody
           picked. */
        <div className="pitch-figure grid w-full place-items-center border border-dashed border-white/35 bg-black/25">
          <span className="numeric text-2xs font-bold text-white/70">{label}</span>
        </div>
      ) : (
        <PlayerShirt
          club={club}
          keeper={keeper}
          number={number}
          name={name}
          // **`started`, not a bare `kickedOff`.** The attribute was the JSX
          // boolean shorthand, which reads as `kickedOff={true}` and happens to
          // share its name with the imported predicate — so every card on every
          // pitch was drawn at full strength whether or not his club had kicked
          // off, while the `started` this line wanted sat computed two lines up
          // and was spent only on the band below.
          kickedOff={started}
        />
      )}

      {/* **White, on the grass, with no plate under it.**

          **Not yellow, and `19.jpg` is why.** A comment here once claimed CM
          sets its names in yellow and `register-warden` checked the image: the
          names on that tactics pitch are WHITE, and the only yellow on the
          screen is the shape heading, the selection box, the pressed tab and the
          rail's current entry — every one of them a selection or a state, which
          is exactly what `--color-accent` means in DESIGN §3. */}
      <span className="w-full truncate px-0.5 text-center font-display text-2xs font-bold uppercase leading-none text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.95)]">
        {name}
      </span>

      {/* **What he is worth, or who he plays** — and which of the two is the
          caller's to say. The squad screen wants the FIXTURE (Craig, 2 Sep:
          "pitch view on squad page does not need points, just the next fixture
          I guess"), because a squad is about the week ahead; the head-to-head
          wants the points, because that screen is about a score. */}
      <span className="numeric w-full truncate px-0.5 text-center text-3xs font-bold leading-none text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.95)]">
        {band ??
          (show === "fixture"
            ? (fixtureLabel(opposition) ?? club?.shortName ?? "—")
            : started
              ? (points ?? "—")
              : (club?.shortName ?? "—"))}
      </span>
    </div>
  );
}
