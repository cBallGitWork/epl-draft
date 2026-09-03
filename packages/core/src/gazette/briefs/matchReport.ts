import type { PlayerMatchStats } from "../../football/types";
import type { StoryThread } from "../ledger";
import type { TieState } from "../tieState";
import { figure } from "./figure";
import { storylinesBlock } from "./storylines";

// The facts one match report may use and nothing else. Same doctrine as the
// round brief: the instruction lives with the data, and what the writer must
// not mention is withheld rather than forbidden.

export interface MatchReportMan {
  name: string;
  /** The roster slot, Fantrax's letter, or null when they did not say. */
  position: string | null;
  stats: PlayerMatchStats;
  /** What he scored HIS OWNER, priced at the slot he was filed in — Fantrax's
   *  own number and the only points this league has. Null when Fantrax has not
   *  priced him. */
  points: number | null;
}

export interface MatchReportOwner {
  owner: string;
  players: MatchReportMan[];
}

export interface MatchReportTie {
  homeName: string;
  awayName: string;
  homePoints: number | null;
  awayPoints: number | null;
  state: TieState;
}

export interface MatchReportBrief {
  gameweek: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  /** Every league squad with a man in this fixture, most men first. */
  owners: MatchReportOwner[];
  /** The live head-to-heads those men are playing in. */
  ties: MatchReportTie[];
  threads: readonly StoryThread[];
}

export function buildMatchReportBrief(brief: MatchReportBrief): string {
  const score =
    brief.homeScore !== null && brief.awayScore !== null
      ? `${brief.home} ${brief.homeScore}–${brief.awayScore} ${brief.away}`
      : `${brief.home} v ${brief.away}`;

  const owners = brief.owners.map((squad) =>
    [
      `${squad.owner}:`,
      ...squad.players.map(
        (man) =>
          `- ${man.name} (${man.position ?? "?"}): ${statLine(man.stats)} — ${
            man.points === null ? "not priced" : `${man.points} points`
          }`,
      ),
    ].join("\n"),
  );

  const ties = brief.ties.map(
    (tie) =>
      `- ${tie.homeName} ${figure(tie.homePoints)} v ${figure(tie.awayPoints)} ${tie.awayName}${
        tie.state === "open" ? ", still open" : ", all but decided"
      }`,
  );

  return [
    `MATCH REPORT, gameweek ${brief.gameweek}: ${score}. Full time. THIS FIXTURE AND THIS SCORE GO IN THE DECK. You have each man's stat line and nothing else — you do not know the order anything happened.`,
    [
      "THE ROSTERED MEN, by the manager who owns him. Half the story: the fixture and its score above are the other half, and the deck must name them. A man who PLAYED and returned no goal, assist or clean sheet blanked, and a blank from a big name IS coverage. A man on 0 min did not play at all — that is squad news, never a blank, and you do not know why he was left out. These are the only men you can see: a goal in the score above may belong to a man nobody in this league owns, so state the score and never account for it.",
      ...owners,
    ].join("\n"),
    ties.length > 0
      ? ["THE HEAD-TO-HEADS these men are playing in, as they stand right now. A tie marked still open is NOT decided — frame consequence, never verdicts:", ...ties].join("\n")
      : null,
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** A stat line in the vernacular the writer may quote: only what happened,
 *  nothing invented, minutes always first so a cameo reads as one.
 *
 *  **Only countable football, never FPL's scoring.** `bonus` and `bps` are
 *  FPL's own points system and this league does not play under it — handing
 *  the writer "3 bonus" invites a sentence about points nobody in the league
 *  is paid. What a man was worth to his owner is Fantrax's number, and it
 *  arrives beside this line rather than inside it. */
export function statLine(stats: PlayerMatchStats): string {
  const parts = [`${stats.minutes} min`];
  if (stats.goals > 0) parts.push(`${stats.goals}G`);
  if (stats.assists > 0) parts.push(`${stats.assists}A`);
  if (stats.cleanSheet) parts.push("CS");
  if (stats.saves > 0) parts.push(`${stats.saves} saves`);
  if (stats.penaltiesSaved > 0) parts.push(`${stats.penaltiesSaved} pen saved`);
  if (stats.penaltiesMissed > 0) parts.push(`${stats.penaltiesMissed} pen missed`);
  if (stats.ownGoals > 0) parts.push(`${stats.ownGoals} OG`);
  if (stats.redCards > 0) parts.push("sent off");
  else if (stats.yellowCards > 0) parts.push("booked");
  return parts.join(", ");
}
