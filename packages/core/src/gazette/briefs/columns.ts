import type { StoryThread } from "../ledger";
import type { Marked, PredictionTie } from "../predictions";
import type { PowerRow } from "../powerRanking";
import type { Pick } from "../types";
import type { WireFacts } from "../wire";
import { figure } from "./figure";
import { storylinesBlock } from "./storylines";

// The opinion columns' briefs. One file because they share a shape — a facts
// pack, one instruction about what the opinion may be about, and the memory
// block — and splitting five twenty-line builders across five files would be
// filing for its own sake.
//
// The rule they all obey: **the facts are ours and the opinion is the
// model's.** Each of these columns exists to be argued with in the group chat,
// so the writer is given room to be wrong about football and none at all to be
// wrong about what happened.

/** The predictions column: every tie called, and last week's score owned. */
export function buildPredictionsBrief(brief: {
  gameweek: number;
  ties: readonly PredictionTie[];
  marked: Marked | null;
  threads: readonly StoryThread[];
}): string {
  const ties = brief.ties.map(
    (tie) =>
      `- ${tie.homeName} (id ${tie.homeTeamId}) v ${tie.awayName} (id ${tie.awayTeamId}): Fantrax projects ${figure(tie.homeProjected)} to ${figure(tie.awayProjected)}`,
  );

  return [
    `THE PREDICTIONS, gameweek ${brief.gameweek}. Lineups are locked and nobody has kicked a ball. The only numbers you have are Fantrax's own projections — a projection is not a score, and you must never write about one as though the football has happened.`,
    [
      "THE TIES. Call every one of them: one entry per tie in `ties`, using the EXACT ids given, and set `callsTeamId` to whoever you think wins. You may set it to null where a tie is genuinely too close, but do it rarely — a pundit who calls nothing cannot be wrong and is not worth reading. You will be marked on these next week.",
      ...ties,
    ].join("\n"),
    brief.marked === null
      ? null
      : `YOUR LAST COLUMN: you called ${brief.marked.right} of ${brief.marked.called}. Own it in ONE line — briefly, with some humour, and without a paragraph of excuses.`,
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** The power rankings: the sixteen ranked by opinion, expressly not by table. */
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
    "Write the body as two short paragraphs of overview — who is going well, who is fooling nobody — and let `ranks` carry the sixteen lines.",
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
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** Crooks-shaped captions over the eleven the front page already prints. */
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
    `THE TEAM OF THE WEEK, gameweek ${brief.gameweek}, lining up ${brief.shape}. The eleven is already picked and printed — your job is the captions, the way a pundit justifies a side he has chosen and dares anybody to disagree.`,
    ["THE ELEVEN:", ...men].join("\n"),
    "Write ONE caption per man in `captions`, keyed by his name exactly as given, a single sentence each. Have opinions about the FOOTBALL and never about facts you were not given. A man marked BENCHED is the best story in the side and should be treated as such.",
    "The body is two short paragraphs on the side as a whole: who was outstanding, and who is unlucky to miss out.",
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
