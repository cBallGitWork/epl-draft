import type { PeriodRosters, RosterSlot, TeamRoster } from "../types";
import type { RawRosterItem, RawTeamRosters } from "./raw";

// `getTeamRosters` → who each manager holds this period, and who is actually
// playing. Pure, like every mapper here.
//
// Whether `?period=N` returns a past roster or a projection is untested and
// untestable until a transaction exists to tell them apart, so nothing below
// assumes either. The period is carried through verbatim.

function mapSlots(items: RawRosterItem[] | undefined): RosterSlot[] {
  if (!items) return [];
  const slots: RosterSlot[] = [];
  for (const item of items) {
    // A slot with no id names no player and cannot be joined to anything. Fantrax
    // has been observed returning exactly that, so it is dropped rather than
    // carried as an empty string that would later fail a bridge lookup.
    if (!item.id) continue;
    slots.push({
      fantraxId: item.id,
      position: item.position ?? null,
      status: item.status ?? "",
    });
  }
  return slots;
}

export function mapTeamRosters(raw: RawTeamRosters): PeriodRosters {
  const teams: TeamRoster[] = [];
  for (const [teamId, roster] of Object.entries(raw.rosters ?? {})) {
    teams.push({
      teamId,
      teamName: roster.teamName ?? "",
      slots: mapSlots(roster.rosterItems),
    });
  }
  return { period: raw.period ?? null, teams };
}
