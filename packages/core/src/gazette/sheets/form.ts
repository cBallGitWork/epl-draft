import { SHEETS } from "../../config";
import type { RecentGame } from "../predictions/sides";
import type { Sheet, SheetMan } from "./sheet";

// A man in form over his last few rounds: goals in every one, goals piling up, or a keeper or
// defender who has not conceded. Football facts off the match reads, never fantasy points.

export interface InForm {
  man: SheetMan;
  /** Rounds read, and how many of them he played in. */
  rounds: number;
  played: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  /** Scored, or kept a clean sheet, in every round read. */
  scoredEvery: boolean;
  cleanEvery: boolean;
}

const BACK = new Set(["G", "D"]);

/** The side's starters in form, by goals and assists; a few a side. A benched man's form is his
 *  benching's story (`benchings.ts`), not a second line. */
export function inForm(sheet: Sheet, recent: (man: SheetMan) => readonly RecentGame[]): InForm[] {
  const read = (man: SheetMan): InForm[] => {
    const games = recent(man).slice(-SHEETS.formRounds);
    const played = games.filter((game) => game.minutes > 0);
    if (games.length < SHEETS.formRounds || played.length === 0) return [];
    const sum = (key: "goals" | "assists" | "cleanSheets") => played.reduce((total, game) => total + game[key], 0);
    const form: InForm = {
      man,
      rounds: games.length,
      played: played.length,
      goals: sum("goals"),
      assists: sum("assists"),
      cleanSheets: sum("cleanSheets"),
      scoredEvery: games.every((game) => game.goals > 0),
      cleanEvery: BACK.has(man.slot) && games.every((game) => game.minutes > 0 && game.cleanSheets > 0),
    };
    const hot = form.scoredEvery || form.cleanEvery || form.goals >= SHEETS.formGoals || form.goals + form.assists >= SHEETS.formInvolvements;
    return hot ? [form] : [];
  };
  return sheet.starters
    .flatMap(read)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, SHEETS.form);
}
