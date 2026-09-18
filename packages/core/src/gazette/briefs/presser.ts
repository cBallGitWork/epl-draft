import type { PresserSignal } from "../../football/intel/pressers";
import { FIRM } from "../../football/intel/pressers";
import { storylinesBlock } from "./storylines";
import type { StoryThread } from "../ledger";

// The Thursday round-up's facts pack. What was said about availability, about
// men somebody in this league owns, and nothing else.

/** One signal, with the two things the brief must carry that the export cannot:
 *  the player's name, and whose problem he is. */
export interface PresserLine extends PresserSignal {
  playerName: string;
  /** The manager in OUR league who owns him. Never null — an unowned man is
   *  filtered out before he reaches here. */
  ownerName: string;
}

/** What each tag actually means, in the words the column may use. The exporter's
 *  vocabulary is not English and a model asked to render `managed_load` will
 *  invent a phrase for it. */
const MEANS: Record<string, string> = {
  rotation_risk: "may be rotated",
  managed_load: "his minutes are being managed",
  injury_scare: "carrying a knock",
};

export function buildPresserBrief(brief: {
  gameweek: number;
  /** Newest first, already filtered to men the league holds. */
  lines: readonly PresserLine[];
  threads: readonly StoryThread[];
}): string {
  const firm = brief.lines.filter((line) => line.confidence >= FIRM);
  const soft = brief.lines.filter((line) => line.confidence < FIRM);

  const render = (line: PresserLine) =>
    `- ${line.playerName} (${line.ownerName}'s): ${line.manager} — ${MEANS[line.tag] ?? line.tag}`;

  return [
    `THE TEAM SHEET, gameweek ${brief.gameweek}. What the managers said this week about men somebody in this league owns. Lineups are not locked yet, which is the whole point: this is the column a manager reads before he picks.`,
    firm.length > 0
      ? ["SAID PLAINLY. These are firm enough to lead on:", ...firm.map(render)].join("\n")
      : null,
    soft.length > 0
      ? ["HINTED. Softer, and you must write them as hints rather than as facts — 'suggested', 'did not rule out', never 'confirmed':", ...soft.map(render)].join("\n")
      : null,
    "YOU HAVE NO QUOTES AND MUST NOT WRITE ONE. What you are given is what a manager MEANT, extracted from a press conference; the sentence he actually said is not here. Report the meaning and attribute it — 'Arteta suggested', never 'Arteta said: \"...\"'.",
    "NO ADVICE. Do not tell anybody to bench a man, start one, or claim one. You report what was said and whose problem it is; the reader is a better judge of his own side than you are.",
    "Two or three short paragraphs, grouped by what it means for OUR managers rather than by club — a reader wants his own name, not a tour of the Premier League.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
