import { weekdayOfDay } from "../../time";
import type { MatchupState } from "./state";
import { timeline } from "./timeline";

// A match-up's running score, as the page prints it under the score: after each London day on which it moved, then after
// the substitutions when they change it: "Fri 0-11 · Sat 16-26 · Sun 37-38 · Subs 40-38".

export interface StoryDraftStep {
  /** The London day, `2026-09-26`; null for the substitutions. */
  day: string | null;
  home: number;
  away: number;
}

/** "Sat", or "Subs" for the substitutions' step. */
export const stepLabel = (step: StoryDraftStep) => (step.day === null ? "Subs" : weekdayOfDay(step.day));

/** The timeline's running score, a step for each beat that moved it. */
export function runningScore(state: MatchupState): StoryDraftStep[] {
  const steps: StoryDraftStep[] = [];
  for (const beat of timeline(state)) {
    const was = steps.at(-1) ?? { home: 0, away: 0 };
    if (beat.score.home !== was.home || beat.score.away !== was.away) steps.push({ day: beat.day, home: beat.score.home, away: beat.score.away });
  }
  return steps;
}
