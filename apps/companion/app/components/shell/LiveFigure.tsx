import type { LiveTie } from "./liveTie";
import { DASH } from "@epl/core";
import Glyph from "./glyphs";
import { scoreSize } from "./scoreSize";

// Your tie's score in the Live tab's glyph slot, the first of a double header's two; the match clock when there is
// no tie of yours to count.

export default async function LiveFigure({ tie }: { tie: Promise<LiveTie[]> }) {
  const [live] = await tie;
  if (live === undefined) return <Glyph name="live" />;
  const score = `${live.yours ?? DASH}–${live.theirs ?? DASH}`;
  return <span className={`numeric font-bold leading-6 ${scoreSize(score)}`}>{score}</span>;
}
