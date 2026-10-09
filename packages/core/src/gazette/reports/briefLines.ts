import { numeral } from "./minutes";
import { assistsBy, goalsBy, isGoal, type ManCounts, type MatchEvent } from "./timeline";
import { higherFirst } from "./derived";
import type { ReportMan, ReportMatchInput } from "./types";
import { plural } from "../../format";

// The account's moments and the section candidates' football, in a reporter's words; the labels name no provider, because
// the writer copies labels. Bookings and routine changes are the timeline's, so they never reach the brief.

const who = (match: ReportMatchInput, man: ReportMan | null) => (man === null ? "someone" : `${man.name} (${match[man.side].name})`);
const phrases = (event: MatchEvent) => (event.phrases.length === 0 ? "" : ` [${event.phrases.join(" | ")}]`);
const SUPPLY: Record<string, string> = { cross: "a cross", "through ball": "a through ball", "headed pass": "a header", pass: "a pass" };

function made(match: ReportMatchInput, event: MatchEvent): string {
  const s = event.shot;
  const from = s?.situation === "corner" ? " from a corner" : s?.situation === "set piece" ? " from a set piece" : s?.situation === "fast break" ? " on the break" : "";
  return event.other === null ? from : `, made by ${who(match, event.other)} with ${SUPPLY[s?.supply ?? "pass"] ?? "a pass"}${from}`;
}

/** The one goal the desk marks gets its whole description; the rest a scorer, a maker and how it was made. */
function describe(event: MatchEvent): string {
  const s = event.shot;
  if (s === null) return "";
  return [s.foot === "header" ? "a header" : s.foot === null ? null : `${s.foot === "right foot" ? "right" : "left"}-footed`, s.from, s.to].filter(Boolean).join(", ");
}

/** A moment the account may tell, or null for one that belongs to the timeline alone. `misses` are the chances not taken
 *  worth a sentence where they happened. */
export function eventLine(match: ReportMatchInput, event: MatchEvent, full: boolean, decisiveSubs: ReadonlySet<number>, misses: ReadonlySet<MatchEvent>): string | null {
  const man = who(match, event.man);
  const score = event.score === null ? "" : ` ${higherFirst(event.score.home, event.score.away)} to ${event.score.home > event.score.away ? match.home.name : event.score.home < event.score.away ? match.away.name : "neither"}`;
  const level = event.score !== null && event.score.home === event.score.away ? ` ${event.score.home}-${event.score.away}` : score;
  switch (event.kind) {
    case "goal":
    case "penalty-goal":
      return `${full ? "GOAL, DESCRIBE THIS ONE:" : "GOAL:"}${level}. ${man}${event.kind === "penalty-goal" ? " from the penalty spot" : ""}${made(match, event)}${full ? `; ${describe(event)}` : ""}.${phrases(event)}`;
    case "own-goal":
      return `OWN GOAL:${level}. ${man} put it into his own net.${phrases(event)}`;
    case "ruled-out":
      return `GOAL RULED OUT after a video review: ${man} had scored${event.other === null ? "" : `, made by ${who(match, event.other)}`}.${phrases(event)}`;
    case "penalty-missed":
    case "penalty-saved":
      return `PENALTY ${event.kind === "penalty-missed" ? "MISSED" : "SAVED"}: ${man}'s kick.${phrases(event)}`;
    case "second-yellow":
    case "sent-off":
      return `SENT OFF${event.kind === "second-yellow" ? " for a second booking" : ""}: ${man}.${phrases(event)}`;
    case "missed":
    case "saved":
      if (!misses.has(event)) return null;
      return `CHANCE NOT TAKEN: ${man}, ${event.shot?.foot === "header" ? "a header" : "a shot"} ${event.shot?.from ?? ""}${made(match, event)}; ${event.kind === "saved" ? "saved" : "off target"}.${phrases(event)}`;
    case "woodwork":
      return `HIT THE WOODWORK: ${man}.${phrases(event)}`;
    case "substitution":
      // An injury is news; a change is news only when the man who came on scored or made one. Neither is the other's heir.
      if (event.injury) return `INJURY: ${who(match, event.other)} went off injured.${phrases(event)}`;
      return event.man !== null && decisiveSubs.has(event.man.code) ? `ON: ${man} came on, and went on to score or make a goal.${phrases(event)}` : null;
    case "injured-off":
      return `INJURY: ${man} went off injured with no changes left.${phrases(event)}`;
    default:
      return null;
  }
}

/** A section candidate's football, figures only where they tell. */
export function manLine(man: ReportMan, counts: ManCounts | undefined, events: readonly MatchEvent[]): string {
  const goals = events.filter(isGoal);
  const scored = goalsBy(goals, man.code);
  const madeOnes = assistsBy(goals, man.code);
  const parts: string[] = [];
  if (man.started) parts.push(man.startsBefore === 0 && man.matchesBefore > 0 ? "his first league start this season" : "started");
  else if (man.onAt !== null) parts.push("came on");
  if (man.offAt !== null) parts.push(man.injuredOff ? "went off injured" : man.sentOff ? "was sent off" : "was taken off");
  if (scored > 0) parts.push(`${numeral(scored)} ${plural(scored, "goal")}${man.goalsSeason !== null && man.goalsSeason > scored ? `, ${numeral(man.goalsSeason)} in the league this season` : ""}`);
  if (madeOnes > 0) parts.push(`made ${numeral(madeOnes)}`);
  if (counts !== undefined && counts.shots >= 3) parts.push(`${numeral(counts.shots)} shots`);
  if (counts !== undefined && counts.chancesMade >= 3) parts.push(`made ${numeral(counts.chancesMade)} chances`);
  if (man.line === "G" && man.saves >= 3) parts.push(`${numeral(man.saves)} saves`);
  return parts.join("; ");
}
