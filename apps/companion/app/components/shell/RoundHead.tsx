import type { ReactNode } from "react";
import { SMALL_CAPS } from "@/app/desk";

// The strip at the head of one round's block of matches: which gameweek it is,
// and whatever that screen has to add about it.
//
// **Three copies, and the third one had lost the gameweek** (counted 7 Sep
// 2026). `prem/Rounds` and `league/results` wrote the same string byte for byte
// — `cm-bevel flex h-7 items-center px-1.5 font-chrome text-2xs font-bold
// uppercase text-ink` — and `league/schedule/RoundHeader` wrote a fourth
// spelling of it that said DEADLINE and a date and never named the round at all.
// Craig, 7 Sep 2026: *"this doesnt actually show what gameweek it is"*. A
// schedule whose blocks are headed by a date asks the reader to work out which
// round he is looking at from a Saturday.
//
// So the gameweek is the component's own, not a caller's string: the one thing
// all three heads must say is the one thing a caller cannot get wrong.
//
// **`text-ink` and `font-chrome` are gone and neither was doing anything.**
// `.cm-bevel` sets both `color: var(--color-bg)` and `font-family:
// var(--font-chrome)` unlayered, which beats a `@layer utilities` declaration
// whatever the class order — so the plate was already the right ink and the
// right face at all three sites. The ink one is worth naming: `--color-ink` on
// this plate is 2.27:1 (DESIGN §2, a plate owns its ink), so what those two
// sites asked for was a contrast failure and what saved them was the cascade.

export default function RoundHead({
  gameweek,
  title,
  children,
}: {
  gameweek: number;
  /** What is played in it, when the list holds one competition: "Round 1". */
  title?: string;
  /** What this screen adds about the round — the schedule's deadline and its
   *  live mark. Absent on the two archives, where the round is finished and the
   *  scorelines under it have already said so. */
  children?: ReactNode;
}) {
  return (
    <h2 className={`cm-bevel flex h-7 items-center justify-between gap-3 px-1.5 ${SMALL_CAPS}`}>
      <span className="shrink-0">
        Gameweek {gameweek}
        {title === undefined ? null : ` · ${title}`}
      </span>
      {children}
    </h2>
  );
}
