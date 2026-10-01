import { DRAFT_NEWS } from "../../config";
import type { DraftMan } from "./types";

// One thread a match-up's story could be told through: its kind and family, whom it is about, what it is worth, the
// beat it belongs in and its facts. The weights are DRAFT_NEWS's. Pure.

export type ThreadKind = keyof typeof DRAFT_NEWS.weight;

/** What kind of story a thread tells: a page, and a side's next report, do not tell one family twice running. */
export type Family = "turn" | "decider" | "margin" | "star" | "setback" | "people" | "season" | "upset" | "chase";

const FAMILY: Record<ThreadKind, Family> = {
  "bench-turned": "turn", comeback: "turn", "lead-lost": "turn", "fightback-short": "turn", "subs-waiting": "turn", "to-play-gap": "turn", "days-won": "turn",
  "same-match": "people",
  "late-decider": "decider", "turning-point": "decider", "late-goal": "decider", crossfire: "decider",
  level: "margin", close: "margin", rout: "margin", "saturday-lead": "margin",
  "one-man-show": "star", haul: "star", "keeper-haul": "star", "star-blank": "star",
  injury: "setback", "clean-lost-late": "setback", "uncovered-blank": "setback", "early-off": "setback", "non-starter": "setback", "bench-six": "setback",
  "old-boy": "people", "new-arrival": "people", debut: "people", "club-mates": "people", double: "people", "double-to-come": "people",
  top: "season", "stayed-top": "season", "meetings-won": "season", record: "season", "streak-ended": "season", "return-to-form": "season", bottom: "season", streak: "season", "season-high": "season",
  "season-low": "season", climb: "season", fall: "season", "going-in": "season",
  upset: "upset",
  chase: "chase", "both-to-come": "chase",
};

/** The match's shape outranks a man's, and a man's the season's, when two threads score alike. */
export type Scope = "match" | "man" | "season";
const MATCH: readonly ThreadKind[] = ["bench-turned", "late-decider", "comeback", "one-man-show", "level", "close", "lead-lost", "fightback-short", "upset", "rout", "turning-point", "chase", "subs-waiting", "to-play-gap", "saturday-lead", "both-to-come", "days-won", "same-match"];

export interface Thread {
  kind: ThreadKind;
  family: Family;
  scope: Scope;
  /** The side it is about; null for the match-up as a whole. */
  teamId: string | null;
  /** The men it is about, the one it is most about first. */
  men: DraftMan[];
  weight: number;
  /** It decided the result, or reached the margin, or built Saturday's lead. */
  decisive: boolean;
  /** The beat it is told in: a London day, null for the substitutions; undefined for none, the season and the margin. */
  beat: string | null | undefined;
  /** Its facts, in the brief's words. */
  facts: string[];
}

/** A thread of a kind at its weight, the bigger one when there is one and `bigger` says so. */
export function thread(kind: ThreadKind, init: { teamId: string | null; facts: string[]; men?: DraftMan[]; beat?: string | null; bigger?: boolean; weight?: number }): Thread {
  const [base, big] = DRAFT_NEWS.weight[kind] as readonly number[];
  const scope: Scope = MATCH.includes(kind) ? "match" : FAMILY[kind] === "season" ? "season" : "man";
  return { kind, family: FAMILY[kind], scope, teamId: init.teamId, men: init.men ?? [], weight: init.weight ?? (init.bigger === true ? (big ?? base) : base), decisive: false, beat: init.beat, facts: init.facts };
}
