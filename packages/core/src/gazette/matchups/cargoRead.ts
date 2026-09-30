import type { StoryDraftMatchup, StoryDraftReport, StoryDraftSide } from "./cargo";

// A filed draft report read back field by field: a match-up prints with both sides and its verdict, or not at all.

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v !== null && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const list = <T>(v: unknown, read: (r: Raw) => T | null): T[] => (Array.isArray(v) ? v.flatMap((x) => read(obj(x)) ?? []) : []);

function side(v: unknown): StoryDraftSide | null {
  const r = obj(v);
  const score = num(r.score);
  if (str(r.teamId) === "" || str(r.name) === "" || score === null) return null;
  return { teamId: str(r.teamId), name: str(r.name), score, rankBefore: num(r.rankBefore), rankAfter: num(r.rankAfter), run: /^[WDL]*$/u.test(str(r.run)) ? str(r.run) : "" };
}

export function normalizeDraftReport(raw: unknown): StoryDraftReport | undefined {
  const r = obj(raw);
  const gameweek = num(r.gameweek);
  if ((r.cutoff !== "saturday" && r.cutoff !== "gameweek") || gameweek === null) return undefined;
  const matchups = list(r.matchups, (m): StoryDraftMatchup | null => {
    const [home, away] = [side(m.home), side(m.away)];
    if (home === null || away === null || str(m.verdict) === "") return null;
    const paragraphs = Array.isArray(m.paragraphs) ? m.paragraphs.filter((p): p is string => typeof p === "string" && p !== "") : [];
    return { home, away, verdict: str(m.verdict), standfirst: str(m.standfirst), paragraphs };
  });
  return matchups.length === 0 ? undefined : { cutoff: r.cutoff, gameweek, matchups };
}
