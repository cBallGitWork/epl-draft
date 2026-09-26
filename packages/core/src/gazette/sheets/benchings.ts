import { SHEETS } from "../../config";
import type { RecentGame } from "../predictions/sides";
import { isBack, sitsFor, startsFor, type Sheet, type SheetMan } from "./sheet";

// A benched man whose form says he could be playing (Craig, 26 Sep 2026: "benched despite getting
// a goal/assist last week"): a return last time out, or goals and assists over his last few rounds.

export interface Benching {
  man: SheetMan;
  /** What he did last time out, and over the rounds read. */
  last: RecentGame;
  rounds: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  /** He was benched on this side's last sheet too. */
  again: boolean;
  /** He started on this side's last sheet, so he is dropped. */
  dropped: boolean;
}

export function benchings(sheet: Sheet, recent: (man: SheetMan) => readonly RecentGame[], before: Sheet | undefined): Benching[] {
  const found = sheet.bench.flatMap((man): Benching[] => {
    const games = recent(man).slice(-SHEETS.formRounds);
    const last = games.at(-1);
    if (last === undefined) return [];
    const back = isBack(man.slot);
    const sum = (key: "goals" | "assists" | "cleanSheets") => games.reduce((total, game) => total + game[key], 0);
    const returned = last.goals > 0 || last.assists > 0 || (back && last.minutes > 0 && last.cleanSheets > 0);
    if (!returned && sum("goals") + sum("assists") < SHEETS.benchForm) return [];
    return [{
      man,
      last,
      rounds: games.length,
      goals: sum("goals"),
      assists: sum("assists"),
      cleanSheets: back ? sum("cleanSheets") : 0,
      again: before !== undefined && sitsFor(before, man.fantraxId),
      dropped: before !== undefined && startsFor(before, man.fantraxId),
    }];
  });
  return found
    .sort((a, b) => b.last.goals + b.last.assists - (a.last.goals + a.last.assists) || b.goals + b.assists - (a.goals + a.assists))
    .slice(0, SHEETS.benchings);
}
