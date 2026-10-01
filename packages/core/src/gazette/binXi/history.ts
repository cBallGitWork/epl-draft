import type { RosteredTeam } from "../../join/roster";
import type { DraftPick } from "../../league/fantrax/draft";
import { isActive } from "../../league/rosterStatus";
import type { LeagueTransaction } from "../../league/types";
import type { BinMan } from "./select";

// How a man came to be in nobody's squad, as positive facts only: who had him this gameweek, who
// dropped him and ahead of which gameweek, and who drafted him. Never "never owned": one page of
// transactions cannot prove a negative. That nobody drafted him is `undrafted`, said once in the brief.

export interface BinHistoryInput {
  gameweek: number;
  /** The period's squads as Fantrax stored them. */
  teams: readonly RosteredTeam[];
  /** Whether those squads are the ones fielded, so a manager naming him or benching him may be said. */
  fielded: boolean;
  transactions: readonly LeagueTransaction[];
  /** A completed draft's picks by Fantrax id; empty while no draft has completed. */
  pedigree: ReadonlyMap<string, DraftPick>;
  teamName: (teamId: string) => string;
  /** The gameweek a period scores, or null where the calendar does not place it. */
  gameweekOf: (period: number) => number | null;
}

export function binHistory(input: BinHistoryInput): (man: BinMan) => string[] {
  return (man) => {
    const facts: string[] = [];
    for (const team of input.teams) {
      const slot = team.players.find((each) => each.slot.fantraxId === man.fantraxId)?.slot;
      if (slot === undefined) continue;
      const how = !input.fielded ? "had him" : isActive(slot) ? "named him in their side" : "had him on the bench";
      facts.push(`${team.teamName} ${how} for gameweek ${input.gameweek}`);
    }
    const drop = input.transactions
      .filter((each) => each.executed && each.kind === "drop" && each.fantraxId === man.fantraxId && each.fromTeamId !== null)
      .sort((a, b) => (b.period ?? 0) - (a.period ?? 0))[0];
    if (drop?.fromTeamId) {
      const ahead = drop.period === null ? null : input.gameweekOf(drop.period);
      facts.push(`Dropped by ${input.teamName(drop.fromTeamId)}${ahead === null ? "" : ` ahead of gameweek ${ahead}`}`);
    }
    const pick = input.pedigree.get(man.fantraxId);
    if (pick !== undefined) facts.push(`Drafted by ${input.teamName(pick.teamId)}`);
    return facts;
  };
}

/** Nobody drafted him: provable once a draft has completed, and unknown before one. */
export function undrafted(pedigree: ReadonlyMap<string, unknown>): (man: BinMan) => boolean {
  return (man) => pedigree.size > 0 && !pedigree.has(man.fantraxId);
}
