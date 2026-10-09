import { DASH } from "../../format";
import type { MatchDesk } from "./desk";
import type { ReportsDraft } from "./draft";
import type { FantasyPanel } from "./fantasy";
import type { KeyStat } from "./keyStats";
import { surname } from "./keyStats";
import type { StoryLineup } from "./lineups";
import type { StarMan } from "./star";
import { isGoal, type MatchEvent } from "./timeline";
import type { Side } from "../side";

// What a match-day report carries beside its prose, per match, laid out as BBC Sport sets a match: the
// header (crests, score, FT and HT, goals and assists by side, venue and attendance), the pieces, and a sidebar of the line-ups
// with our marks, the Star man, the top league scorers, key stats and the timeline. Codes only; names of clubs at render.

export type ReportRowKind = "Goal" | "Pen" | "OG" | "VAR" | "Pen missed" | "Pen saved" | "Post" | "Booked" | "Sent off" | "Sub";

interface StoryReportRow {
  minute: string;
  kind: ReportRowKind;
  side: Side | null;
  text: string;
}

interface StoryReportSection {
  head: string;
  pitch: string;
  stake: string;
}

export interface StoryReportSide {
  code: number;
  score: number;
  /** "Manzambi 45+4", as the header prints them. */
  goals: string[];
  assists: string[];
  manager: string | null;
  lineup: StoryLineup | null;
  /** "Brentford (h)", resolved when filed. */
  next: string | null;
}

export interface StoryReport {
  fixtureCode: number;
  kickoff: string;
  home: StoryReportSide;
  away: StoryReportSide;
  halfTime: { home: number; away: number } | null;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  standfirst: string;
  account: string;
  sections: StoryReportSection[];
  keyStats: KeyStat[];
  fantasy: FantasyPanel;
  /** Absent on a report filed before marks; null when nobody was rated. */
  star?: StarMan | null;
  rows: StoryReportRow[];
  video: string | null;
}

const who = (e: MatchEvent) => (e.man === null ? "" : surname(e.man.name));

function row(e: MatchEvent): StoryReportRow | null {
  const base = { minute: e.minute, side: e.side };
  const made = e.other === null ? "" : ` (${surname(e.other.name)})`;
  switch (e.kind) {
    case "goal": return { ...base, kind: "Goal", text: `${who(e)}${made}` };
    case "penalty-goal": return { ...base, kind: "Pen", text: who(e) };
    case "own-goal": return { ...base, kind: "OG", text: who(e) };
    case "ruled-out": return { ...base, kind: "VAR", text: `${who(e)} goal ruled out` };
    case "penalty-missed": return { ...base, kind: "Pen missed", text: who(e) };
    case "penalty-saved": return { ...base, kind: "Pen saved", text: who(e) };
    case "woodwork": return { ...base, kind: "Post", text: who(e) };
    case "booked": return { ...base, kind: "Booked", text: who(e) };
    case "second-yellow": return { ...base, kind: "Sent off", text: `${who(e)}, second booking` };
    case "sent-off": return { ...base, kind: "Sent off", text: who(e) };
    case "substitution": return { ...base, kind: "Sub", text: `${who(e)} for ${e.other === null ? DASH : surname(e.other.name)}${e.injury ? ", injured" : ""}` };
    case "injured-off": return { ...base, kind: "Sub", text: `${who(e)} off injured` };
    default: return null;
  }
}

/** The desk's own standfirst for a match whose piece failed twice: the result, and nothing it cannot stand behind. */
export function plainStandfirst(desk: MatchDesk): string {
  const { home, away, fixture } = desk.match;
  const [h, a] = [fixture.homeScore ?? 0, fixture.awayScore ?? 0];
  if (h === a) return `${home.name} and ${away.name} drew ${h}-${a}.`;
  return h > a ? `${home.name} beat ${away.name} ${h}-${a}.` : `${away.name} won ${a}-${h} at ${home.name}.`;
}

export function reportsCargo(desks: readonly MatchDesk[], draft: ReportsDraft): StoryReport[] {
  return desks.map((desk) => {
    const { match, events } = desk;
    const piece = draft.matches.get(match.fixture.code);
    const goals = events.filter(isGoal);
    const side = (s: Side): StoryReportSide => ({
      code: match[s].code,
      score: (s === "home" ? match.fixture.homeScore : match.fixture.awayScore) ?? 0,
      goals: goals.filter((g) => g.side === s).map((g) => `${who(g)} ${g.minute}${g.kind === "own-goal" ? " og" : g.kind === "penalty-goal" ? " pen" : ""}`),
      assists: goals.filter((g) => g.side === s && g.other !== null && g.kind !== "own-goal").map((g) => `${surname(g.other!.name)} ${g.minute}`),
      manager: match[s].manager,
      lineup: match.lineups?.[s] ?? null,
      next: desk.next[s] === null ? null : `${desk.next[s]!.opponent} (${desk.next[s]!.home ? "h" : "a"})`,
    });
    return {
      fixtureCode: match.fixture.code,
      kickoff: match.fixture.kickoff ?? "",
      home: side("home"),
      away: side("away"),
      halfTime: match.halfTime,
      venue: match.venue,
      attendance: match.attendance,
      referee: match.referee,
      standfirst: piece?.standfirst ?? plainStandfirst(desk),
      account: piece?.account ?? "",
      sections: piece?.sections ?? [],
      keyStats: desk.keyStats,
      fantasy: desk.fantasy,
      star: desk.star,
      rows: events.flatMap((e) => row(e) ?? []),
      video: match.videoId,
    };
  });
}
