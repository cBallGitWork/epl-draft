import type { ReportRowKind, StoryReport, StoryReportSide } from "./cargo";
import type { FantasyMan, FantasyPanel } from "./fantasy";
import type { KeyStat } from "./keyStats";
import type { LineupMan, StoryLineup } from "./lineups";

// A filed match-day report read back field by field: a story is a contract, not a bag, so nothing a writer invented alongside
// the shape reaches the page. A match prints with both sides and a standfirst, or not at all.

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v !== null && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : []);
const list = <T>(v: unknown, read: (r: Raw) => T | null): T[] => (Array.isArray(v) ? v.flatMap((x) => read(obj(x)) ?? []) : []);
const code = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);
const KINDS: readonly ReportRowKind[] = ["Goal", "Pen", "OG", "VAR", "Pen missed", "Pen saved", "Post", "Booked", "Sent off", "Sub"];

function lineupMan(r: Raw): LineupMan | null {
  if (str(r.name) === "") return null;
  const by = obj(r.replacedBy);
  return {
    name: str(r.name),
    booked: r.booked === true,
    sentOff: r.sentOff === true,
    replacedBy: str(by.name) === "" ? null : { name: str(by.name), minute: str(by.minute), booked: by.booked === true },
  };
}

function lineup(v: unknown): StoryLineup | null {
  const r = obj(v);
  const lines = Array.isArray(r.lines) ? r.lines.map((line) => list(line, lineupMan)).filter((line) => line.length > 0) : [];
  return lines.length === 0 ? null : { formation: strOrNull(r.formation), lines, unused: strs(r.unused) };
}

function side(v: unknown): StoryReportSide | null {
  const r = obj(v);
  const c = code(r.code);
  const score = num(r.score);
  if (c === null || score === null) return null;
  return { code: c, score, goals: strs(r.goals), assists: strs(r.assists), manager: strOrNull(r.manager), lineup: lineup(r.lineup), next: strOrNull(r.next) };
}

function fantasyMan(r: Raw): FantasyMan | null {
  return str(r.name) === "" ? null : { name: str(r.name), club: str(r.club), holder: strOrNull(r.holder), points: num(r.points), did: str(r.did) };
}

function fantasy(v: unknown): FantasyPanel {
  const r = obj(v);
  return { motm: fantasyMan(obj(r.motm)), top: list(r.top, fantasyMan), wire: list(r.wire, fantasyMan), offDays: list(r.offDays, fantasyMan) };
}

export function normalizeReports(raw: unknown): StoryReport[] | undefined {
  const reports = list(raw, (r): StoryReport | null => {
    const home = side(r.home);
    const away = side(r.away);
    const fixture = code(r.fixtureCode);
    if (home === null || away === null || fixture === null || str(r.standfirst) === "") return null;
    const ht = obj(r.halfTime);
    return {
      fixtureCode: fixture,
      kickoff: str(r.kickoff),
      home,
      away,
      halfTime: num(ht.home) !== null && num(ht.away) !== null ? { home: num(ht.home)!, away: num(ht.away)! } : null,
      venue: strOrNull(r.venue),
      attendance: num(r.attendance),
      referee: strOrNull(r.referee),
      standfirst: str(r.standfirst),
      account: str(r.account),
      sections: list(r.sections, (s) => (str(s.head) !== "" && str(s.pitch) !== "" ? { head: str(s.head), pitch: str(s.pitch), stake: str(s.stake) } : null)),
      keyStats: list(r.keyStats, (k): KeyStat | null => (str(k.label) !== "" && str(k.value) !== "" ? { label: str(k.label), value: str(k.value) } : null)),
      fantasy: fantasy(r.fantasy),
      rows: list(r.rows, (x) =>
        KINDS.includes(x.kind as ReportRowKind) && str(x.minute) !== ""
          ? { minute: str(x.minute), kind: x.kind as ReportRowKind, side: x.side === "home" || x.side === "away" ? x.side : null, text: str(x.text) }
          : null),
      video: /^[\w-]{6,20}$/u.test(str(r.video)) ? str(r.video) : null,
    };
  });
  return reports.length === 0 ? undefined : reports;
}
