import type { MatchEventKind, PlayerMatchStats } from "../../football/types";
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

/** One thing that happened, and when.
 *
 *  **This is what the report was missing, and its absence is why the column read
 *  as a ledger.** The brief used to say in as many words *"you have each man's
 *  stat line and nothing else — you do not know the order anything happened"*,
 *  so a writer with no sequence could only enumerate: every sentence came out as
 *  `name, number, owner`, and one filed headline set a MINUTE in a scoreline's
 *  grammar ("Isidor Twenty-Six, Fulham Nil") because the only figures beside the
 *  man were his minutes and his points.
 *
 *  The Premier League's own feed publishes the minute, and now so does this. */
export interface MatchReportEvent {
  /** As the clock prints it — `"26"`, `"90+2"`. */
  minute: string;
  kind: MatchEventKind;
  /** The man it happened to: the scorer, the booked man, the one coming on. */
  player: string;
  /** The second man where the event has one — the assister, or the man going
   *  off. Null when it does not. */
  other: string | null;
}

/** What a side actually did, for the two or three figures a report can carry.
 *
 *  Deliberately five and not the hundred and seventy the provider publishes: a
 *  match report quotes a figure to make a point, and a writer handed every Opta
 *  metric writes a spreadsheet — which is the failure this is fixing, not one to
 *  repeat at higher resolution.
 *
 *  **Nought is a real nought here.** The provider omits a metric worth zero, and
 *  the mapper that reads it defaults accordingly; null means we had no stats for
 *  the match at all, which is a different sentence. */
export interface MatchReportSide {
  club: string;
  possession: number | null;
  shots: number | null;
  onTarget: number | null;
  corners: number | null;
  fouls: number | null;
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
  /** Every goal, card and substitution, oldest first. Empty when the round's
   *  commentary could not be read — and the instruction changes with it, so a
   *  writer is never told it has a timeline it has not got. */
  events: readonly MatchReportEvent[];
  /** Both sides' figures, or null when the provider had no stats for this
   *  fixture. Null rather than zeroes: "nobody had a shot" is a claim. */
  sides: readonly [MatchReportSide, MatchReportSide] | null;
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

  // The spine of the report, and the reason it stopped being a ledger. When the
  // commentary could not be read this is empty and the instruction says so
  // instead — a writer is never told it has a timeline it has not got.
  const timeline = brief.events.map((e) => `- ${e.minute}' ${eventLine(e)}`);

  const numbers =
    brief.sides === null
      ? null
      : brief.sides.map((side) => `- ${side.club}: ${sideLine(side)}`);

  return [
    `MATCH REPORT, gameweek ${brief.gameweek}: ${score}. Full time. THIS FIXTURE AND THIS SCORE GO IN THE DECK.`,
    timeline.length > 0
      ? [
          "HOW THE MATCH WENT, in the order it happened. **This is the spine of the report — write the football first and the fantasy consequence second.** A minute is a minute and never a score: `26'` is when Isidor scored, not a figure to set beside a nil. Quote a minute where it earns its place and do not list them all.",
          ...timeline,
        ].join("\n")
      : "YOU DO NOT HAVE THE ORDER anything happened in this match — only each man's stat line. Do not imply a sequence, an opening goal or a turning point. Report what the men did.",
    numbers === null
      ? null
      : [
          "THE TWO SIDES, in figures. One or two of these make a point; all of them make a spreadsheet. A side with most of the ball and no goals is a story, and so is the opposite.",
          ...numbers,
        ].join("\n"),
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

/** One event, in the vernacular a report is written in rather than a feed's.
 *
 *  The pairing is positional and its meaning is the event's, which is why this
 *  is a switch and not a template: for a goal the second man made it, and for a
 *  substitution he is the one coming off. */
function eventLine(event: MatchReportEvent): string {
  switch (event.kind) {
    case "goal":
      return `GOAL ${event.player}${event.other === null ? "" : `, assisted by ${event.other}`}`;
    case "penalty-goal":
      return `GOAL ${event.player}, from the penalty spot`;
    case "own-goal":
      return `OWN GOAL ${event.player}`;
    case "disallowed-goal":
      return `${event.player} had one ruled out by VAR`;
    case "yellow-card":
      return `${event.player} booked`;
    case "red-card":
      return `${event.player} SENT OFF`;
    case "substitution":
      return `${event.player} on${event.other === null ? "" : `, ${event.other} off`}`;
  }
}

/** A side's figures, dropping the ones the provider had nothing for. */
function sideLine(side: MatchReportSide): string {
  const parts: string[] = [];
  if (side.possession !== null) parts.push(`${side.possession}% of the ball`);
  if (side.shots !== null) {
    parts.push(
      side.onTarget === null ? `${side.shots} shots` : `${side.shots} shots (${side.onTarget} on target)`,
    );
  }
  if (side.corners !== null) parts.push(`${side.corners} corners`);
  if (side.fouls !== null) parts.push(`${side.fouls} fouls`);
  return parts.length === 0 ? "no figures published" : parts.join(", ");
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
