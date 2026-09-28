import type { MatchDesk } from "./desk";
import type { ReportsDraft } from "./draft";
import { surname } from "./keyStats";
import { isGoal, type MatchEvent } from "./timeline";

// What a match-day report carries beside its prose, per match: the score block, the pieces, the key stats, the timeline
// and the video. Codes, never per-season ids, and club names resolved at render; refused field by field at the edge.

export type ReportRowKind = "Goal" | "Pen" | "OG" | "VAR" | "Pen missed" | "Pen saved" | "Post" | "Booked" | "Sent off" | "Sub";

export interface StoryReportRow {
  minute: string;
  kind: ReportRowKind;
  side: "home" | "away" | null;
  text: string;
}

export interface StoryReportSection {
  head: string;
  pitch: string;
  stake: string;
}

export interface StoryReport {
  fixtureCode: number;
  kickoff: string;
  home: { code: number; score: number; scorers: string[] };
  away: { code: number; score: number; scorers: string[] };
  halfTime: { home: number; away: number } | null;
  standfirst: string;
  account: string;
  sections: StoryReportSection[];
  keyStats: string[];
  rows: StoryReportRow[];
  referee: string | null;
  managers: { home: string | null; away: string | null };
  /** Each club's next three, "Brentford (h)", resolved when filed. */
  ahead: { home: string[]; away: string[] };
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
    case "substitution": return { ...base, kind: "Sub", text: `${who(e)} for ${e.other === null ? "—" : surname(e.other.name)}${e.injury ? ", injured" : ""}` };
    case "injured-off": return { ...base, kind: "Sub", text: `${who(e)} off injured` };
    default: return null;
  }
}

/** Each side's scorers as the block prints them: "Manzambi 45+4", an own goal marked, a penalty marked. */
function scorers(events: readonly MatchEvent[], side: "home" | "away"): string[] {
  return events
    .filter((e) => isGoal(e) && e.side === side)
    .map((e) => `${who(e)} ${e.minute}${e.kind === "own-goal" ? " og" : e.kind === "penalty-goal" ? " pen" : ""}`);
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
    const { match } = desk;
    const piece = draft.matches.get(match.fixture.code);
    const ahead = (side: "home" | "away") => desk.ahead[side].map((m) => `${m.opponent} (${m.home ? "h" : "a"})`);
    return {
      fixtureCode: match.fixture.code,
      kickoff: match.fixture.kickoff ?? "",
      home: { code: match.home.code, score: match.fixture.homeScore ?? 0, scorers: scorers(desk.events, "home") },
      away: { code: match.away.code, score: match.fixture.awayScore ?? 0, scorers: scorers(desk.events, "away") },
      halfTime: match.halfTime,
      standfirst: piece?.standfirst ?? plainStandfirst(desk),
      account: piece?.account ?? "",
      sections: piece?.sections ?? [],
      keyStats: desk.keyStats.map((k) => k.text),
      rows: desk.events.flatMap((e) => row(e) ?? []),
      referee: match.referee,
      managers: { home: match.home.manager, away: match.away.manager },
      ahead: { home: ahead("home"), away: ahead("away") },
      video: match.videoId,
    };
  });
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : []);
const code = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);
const KINDS: readonly ReportRowKind[] = ["Goal", "Pen", "OG", "VAR", "Pen missed", "Pen saved", "Post", "Booked", "Sent off", "Sub"];

function side(raw: unknown): StoryReport["home"] | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const c = code(r.code);
  return c === null || typeof r.score !== "number" ? null : { code: c, score: r.score, scorers: strs(r.scorers) };
}

/** A match prints with both sides and a standfirst, or not at all. */
export function normalizeReports(raw: unknown): StoryReport[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const reports = raw.flatMap((entry): StoryReport[] => {
    const r = (entry ?? {}) as Record<string, unknown>;
    const home = side(r.home);
    const away = side(r.away);
    const fixture = code(r.fixtureCode);
    if (home === null || away === null || fixture === null || str(r.standfirst) === "") return [];
    const ht = (r.halfTime ?? null) as Record<string, unknown> | null;
    const managers = (r.managers ?? {}) as Record<string, unknown>;
    const ahead = (r.ahead ?? {}) as Record<string, unknown>;
    return [{
      fixtureCode: fixture,
      kickoff: str(r.kickoff),
      home,
      away,
      halfTime: ht !== null && typeof ht.home === "number" && typeof ht.away === "number" ? { home: ht.home, away: ht.away } : null,
      standfirst: str(r.standfirst),
      account: str(r.account),
      sections: (Array.isArray(r.sections) ? r.sections : []).flatMap((s: Record<string, unknown> | null) =>
        str(s?.head) !== "" && str(s?.pitch) !== "" ? [{ head: str(s?.head), pitch: str(s?.pitch), stake: str(s?.stake) }] : []),
      keyStats: strs(r.keyStats),
      rows: (Array.isArray(r.rows) ? r.rows : []).flatMap((x: Record<string, unknown> | null) =>
        KINDS.includes(x?.kind as ReportRowKind) && str(x?.minute) !== "" ? [{ minute: str(x?.minute), kind: x?.kind as ReportRowKind, side: x?.side === "home" || x?.side === "away" ? x.side : null, text: str(x?.text) }] : []),
      referee: str(r.referee) || null,
      managers: { home: str(managers.home) || null, away: str(managers.away) || null },
      ahead: { home: strs(ahead.home), away: strs(ahead.away) },
      video: /^[\w-]{6,20}$/u.test(str(r.video)) ? str(r.video) : null,
    }];
  });
  return reports.length === 0 ? undefined : reports;
}
