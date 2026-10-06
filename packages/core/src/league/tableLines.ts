// The lines across the league table. Fantrax's playoff says how many reach
// the semis; the prize, the play-in for the last semi place and the Plate are ours, so they are declared here.

export interface TableLine {
  /** The place the line is drawn under; it is the cut for what it names. */
  under: number;
  label: string;
}

/** How many sides play for the last semi place: the last to qualify and the first below. */
const PLAY_IN = 2;
/** The Plate's last place; the play-in's loser joins it. */
const PLATE_THROUGH = 8;

/** The lines for a table of `teams`, top first. `semis` is Fantrax's playoff count, null when it runs none. */
export function tableLines(semis: number | null, teams: number): TableLine[] {
  if (semis === null) return [];
  const lines = [
    { under: 1, label: "£30 · picks semi opponent" },
    { under: semis - 1, label: "Playoffs" },
    { under: semis - 1 + PLAY_IN, label: "Play-in" },
    { under: PLATE_THROUGH, label: "Plate" },
  ];
  // Each below the one above, and never under the bottom row, which would announce a cut nobody missed.
  return lines.filter(
    (line, at) => line.under < teams && lines.slice(0, at).every((above) => above.under < line.under),
  );
}
