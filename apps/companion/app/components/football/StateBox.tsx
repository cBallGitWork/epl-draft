import { availabilityOf } from "@epl/core";
import type { FootballPlayer } from "@epl/core";
import { MINOR_CAPS } from "@/app/desk";

// The box beside a name that says why he is not playing; silent for a fit man and one the bridge has not settled.

export default function StateBox({ player }: { player: FootballPlayer | null }) {
  const availability = availabilityOf(player);
  if (availability.state === "fit") return null;

  // The chance and the news ride in the title: the box has room for a word.
  const detail = [
    availability.chance === null ? null : `${availability.chance}% chance of playing`,
    availability.news || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      title={detail || undefined}
      className={`numeric shrink-0 px-1 ${MINOR_CAPS} leading-[1.5] ${
        availability.out ? "cm-state" : "cm-state-doubt"
      }`}
    >
      {availability.label}
    </span>
  );
}
