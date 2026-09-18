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
  /** The manager in OUR league who owns him, or null when nobody does. Not a
   *  filter: an unowned man with a fitness note is who you claim. */
  ownerName: string | null;
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
      // The owner in brackets after the name, which is how a team-news thread
      // marks one — not a clause. Craig, 18 Sep: "dont need to keep saying
      // owned by (just put manager name in brackets)".
      const who = line.ownerName === null ? "" : ` (${line.ownerName})`;
      const soft = line.confidence >= FIRM ? "" : " [HINT, not a fact]";
      return `${line.playerName}${who} — ${MEANS[line.tag] ?? line.tag}, said by ${line.manager}${soft}`;
    });
    return `- ${club} (code ${row.code}): ${men.join(" · ")}`;
  });

  const owned = brief.lines.filter((line) => line.ownerName !== null).length;

  return [
    `TEAM NEWS, gameweek ${brief.gameweek}. What the managers said before the deadline. A draft manager reads this to decide who to start AND who to claim, so it covers every man mentioned, not only the ones somebody owns.`,
    [`WHAT WAS SAID, by club — ${brief.lines.length} men across ${byClub.size} clubs, ${owned} of them owned in this league. The code is the club's and you must echo it back exactly:`, ...clubs].join("\n"),
    'RETURN A ROW PER CLUB in "teamNews": { "club": the club name exactly as given, "code": the number given on that line, "line": what was said about its players }.',
    'THE ROW IS WRITTEN, not a list. Two or three sentences per club that a reader actually reads: what was said, what it leaves open, and what it means for whether the man plays. A row that reads "X may be rotated, per Y" for every club is the same sentence three times and is worth nobody\'s attention.',
    'MARK THE OWNER IN BRACKETS after the name, once — "Mukiele (123)". Never "owned by", never a clause about his manager. A man with no bracket is unowned, which is information too: he is the one you can claim.',
    "VARY HOW YOU ATTRIBUTE. Not 'per X' every time — a manager says, reports, confirms, plays down, refuses to be drawn, leaves open. Repeating one construction down the column is the tell that nobody wrote it.",
    "THE BODY IS A SHORT INTRODUCTION. Two or three sentences: what the day amounted to and the single thing most worth knowing. Never a retelling of the rows.",
    "YOU HAVE NO QUOTES AND MUST NOT WRITE ONE. You are given what a manager MEANT. Report the meaning; never a sentence in quotation marks.",
    "A HINT IS A HINT. Where a line is marked HINT, write it as one — 'suggested', 'did not rule out', 'stopped short of'. Never promote it to a fact.",
    "NO ADVICE, and no narrative about our managers. Name the owner; do not tell him what to do, or discuss his week.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
