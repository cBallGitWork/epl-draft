import { howMany } from "../../format";
import type { StoryThread } from "../ledger";
import type { PowerRow } from "../powerRanking";
import type { Pick } from "../types";
import type { WireFacts } from "../wire";
import { storylinesBlock } from "./storylines";

// The opinion columns' briefs: the facts are ours, the opinion is the model's.

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
    `THE BIN, gameweek ${brief.gameweek}. The waiver column: who has been busy, who is churning, and which men the league keeps passing around. ${howMany(brief.facts.deals, "deal")} in the window — if that is a quiet week, say so plainly rather than inflating it.`,
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

/** The column arguing for the eleven the page already prints, never a caption per man. */
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
    // The argument's shape is named so the prose argues rather than running eleven verdicts together.
    "The body is the whole column, four to six short paragraphs. Open on the man of the week and say plainly why he is it. Work through the side by line — the back, the middle, the front — and give the reasons, not the numbers again. Name at least one man who is unlucky to miss out and say who he would have replaced. Finish on the shape or on the week itself.",
    "Never write it as a list. No man gets his own sentence in turn: connect them, argue for the side, and leave out anybody you have nothing to say about.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** What a man did, in shorthand: "1G, 1A in 90 min". */
function did(pick: Pick): string {
  const parts: string[] = [];
  if (pick.goals > 0) parts.push(`${pick.goals}G`);
  if (pick.assists > 0) parts.push(`${pick.assists}A`);
  if (pick.cleanSheet) parts.push("clean sheet");
  if (pick.saves > 0) parts.push(howMany(pick.saves, "save"));
  return parts.length === 0 ? `${pick.minutes} min` : `${parts.join(", ")} in ${pick.minutes} min`;
}
