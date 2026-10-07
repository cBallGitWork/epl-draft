import type { ReactNode } from "react";
import { Withheld } from "./sides";
import { teamDisplay } from "../../../squads";
import type { CategoryBand, Club, LeagueTeam, RosteredTeam } from "@epl/core";
import { isResolved, playerName } from "@epl/core";
import type { LineupDetail } from "@epl/core";
import Section from "../../../components/shell/Section";
import CategoryBands, { type Names } from "../../../components/league/CategoryBands";
import SideStats from "./SideStats";
import { everyone } from "./subs";

// Stats' boards: the fantasy report (where the scoreline came from) and one manager's board. `wider.tsx`
// holds the boards that place the tie rather than explain it.

/** What every shared board needs of one side, once the gate has had its say. */
export interface SharedSide {
  team: LeagueTeam;
  roster: RosteredTeam | undefined;
  shown: boolean;
  detail: LineupDetail | undefined;
  names: Names;
  withheld: ReactNode;
}

/** Where the scoreline came from, by category; whose figures and which eleven go in the aside (Craig, 11 Sep 2026). */
export function StatsTab({
  bands,
  names,
  theirNames,
  withheld,
  played,
  fielded,
}: {
  bands: readonly CategoryBand[];
  names: Names;
  theirNames: Names;
  withheld: ReactNode;
  played: boolean;
  fielded: boolean;
}) {
  return (
    <Section
      title="By category"
      aside={`Fantrax's own${played ? (fielded ? " · the stored eleven" : " · today's squads") : ""}`}
    >
      <CategoryBands
        bands={bands}
        names={names}
        theirNames={theirNames}
        withheld={withheld}
      />
    </Section>
  );
}

/** One manager's board, or the panel saying his eleven is not public yet. */
export function SideTab({
  side,
  ...board
}: { side: SharedSide } & Omit<Parameters<typeof SideStats>[0], "team" | "sheet">) {
  return side.detail === undefined ? (
    <>{side.withheld}</>
  ) : (
    <SideStats team={side.team} sheet={side.detail} {...board} />
  );
}

/** Each man's name and club by `fantraxId`; built only for a side the gate has opened, so a band cannot leak one. */
function namesOf(roster: RosteredTeam | undefined, detail: LineupDetail | undefined): Names {
  const clubs = new Map((detail === undefined ? [] : everyone(detail)).map((man) => [man.rostered.slot.fantraxId, man.club]));
  const names = new Map<string, { name: string; club: Club | undefined }>();
  for (const rostered of roster?.players ?? []) {
    const id = rostered.slot.fantraxId;
    names.set(id, { name: isResolved(rostered) ? playerName(rostered) : id, club: clubs.get(id) });
  }
  return names;
}

/** What the shared boards need of each side, in the URL's order: a gated side has no detail and no name map, so
 *  nothing on a board can name his eleven. */
export function sharedSides({
  pairing,
  rostered,
  shows,
  arranged,
  squads,
  mine,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  arranged: Map<string, LineupDetail>;
  squads: Parameters<typeof teamDisplay>[0];
  mine: string | null;
}): [SharedSide, SharedSide] {
  const one = (team: LeagueTeam): SharedSide => {
    const roster = rostered.get(team.teamId);
    const shown = roster !== undefined && shows(team);
    const detail = shown ? arranged.get(team.teamId) : undefined;
    return {
      team,
      roster,
      shown,
      detail,
      names: shown ? namesOf(roster, detail) : new Map(),
      withheld: (
        <Withheld
          team={team}
          known={roster !== undefined}
          because={teamDisplay(squads, team.teamId === mine)}
        />
      ),
    };
  };
  return [one(pairing.team), one(pairing.opponent)];
}

/** The withholding, said once and full width: an empty column would read as "registered nothing". Null when both are open. */
export function withheldNotice(sides: readonly SharedSide[]): ReactNode {
  const gated = sides.filter((side) => !side.shown);
  return gated.length === 0 ? null : <>{gated.map((side) => side.withheld)}</>;
}
