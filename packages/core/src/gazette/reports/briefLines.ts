import { numeral } from "./minutes";
import { played } from "./men";
import { isGoal, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";

// One line per moment and per man, in a reporter's words; the labels carry no provider's name, because the writer copies labels.

const LINES: Record<string, string> = { G: "in goal", D: "in defence", M: "in midfield", F: "up front" };

export function clubOf(match: ReportMatchInput, man: ReportMan): string {
  return match[man.side].name;
}

const who = (match: ReportMatchInput, man: ReportMan | null) => (man === null ? "someone" : `${man.name} (${clubOf(match, man)})`);
const phrases = (event: MatchEvent) => (event.phrases.length === 0 ? "" : ` [${event.phrases.join(" | ")}]`);

function shotWords(event: MatchEvent): string {
  const s = event.shot;
  if (s === null) return "";
  const how = [s.foot === "header" ? "a header" : s.foot === null ? null : `${s.foot === "right foot" ? "right" : "left"}-footed`, s.from, s.to].filter(Boolean).join(", ");
  const from = s.situation === null || s.situation === "penalty" ? "" : `, from ${s.situation === "fast break" ? "a break" : `a ${s.situation}`}`;
  return how.length === 0 ? from : `, ${how}${from}`;
}

/** A moment worth a line in the account; routine shots are left to the figures. */
export function eventLine(match: ReportMatchInput, event: MatchEvent): string | null {
  const man = who(match, event.man);
  const score = event.score === null ? "" : `, ${event.score.home}-${event.score.away}`;
  const maker = event.other === null ? "" : `. Made by ${who(match, event.other)}${event.shot?.supply === null || event.shot?.supply === undefined ? "" : ` with a ${event.shot.supply}`}`;
  switch (event.kind) {
    case "goal":
      return `GOAL${score}: ${man}${shotWords(event)}${maker}.${phrases(event)}`;
    case "penalty-goal":
      return `GOAL FROM THE PENALTY SPOT${score}: ${man}.${phrases(event)}`;
    case "own-goal":
      return `OWN GOAL${score}: ${man} put it into his own net.${phrases(event)}`;
    case "ruled-out":
      return `GOAL RULED OUT after a video review: ${man} had scored${event.other === null ? "" : `, made by ${who(match, event.other)}`}.${phrases(event)}`;
    case "penalty-won":
      return `PENALTY WON by ${man}.${phrases(event)}`;
    case "penalty-conceded":
      return `PENALTY CONCEDED by ${man}.${phrases(event)}`;
    case "penalty-missed":
      return `PENALTY MISSED by ${man}${shotWords(event)}.${phrases(event)}`;
    case "penalty-saved":
      return `PENALTY SAVED: ${man}'s kick was saved.${phrases(event)}`;
    case "woodwork":
      return `HIT THE WOODWORK: ${man}${shotWords(event)}${maker}.${phrases(event)}`;
    case "missed":
      return event.shot?.from === "from very close range" || event.shot?.from === "from inside the six-yard box" ? `MISSED FROM CLOSE IN: ${man}${shotWords(event)}.${phrases(event)}` : null;
    case "booked":
      return `BOOKED: ${man}.${phrases(event)}`;
    case "second-yellow":
      return `SENT OFF for a second booking: ${man}.${phrases(event)}`;
    case "sent-off":
      return `SENT OFF: ${man}.${phrases(event)}`;
    case "substitution":
      // The man coming on and the man going off are separate facts; neither is the other's successor.
      return event.injury ? `INJURY: ${who(match, event.other)} went off injured.${phrases(event)}\n- ON: ${man} came on.${phrases(event)}` : `ON: ${man} came on. OFF: ${who(match, event.other)}.${phrases(event)}`;
    case "injured-off":
      return `INJURY: ${man} went off injured with no changes left.${phrases(event)}`;
    case "var":
      // "No goal" repeats the goal-ruled-out line beside it; the other three decisions are news of their own.
      return event.varCall === null || event.varCall === "no goal" ? null : `VIDEO REVIEW: ${event.varCall}.${phrases(event)}`;
    case "added-time":
      return event.addedMinutes === null ? null : `${event.half === 1 ? "First" : "Second"}-half added time: ${numeral(event.addedMinutes)} minutes.`;
    case "half-time":
    case "full-time":
      return null;
    default:
      return null;
  }
}

/** Everything the report may say about one man. */
export function manLine(match: ReportMatchInput, man: ReportMan, counts: ManCounts | undefined, events: readonly MatchEvent[]): string {
  const goals = events.filter(isGoal);
  const scored = goals.filter((g) => g.kind !== "own-goal" && g.man?.code === man.code).length;
  const made = goals.filter((g) => g.other?.code === man.code).length;
  const parts: string[] = [];
  const line = man.line === null ? null : LINES[man.line];
  if (line !== undefined && line !== null) parts.push(line);
  if (man.started) parts.push(man.startsBefore === 0 && man.matchesBefore > 0 ? "started, his first league start this season" : "started");
  else if (man.onAt !== null) parts.push(`came on, ${man.minutes} minutes played`);
  else parts.push("did not come on");
  if (man.offAt !== null) parts.push(man.injuredOff ? "went off injured" : "was taken off");
  if (played(man)) {
    if (scored > 0) parts.push(`${numeral(scored)} goal${scored === 1 ? "" : "s"}`);
    if (made > 0) parts.push(`${numeral(made)} assist${made === 1 ? "" : "s"}`);
    if (counts !== undefined) {
      parts.push(counts.shots === 0 ? "no shots" : `${numeral(counts.shots)} shot${counts.shots === 1 ? "" : "s"}, ${numeral(counts.onTarget)} on target`);
      if (counts.chancesMade > 0) parts.push(`made ${numeral(counts.chancesMade)} chance${counts.chancesMade === 1 ? "" : "s"}`);
      if (counts.woodwork > 0) parts.push("hit the woodwork");
    }
    if (man.line === "G") parts.push(man.saves === 0 ? "no saves" : `${numeral(man.saves)} save${man.saves === 1 ? "" : "s"}`);
    if (man.goalsSeason > scored && scored > 0) parts.push(`${numeral(man.goalsSeason)} league goals this season`);
  }
  if (man.yellowsBefore >= 3) parts.push(`${numeral(man.yellowsBefore)} bookings this season before today`);
  parts.push(man.holder === null ? "nobody in the league holds him" : `held by ${man.holder.team}, ${man.holder.fielded ? "in their eleven" : "among their reserves"}`);
  if (man.points !== null && man.holder !== null) parts.push(`${man.points} points for ${man.holder.team}`);
  if (man.fitness !== null) parts.push(`fitness since: ${man.fitness}`);
  return `- ${man.name} (${clubOf(match, man)}): ${parts.join("; ")}`;
}
