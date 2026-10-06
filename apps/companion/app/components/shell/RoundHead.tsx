import type { ReactNode } from "react";
import { SMALL_CAPS } from "@/app/desk";

// The strip heading one gameweek's block of matches; the gameweek is printed here so no caller can leave it out.
// No ink colour or font family here: unlayered `.cm-bevel` sets both, and `--color-ink` on the plate would be 2.27:1.

export default function RoundHead({
  gameweek,
  children,
}: {
  gameweek: number;
  /** What the screen adds about the gameweek, such as the schedule's deadline. */
  children?: ReactNode;
}) {
  return (
    <h2 className={`cm-bevel flex h-7 items-center justify-between gap-3 px-1.5 ${SMALL_CAPS}`}>
      <span className="shrink-0">Gameweek {gameweek}</span>
      {children}
    </h2>
  );
}
