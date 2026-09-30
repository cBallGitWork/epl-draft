import type { MatchupState } from "./state";
import type { DraftSide } from "./types";

// A match-up's running score, as the page prints it under the score: after each London day on which it moved, then after
// the substitutions when they change it (Craig's "Fri 0-11 · Sat 16-26 · Sun 37-38 · Subs 40-38").

export interface StoryDraftStep {
  /** The London day, `2026-09-26`; null for the substitutions. */
  day: string | null;
  home: number;
  away: number;
}

const upTo = (side: DraftSide, day: string) => side.byDay.filter((d) => d.day <= day).reduce((sum, d) => sum + d.points, 0);

export function runningScore(state: MatchupState): StoryDraftStep[] {
  const { home, away } = state;
  const days = [...new Set([...home.side.byDay, ...away.side.byDay].map((d) => d.day))].sort();
  const steps: StoryDraftStep[] = [];
  for (const day of days) {
    const was = steps.at(-1) ?? { home: 0, away: 0 };
    const step = { day, home: upTo(home.side, day), away: upTo(away.side, day) };
    if (step.home !== was.home || step.away !== was.away) steps.push(step);
  }
  const subs = home.total !== (home.side.total ?? 0) || away.total !== (away.side.total ?? 0);
  return subs ? [...steps, { day: null, home: home.total, away: away.total }] : steps;
}
