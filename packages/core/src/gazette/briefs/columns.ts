import type { StoryThread } from "../ledger";
import type { PowerRow } from "../powerRanking";
import type { Pick } from "../types";
import type { WireFacts } from "../wire";
import { storylinesBlock } from "./storylines";

// The opinion columns' briefs. One file because they share a shape — a facts
// pack, one instruction about what the opinion may be about, and the memory
// block — and splitting four twenty-line builders across four files would be
// filing for its own sake.
//
// The rule they all obey: **the facts are ours and the opinion is the
// model's.** Each of these columns exists to be argued with in the group chat,
// so the writer is given room to be wrong about football and none at all to be
// wrong about what happened.

/** The power rankings: every manager ranked by opinion, expressly not by table. */
export function buildPowerBrief(brief: {
  gameweek: number;
  rows: readonly PowerRow[];
  threads: readonly StoryThread[];
}): string {
  const rows = brief.rows.map(
    (row) =>
      `- ${row.name} (id ${row.teamId}): table ${row.rank}, record ${row.record}, ${row.points} points, ${row.scored} scored${row.round === null ? "" : `, ${row.round}`}`,
  );

  return [
    `THE POWER RANKINGS after gameweek ${brief.gameweek}. Rank all ${brief.rows.length} managers by how good you think they actually are — this is an OPINION column and it is not the table. The table prints on the same page and is Fantrax's arithmetic; your job is to disagree with it where the football says you should. A side flattered by its record should be told so, and a good side with nothing to show for it should be defended.`,
    [
      "THE FACTS. Rank them in `ranks`, using the EXACT ids, best first, with `move` as places gained or lost since your last ranking (0 if you have not ranked them before) and one argumentative line each:",
      ...rows,
    ].join("\n"),
    "Write the body as two short paragraphs of overview — who is going well, who is fooling nobody — and let `ranks` carry one line per manager, every one of them.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** The Points Dodgers: the anti-eleven. */
export function buildDodgersBrief(brief: {
  gameweek: number;
  benched: readonly Pick[];
  threads: readonly StoryThread[];
}): string {
  const men = brief.benched.map((pick) => `- ${pick.playerName} (${pick.position}), left out by ${pick.ownerName}: ${did(pick)}`);

  return [
    `THE POINTS DODGERS, gameweek ${brief.gameweek}. The men who did it while sitting on their own manager's bench. This is the league's best-natured cruelty: name the player, name the manager who benched him, and enjoy it.`,
    [
      "THE BENCHED. What each man DID — never what he would have scored, because a benched player is priced nowhere and any points figure would be invented:",
      ...men,
    ].join("\n"),
    "Two or three short paragraphs. Do not tell anybody how they should have picked their side, and never suggest what they should do next week — you report, you do not advise.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** The Bin: the wire, as trends. */
export function buildWireBrief(brief: {
  gameweek: number;
  facts: WireFacts;
  named: (teamId: string) => string;
  threads: readonly StoryThread[];
}): string {
  const teams = brief.facts.teams.map(
    (row) => `- ${brief.named(row.teamId)}: ${row.claimed} in, ${row.dropped} out`,
  );
  const passed = brief.facts.passedAround.map(
    (player) => `- ${player.playerName}: moved ${player.moves} times${player.dropped ? ", and is on the wire now" : ""}`,
  );

  return [
    `THE BIN, gameweek ${brief.gameweek}. The waiver column: who has been busy, who is churning, and which men the league keeps passing around. ${brief.facts.deals} deals in the window — if that is a quiet week, say so plainly rather than inflating it.`,
    teams.length > 0 ? ["ACTIVITY, by manager:", ...teams].join("\n") : null,
    passed.length > 0 ? ["PASSED AROUND, men moved more than once:", ...passed].join("\n") : null,
    brief.facts.binned.length > 0
      ? `DROPPED and still unclaimed — the obituaries. Give one or two of these three deadpan lines each in the body ("signed in hope, dropped without ceremony, survived by a bench spot"): ${brief.facts.binned.join(", ")}.`
      : null,
    "TRENDS, never a shopping list. Do not tip anybody, do not say who to claim, and do not rate a player's prospects — you report, you do not advise.",
    "THE QUIZ: set 3 to 5 questions in `quiz`, each with its answer, drawn ONLY from the facts in this brief and the round it covers. They print at the foot of the column with the answers upside down, so keep them short and keep them answerable.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** The column over the eleven the page already prints.
 *
 *  It asked for a caption per man until 3 Sep 2026 and Craig cut them: *"the
 *  descriptiosn are the same 'STAT + quippy bit', pure ai shite."* Eleven
 *  one-sentence verdicts, each written from a name, a slot and a stat line, have
 *  nowhere to go but the stat and a flourish. The argument survives; the
 *  annotation does not. */
export function buildElevenBrief(brief: {
  gameweek: number;
  picks: readonly Pick[];
  shape: string;
  threads: readonly StoryThread[];
}): string {
  const men = brief.picks.map(
    (pick) => `- ${pick.playerName} (${pick.position}), ${pick.ownerName}${pick.started ? "" : " — BENCHED by his own manager"}: ${did(pick)}`,
  );

  return [
    `THE TEAM OF THE WEEK, gameweek ${brief.gameweek}, lining up ${brief.shape}. The eleven is already picked and printed — your job is the argument for it, the way a pundit talks you through a side he has chosen and dares anybody to disagree.`,
    ["THE ELEVEN:", ...men].join("\n"),
    "Have opinions about the FOOTBALL and never about facts you were not given. A man marked BENCHED is the best story in the side and should be treated as such.",
    // **A column, and not a caption sheet.** It asked for two short paragraphs
    // plus a sentence per man, and the sentences carried the whole piece — which
    // made the team of the week a table with captions under it rather than the
    // thing it is named for. The captions are gone; the shape of the argument is
    // named here so the prose is an argument rather than eleven verdicts run
    // together.
    "The body is the whole column, four to six short paragraphs. Open on the man of the week and say plainly why he is it. Work through the side by line — the back, the middle, the front — and give the reasons, not the numbers again. Name at least one man who is unlucky to miss out and say who he would have replaced. Finish on the shape or on the week itself.",
    "Never write it as a list. No man gets his own sentence in turn: connect them, argue for the side, and leave out anybody you have nothing to say about.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** What a man actually did, in the vernacular. Shared by the two columns that
 *  print a player's round. */
function did(pick: Pick): string {
  const parts: string[] = [];
  if (pick.goals > 0) parts.push(`${pick.goals}G`);
  if (pick.assists > 0) parts.push(`${pick.assists}A`);
  if (pick.cleanSheet) parts.push("clean sheet");
  if (pick.saves > 0) parts.push(`${pick.saves} saves`);
  return parts.length === 0 ? `${pick.minutes} min` : `${parts.join(", ")} in ${pick.minutes} min`;
}
