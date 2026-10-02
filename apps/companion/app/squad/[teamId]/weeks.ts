import type { Round } from "../../round";

/** Where a week stands against the open one: locked (played or in play), the open week, or ahead of it; null when either is unknown. */
export type WeekStanding = "locked" | "open" | "ahead";

export function weekStanding(shown: Round | null, open: Round | null): WeekStanding | null {
  if (shown === null || open === null) return null;
  return shown.period < open.period ? "locked" : shown.period === open.period ? "open" : "ahead";
}

export interface GameweekOption {
  period: number;
  /** The period's opening gameweek, which is what `?gw=` names. */
  gameweek: number;
  label: string;
}

/** One option per period the league's calendar places, in period order; a period with no gameweek is skipped. */
export function gameweekOptions(calendar: readonly { period: number; gameweeks: readonly number[] }[]): GameweekOption[] {
  return [...calendar]
    .sort((a, b) => a.period - b.period)
    .flatMap(({ period, gameweeks }) => {
      const [first] = gameweeks;
      if (first === undefined) return [];
      const label = gameweeks.length === 1 ? `Gameweek ${first}` : `Gameweeks ${gameweeks.join(" & ")}`;
      return [{ period, gameweek: first, label }];
    });
}

/** The picker for the week on screen, or null when the calendar cannot place it. */
export function gameweekPicker(
  calendar: readonly { period: number; gameweeks: readonly number[] }[],
  shown: Round | null,
): { shown: number; options: GameweekOption[] } | null {
  const options = gameweekOptions(calendar);
  const selected = options.find((option) => option.period === shown?.period);
  return selected === undefined ? null : { shown: selected.gameweek, options };
}
