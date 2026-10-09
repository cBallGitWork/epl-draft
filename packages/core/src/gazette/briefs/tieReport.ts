import type { StoryThread } from "../ledger";
import { figure } from "./figure";
import { storylinesBlock } from "./storylines";

// The facts behind one finished head-to-head: the tie call's full-time twin, adding the men who did it.

/** One side of a finished tie: his total, and the men who made it. */
interface TieReportSide {
  name: string;
  points: number | null;
  /** His scorers this period, best first, priced at the roster slot each was filed in. */
  scorers: readonly { name: string; position: string | null; points: number }[];
}

interface TieReportBrief {
  gameweek: number;
  home: TieReportSide;
  away: TieReportSide;
  threads: readonly StoryThread[];
}

/** How many of a side's men the brief names: enough to describe a round, few enough to choose from. */
const SCORERS_NAMED = 6;

function side(each: TieReportSide): string {
  if (each.scorers.length === 0) {
    return `${each.name} ${figure(each.points)} — no man of his has been priced yet.`;
  }
  const named = each.scorers
    .slice(0, SCORERS_NAMED)
    .map((man) => `${man.name}${man.position === null ? "" : ` (${man.position})`} ${man.points}`)
    .join(", ");
  return `${each.name} ${figure(each.points)} — ${named}.`;
}

export function buildTieReportBrief(brief: TieReportBrief): string {
  const { home, away, gameweek } = brief;
  // No margin, never nought, when either side is unpriced.
  const margin =
    home.points === null || away.points === null
      ? null
      : Math.abs(home.points - away.points);

  return [
    `THE TIE, gameweek ${gameweek}. ${home.name} ${figure(home.points)}, ${away.name} ${figure(away.points)}.${
      margin === null ? "" : ` ${margin === 0 ? "Level." : `Margin ${margin}.`}`
    }`,
    side(home),
    side(away),
    "The round is over and these are final. Write the TIE: what settled it, which men did it, and what the manager on the wrong end has to be annoyed about. Two managers, and no others — this is one head-to-head and not a round-up of the league.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
