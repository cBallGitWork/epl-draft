import { DRAFT_DESK } from "../../config";
import type { FormGame, FormResult } from "../../league/form";
import { possessive } from "./words";

// The round in the season's terms, for the draft report's Football Manager register (Craig, 29 Sep 2026): streaks, runs
// ended, a return to form, the season's records, and a side's own high and low. Each fact carries its kind, so the
// writer can frame it in FM's words, and states only what the results show. Pure.

export type FormKind = "streak" | "streak-ended" | "return-to-form" | "record" | "season-high" | "season-low";

export interface FormFact {
  teamId: string;
  kind: FormKind;
  text: string;
}

/** One side's round, at the end of it. */
export interface RoundSide {
  teamId: string;
  name: string;
  opponent: string;
  for: number;
  against: number;
}

const resultOf = (s: RoundSide): FormResult => (s.for > s.against ? "W" : s.for < s.against ? "L" : "D");

/** How many results at the end of a run pass the test, counting back. */
function trailing(run: readonly FormResult[], keep: (r: FormResult) => boolean): number {
  let n = 0;
  for (let i = run.length - 1; i >= 0 && keep(run[i]); i--) n++;
  return n;
}

/** The run's current streak in words, or null: n wins or defeats in a row, or n unbeaten or without a win with a draw in it. */
function streakOf(run: readonly FormResult[]): { what: string; n: number } | null {
  const last = run.at(-1);
  if (last === undefined) return null;
  const same = trailing(run, (r) => r === last);
  if (last !== "D" && same >= DRAFT_DESK.streak) return { what: last === "W" ? "wins" : "defeats", n: same };
  const unbeaten = trailing(run, (r) => r !== "L");
  if (last !== "L" && unbeaten >= DRAFT_DESK.unbeaten && run.slice(-unbeaten).includes("D")) return { what: "without defeat", n: unbeaten };
  const winless = trailing(run, (r) => r !== "W");
  if (last !== "W" && winless >= DRAFT_DESK.unbeaten && run.slice(-winless).includes("D")) return { what: "without a win", n: winless };
  return null;
}

/** A side's run going into the round, for Saturday's report: a streak the round is still to decide. */
export function goingIn(teamId: string, name: string, before: readonly FormGame[]): FormFact | null {
  const run = streakOf(before.map((g) => g.result));
  if (run === null) return null;
  const text = run.what === "wins" || run.what === "defeats" ? `${name} had ${run.what === "wins" ? "won" : "lost"} ${run.n} in a row going into the round` : `${name} were ${run.n} ${run.what} going into the round`;
  return { teamId, kind: "streak", text };
}

/** Each side's form facts for the round just played. `runs` are the settled rounds before it, oldest first. */
export function roundForm(sides: readonly RoundSide[], runs: ReadonlyMap<string, readonly FormGame[]>): FormFact[] {
  const facts: FormFact[] = [];
  const earlier = [...runs.values()].flat();
  const rounds = Math.max(0, ...[...runs.values()].map((run) => run.length));
  for (const side of sides) {
    const before = (runs.get(side.teamId) ?? []).map((g) => g.result);
    const after = [...before, resultOf(side)];
    const push = (kind: FormKind, text: string) => facts.push({ teamId: side.teamId, kind, text });

    const now = streakOf(after);
    if (now !== null) push("streak", now.what === "wins" || now.what === "defeats" ? `${side.name} have ${now.what === "wins" ? "won" : "lost"} ${now.n} in a row` : `${side.name} are ${now.n} ${now.what}`);
    const was = streakOf(before);
    // A run ends when this round's result is not the one the run was made of.
    const broken = was !== null && (was.what === "wins" ? resultOf(side) !== "W" : was.what === "defeats" ? resultOf(side) !== "L" : was.what === "without defeat" ? resultOf(side) === "L" : resultOf(side) === "W");
    if (was !== null && broken) push("streak-ended", `${possessive(side.name)} run of ${was.n} ${was.what} ended against ${side.opponent}`);
    const winless = trailing(before, (r) => r !== "W");
    if (resultOf(side) === "W" && winless >= DRAFT_DESK.formReturn) push("return-to-form", `${side.name} won for the first time in ${winless + 1} rounds`);

    // Records need a season behind them: from the league's fourth round on.
    if (rounds + 1 < DRAFT_DESK.recordsFrom) continue;
    const high = earlier.reduce<FormGame | null>((best, g) => (best === null || g.pointsFor > best.pointsFor ? g : best), null);
    if (high !== null && side.for > high.pointsFor) push("record", `${side.for} is the season's highest score`);
    const margin = side.for - side.against;
    const widest = Math.max(0, ...earlier.map((g) => g.pointsFor - g.pointsAgainst));
    if (margin > 0 && margin > widest) push("record", `${possessive(side.name)} ${margin}-point win is the season's biggest`);
    const own = runs.get(side.teamId) ?? [];
    if (own.length >= DRAFT_DESK.formReturn && side.for > Math.max(...own.map((g) => g.pointsFor))) push("season-high", `${side.for} is ${possessive(side.name)} highest score this season`);
    if (own.length >= DRAFT_DESK.formReturn && side.for < Math.min(...own.map((g) => g.pointsFor))) push("season-low", `${side.for} is ${possessive(side.name)} lowest score this season`);
  }
  return facts;
}
