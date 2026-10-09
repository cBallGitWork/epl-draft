import { benchings, type Benching } from "./benchings";
import { changesBetween, debuts, type SheetChanges } from "./changes";
import { crossovers, type ClubPair, type Crossover } from "./crossovers";
import { starterFlags, type FlagInput, type StarterFlag } from "./flags";
import { inForm, type InForm } from "./form";
import type { RecentGame } from "../predictions/sides";
import { fielded, formation, type Sheet, type SheetMan } from "./sheet";

// Everything the team-news article may say, per head-to-head. Pure: the edge reads the rosters,
// the match reads, the news and the fixtures, and hands them here as data.

export interface TeamFacts {
  sheet: Sheet;
  formation: string | null;
  /** Null on a side's first sheet. */
  changes: SheetChanges | null;
  /** Null when there is no earlier sheet to be new against. */
  debuts: SheetMan[] | null;
  benchings: Benching[];
  flags: StarterFlag[];
  form: InForm[];
  /** What the paper wrote about this side last round, so this one does not repeat it. */
  lastWrote: string | null;
}

export interface TieFacts {
  home: TeamFacts;
  away: TeamFacts;
  meets: Crossover[];
}

interface SheetsInput extends FlagInput {
  pairings: readonly { home: { teamId: string }; away: { teamId: string } }[];
  /** This round's sheets, and each side's earlier fielded ones, oldest first. */
  sheets: ReadonlyMap<string, Sheet>;
  history: ReadonlyMap<string, readonly Sheet[]>;
  /** The round's real fixtures, as club pairs. */
  fixtures: readonly ClubPair[];
  lastWrote: ReadonlyMap<string, string>;
  /** His last few rounds' match reads, oldest first. */
  recent: (man: SheetMan) => readonly RecentGame[];
}

/** One entry per head-to-head whose two sides both fielded a sheet. */
export function sheetsFacts(input: SheetsInput): TieFacts[] {
  const team = (teamId: string): TeamFacts | null => {
    const sheet = input.sheets.get(teamId);
    if (sheet === undefined || !fielded(sheet)) return null;
    const history = (input.history.get(teamId) ?? []).filter(fielded);
    return {
      sheet,
      formation: formation(sheet),
      changes: changesBetween(sheet, history),
      debuts: debuts(sheet, history),
      benchings: benchings(sheet, input.recent, history.at(-1)),
      flags: starterFlags(sheet, input),
      form: inForm(sheet, input.recent),
      lastWrote: input.lastWrote.get(teamId) ?? null,
    };
  };
  return input.pairings.flatMap((pairing) => {
    const home = team(pairing.home.teamId);
    const away = team(pairing.away.teamId);
    return home === null || away === null ? [] : [{ home, away, meets: crossovers(home.sheet, away.sheet, input.fixtures) }];
  });
}
