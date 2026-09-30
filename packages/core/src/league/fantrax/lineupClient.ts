import { fxpaRead } from "./fxpa";
import type { FieldMap } from "./lineupWrite";

// The lineup save's three calls. `session` is the commissioner's cookie and `adminMode` is what lets
// it write a team he does not own (PLATFORM_NOTES, 28 Sep 2026). Map the answers with `lineupWrite.ts`.

/** One team's roster as Fantrax files it for a period; public without a session. */
export function fetchLineupState(leagueId: string, teamId: string, period: number, session?: string): Promise<unknown> {
  return fxpaRead(leagueId, "getTeamRosterInfo", { teamId, period, ...(session ? { adminMode: true } : {}) }, session);
}

/** Set every man's slot; `dryRun` asks whether it is legal and saves nothing. */
export function sendLineup(
  leagueId: string,
  write: { teamId: string; period: number; fieldMap: FieldMap; applyToFuturePeriods: boolean; dryRun: boolean },
  session: string,
): Promise<unknown> {
  return fxpaRead(
    leagueId,
    "confirmOrExecuteTeamRosterChanges",
    {
      rosterLimitPeriod: write.period,
      fantasyTeamId: write.teamId,
      daily: false,
      adminMode: true,
      ...(write.dryRun ? { confirm: true } : {}),
      applyToFuturePeriods: write.applyToFuturePeriods,
      fieldMap: write.fieldMap,
    },
    session,
  );
}

/** Set the order the bench comes on in. */
export function sendBenchOrder(
  leagueId: string,
  write: { teamId: string; period: number; order: Record<string, number> },
  session: string,
): Promise<unknown> {
  return fxpaRead(
    leagueId,
    "setAutoSubsOrder",
    { teamId: write.teamId, period: write.period, adminMode: true, autoSubOrderMap: write.order },
    session,
  );
}
