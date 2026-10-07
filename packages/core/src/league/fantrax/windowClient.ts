import { POOL_PAGE_SIZE } from "../../config";
import { fxpaRead } from "./fxpa";
import type { PositionGroup, RawPlayerStats } from "./playerStats";

/** The pool's points over one date range, `YYYY-MM-DD` both ends: a period's own dates give its points exactly.
 *  A group adds its raw stats. */
export function fetchPoolWindow(
  leagueId: string,
  window: { startDate: string; endDate: string },
  status: "ALL" | "ALL_AVAILABLE",
  positionOrGroup?: PositionGroup,
): Promise<RawPlayerStats> {
  return fxpaRead(leagueId, "getPlayerStats", {
    statusOrTeamFilter: status,
    pageNumber: "1",
    maxResultsPerPage: String(POOL_PAGE_SIZE),
    timeframeTypeCode: "BY_DATE",
    startDate: window.startDate,
    endDate: window.endDate,
    ...(positionOrGroup ? { positionOrGroup } : {}),
  }) as Promise<RawPlayerStats>;
}
