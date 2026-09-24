import { londonDate, londonTime } from "../../time";
import type { PastLine } from "../predictions/past";
import type { PredictionCall } from "../predictions/pick";
import type { PredictionRecord } from "../predictions/record";
import type { PredictionSide } from "../predictions/sides";
import { tieFacts } from "./predictionFacts";

// Lawro's brief: the round ahead, tie by tie, with every call already made. Withheld: the totals,
// the scores, any man's figure, anybody's line-up, and the paper's storylines, which carry last
// round's benchings and "the numbers" into a column that may print neither.

export interface PredictionsTie {
  home: PredictionSide;
  away: PredictionSide;
  call: PredictionCall;
}

/** Null when no tie can be called, which files nothing and spends nothing. */
export function buildLawroBrief(brief: {
  gameweek: number;
  locksAt: string;
  teams: readonly { teamId: string; name: string }[];
  ties: readonly PredictionsTie[];
  record: PredictionRecord;
  past: readonly PastLine[];
}): string | null {
  if (!brief.ties.some((tie) => tie.call.callsTeamId !== null)) return null;
  const named = new Map(brief.teams.map((team) => [team.teamId, team.name]));
  const name = (teamId: string) => named.get(teamId) ?? teamId;

  return [
    `LAWRO'S PREDICTIONS, gameweek ${brief.gameweek}. Filed before line-ups lock at ${londonTime(brief.locksAt)} on ${londonDate(brief.locksAt)}, and nobody has kicked a ball. Every call below is already made: you write the reasoning, never the call. Never change a call, hedge it or predict a draw.`,
    `THE ${brief.teams.length} MANAGERS, named exactly as here; the id in brackets is what you return, never the name: ${brief.teams.map((team) => `${team.name} [${team.teamId}]`).join(", ")}.`,
    recordBlock(brief.record, name),
    "WHAT YOU KNOW IS THE SQUADS: who each manager holds, the men signed for this round, the table and the results. Nobody's line-up is public until the lock, so you do not know who starts, who is picked, who is left out or who is on anybody's bench, and you never write as though you do. The order of a side's men is our own reading, and no man has a figure you may print.",
    ...brief.ties.map((tie, at) => tieBlock(at + 1, brief.ties.length, tie, name)),
    brief.past.length === 0
      ? null
      : ["WHO YOU ARE, beyond the opening of your instructions. Every line is true. Use one at most, in your own words, only inside a tie it bears on, and never to introduce yourself:", ...brief.past.map((line) => `- ${line.line}`)].join("\n"),
  ]
    .filter((block): block is string => block !== null)
    .join("\n\n");
}

function tieBlock(index: number, count: number, tie: PredictionsTie, name: (teamId: string) => string): string {
  const { home, away, call } = tie;
  const heading = `TIE ${index} of ${count}: ${home.name} [${home.teamId}] v ${away.name} [${away.teamId}]`;
  const shape = `Write it in "ties" with homeTeamId "${home.teamId}" and awayTeamId "${away.teamId}"`;
  if (call.callsTeamId === null) {
    return [heading, "NO CALL: the desk cannot call this tie. Write two or three sentences on the men who matter and back nobody.", ...tieFacts(index, home, away, call), `${shape}, and "backs" null.`].join("\n");
  }
  const backing = name(call.callsTeamId);
  const favourite = call.instinct === null ? backing : name(call.callsTeamId === home.teamId ? away.teamId : home.teamId);
  const why =
    call.instinct !== null
      ? `A GUT CALL: on paper this is close and ${favourite} are the favourites. You are going against them because of T${index}-gut. Give that reason in your own words, and no other, in two to five sentences.`
      : call.close
        ? "It is close. Two to five sentences."
        : `${backing} are clear favourites. Two to five sentences.`;
  return [heading, `YOUR CALL: ${backing}. ${why}`, ...tieFacts(index, home, away, call), `${shape}, and "backs" "${call.callsTeamId}". The page prints your prediction and the score under your words, so write neither.`].join("\n");
}

function recordBlock(record: PredictionRecord, name: (teamId: string) => string): string {
  if (record.last === null) return "YOUR RECORD: this is your first column in this league, so there is no record to own yet. Do not invent one, and do not introduce yourself: everybody reading knows who you are. Open on the round itself, in a line, before your fall.";
  const { gameweek, marks } = record.last;
  if (marks === null) return `YOUR RECORD: gameweek ${gameweek} is not settled, so there is nothing to own this week. Say nothing about your record.`;
  const gut = marks.gut === null ? "You made no gut calls." : `Your gut calls: ${marks.gut.right} from ${marks.gut.called}.`;
  const misses = marks.misses.map(
    (miss) => `- You had ${name(miss.calledTeamId)}${miss.gut ? " on a gut call" : ""}. ${name(miss.winnerTeamId)} beat ${name(miss.loserTeamId)} ${miss.winnerPoints}-${miss.loserPoints}.`,
  );
  return [
    `YOUR RECORD, the desk's arithmetic. Gameweek ${gameweek}: ${marks.all.right} right from ${marks.all.called}. ${gut}`,
    ...misses,
    "Own it in ONE short sentence at the top, number first, then the gut calls on their own if you made any. No excuses and no boasts. The page prints your season record, so never recite it.",
  ].join("\n");
}
