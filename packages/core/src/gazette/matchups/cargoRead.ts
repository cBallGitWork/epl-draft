import { DRAFT_NEWS } from "../../config";
import type { StoryFace } from "../face";
import type { AngleRecord } from "./angle";
import type { StoryDraftMatchup, StoryDraftReport, StoryDraftSide } from "./cargo";
import type { Family, ThreadKind } from "./thread";
import type { StoryDraftStep } from "./days";
import type { StoryDraftReturn, StoryDraftReturns, StoryDraftRow } from "./elevens";
import type { NextMatch } from "./types";
import { finiteOrNull as num, recordOrEmpty as obj, stringOrEmpty as str, stringsOrEmpty as strings, textOrNull } from "../../untrusted";

// A filed draft report read back field by field: a match-up prints with both sides and its result, or not at all; a
// return, a row or a step that does not read is dropped, and a report filed before them reads with none.

type Raw = Record<string, unknown>;
const list = <T>(v: unknown, read: (r: Raw) => T | null): T[] => (Array.isArray(v) ? v.flatMap((x) => read(obj(x)) ?? []) : []);

function scorer(r: Raw): StoryDraftReturn | null {
  const count = num(r.count);
  if (str(r.name) === "" || count === null || count < 1) return null;
  const minutes = Array.isArray(r.minutes) ? r.minutes : [];
  // Every goal timed, or none: a part-timed list would print fewer minutes than goals.
  const timed = minutes.length === count && minutes.every((m) => typeof m === "string" && /^\d+(\+\d+)?$/u.test(m));
  return { name: str(r.name), count, minutes: timed ? (minutes as string[]) : [] };
}

function returns(v: unknown): StoryDraftReturns {
  const r = obj(v);
  return { goals: list(r.goals, scorer), assists: list(r.assists, scorer), cleanSheets: list(r.cleanSheets, scorer) };
}

function next(v: unknown): NextMatch | null {
  const r = obj(v);
  return str(r.opponent) === "" || typeof r.home !== "boolean" || str(r.kickoff) === "" ? null : { opponent: str(r.opponent), home: r.home, kickoff: str(r.kickoff) };
}

function row(r: Raw): StoryDraftRow | null {
  if (str(r.name) === "" || str(r.slot) === "") return null;
  return { name: str(r.name), slot: str(r.slot), points: num(r.points), next: next(r.next), mark: r.mark === "sub" || r.mark === "dnp" ? r.mark : null };
}

function step(r: Raw): StoryDraftStep | null {
  const [home, away] = [num(r.home), num(r.away)];
  const day = r.day === null ? null : str(r.day);
  return home === null || away === null || day === "" ? null : { day, home, away };
}

const FAMILIES: readonly Family[] = ["turn", "decider", "margin", "star", "setback", "people", "season", "upset", "chase"];

function angle(v: unknown): AngleRecord | null {
  const r = obj(v);
  const [kind, family] = [str(r.kind), str(r.family)];
  if (!(kind in DRAFT_NEWS.weight) || !FAMILIES.includes(family as Family)) return null;
  return { kind: kind as ThreadKind, family: family as Family, teamIds: strings(r.teamIds), cast: strings(r.cast) };
}

function face(v: unknown): StoryFace | null {
  const r = obj(v);
  const [code, clubId] = [num(r.code), num(r.clubId)];
  return code === null || clubId === null || str(r.name) === "" ? null : { code, name: str(r.name), clubId, position: textOrNull(r.position) };
}

function side(v: unknown): StoryDraftSide | null {
  const r = obj(v);
  const score = num(r.score);
  if (str(r.teamId) === "" || str(r.name) === "" || score === null) return null;
  return {
    teamId: str(r.teamId),
    name: str(r.name),
    score,
    rankBefore: num(r.rankBefore),
    rankAfter: num(r.rankAfter),
    run: /^[WDL]*$/u.test(str(r.run)) ? str(r.run) : "",
    returns: returns(r.returns),
    eleven: list(r.eleven, row),
    bench: list(r.bench, row),
  };
}

export function normalizeDraftReport(raw: unknown): StoryDraftReport | undefined {
  const r = obj(raw);
  const gameweek = num(r.gameweek);
  if ((r.cutoff !== "saturday" && r.cutoff !== "gameweek") || gameweek === null) return undefined;
  const matchups = list(r.matchups, (m): StoryDraftMatchup | null => {
    const [home, away] = [side(m.home), side(m.away)];
    if (home === null || away === null || str(m.verdict) === "") return null;
    return { home, away, verdict: str(m.verdict), standfirst: str(m.standfirst), paragraphs: strings(m.paragraphs), byDay: list(m.byDay, step), story: angle(m.story), face: face(m.face) };
  });
  return matchups.length === 0 ? undefined : { cutoff: r.cutoff, gameweek, matchups };
}
