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
  /** His Premier League club, for the row he belongs on and its crest. */
  clubName: string;
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
  // By CLUB, because that is the unit the news arrives in and the unit a reader
  // scans. Grouping by OUR managers made it a column about the league's mood
  // when what a draft manager opens it for is what was said about his players.
  const byClub = new Map<string, { code: number; lines: PresserLine[] }>();
  for (const line of brief.lines) {
    const row = byClub.get(line.clubName) ?? { code: line.club, lines: [] };
    row.lines.push(line);
    byClub.set(line.clubName, row);
  }

  const clubs = [...byClub.entries()].map(([club, row]) => {
    const men = row.lines.map((line) => {
      const firm = line.confidence >= FIRM ? "" : " (a hint, not a fact)";
      return `${line.playerName} — ${MEANS[line.tag] ?? line.tag}${firm}, per ${line.manager}; owned by ${line.ownerName}`;
    });
    return `- ${club} (code ${row.code}): ${men.join(" · ")}`;
  });

  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. What the managers said about men somebody in this league owns. This is an information thread and not a column: a draft manager opens it to find out about HIS players before he picks, not to read about the league.`,
    ["WHAT WAS SAID, by club. The code is the club's and you must echo it back exactly:", ...clubs].join("\n"),
    'RETURN A ROW PER CLUB in "teamNews": { "club": the club name exactly as given, "code": the number given on that line, "line": what was said about its players }. The line names the players and what was said, in that order, plainly. One or two sentences.',
    "THE BODY IS A SHORT INTRODUCTION AND NOTHING ELSE. Two or three sentences: how many clubs spoke, and the one thing most worth knowing. The rows carry the news; a body that repeats them is the article written twice.",
    "YOU HAVE NO QUOTES AND MUST NOT WRITE ONE. What you are given is what a manager MEANT. Report the meaning and attribute it — 'per Howe', 'Arteta suggested' — never a sentence in quotation marks.",
    "A HINT IS NOT A FACT. Where a line is marked as a hint, write it as one: 'suggested', 'did not rule out'. Never promote it.",
    "NO ADVICE, and no narrative about our managers. You may say who owns a man, because that is why he is in the article. You may not say what his owner should do, how his week is going, or what it means for his season.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
