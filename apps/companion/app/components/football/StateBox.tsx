import { availabilityOf } from "@epl/core";
import type { FootballPlayer } from "@epl/core";

// The box beside a name that says why he is not playing.
//
// CM put one on every row of every squad list, and it is the fastest thing on a
// team sheet to read: a red block means do not pick him. FPL's five status
// letters carry the answer and the app rendered them as a border colour on two
// screens, so fourteen of fifteen rows said nothing at all.
//
// Silent for a fit player, and for one the bridge has not settled — the pool
// carries academy names FPL has never listed, and a box reading "fit" on every
// row is noise that makes the one box worth seeing harder to find.

export default function StateBox({ player }: { player: FootballPlayer | null }) {
  const availability = availabilityOf(player);
  if (availability.state === "fit") return null;

  // The chance and the news ride in the title rather than the box: the box has
  // room for a word, and the sentence behind it is worth reading in full on the
  // one row a manager stops at.
  const detail = [
    availability.chance === null ? null : `${availability.chance}% chance of playing`,
    availability.news || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      title={detail || undefined}
      className={`numeric shrink-0 px-1 text-3xs font-bold uppercase leading-[1.5] ${
        availability.out ? "cm-state" : "cm-state-doubt"
      }`}
    >
      {availability.label}
    </span>
  );
}
