import type { ReactNode } from "react";

/** Fantrax's live scoreboard refused: one quiet line over a board, saying what below it still holds. */
export default function ScoreboardDown({ refused, children }: { refused: string; children?: ReactNode }) {
  return (
    <p className="px-3 text-2xs text-faint">
      Fantrax&apos;s scoreboard is not answering, so there are no points to show. {children}{" "}
      <span className="numeric">{refused}</span>
    </p>
  );
}
